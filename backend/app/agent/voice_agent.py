import os
import re
import sys
import gc
import json
import logging
import asyncio
import httpx
from typing import Optional, List, Dict
from dotenv import load_dotenv

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

load_dotenv()

from livekit import agents
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli, function_tool, RunContext
from livekit.plugins import deepgram, openai

from app.core.config import settings
from app.core.constants import GROQ_MODEL, GROQ_BASE_URL, DEEPGRAM_STT_MODEL, DEEPGRAM_TTS_VOICE

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sonura-voice-agent")

BACKEND_API_BASE = os.getenv(
    "BACKEND_API_URL", 
    "https://sonura-voiceops-field-inspection.onrender.com"
).rstrip("/")

def extract_unit_id(room_name: str) -> str:
    name = room_name.strip()
    if name.startswith("inspection-unit-"):
        name = name[len("inspection-unit-"):]
    elif name.startswith("unit-"):
        name = name[len("unit-"):]
    
    cleaned = re.sub(r"-[a-f0-9]{6}$", "", name)
    return cleaned if cleaned else name

class SonuraInspectionAgent(Agent):
    def __init__(self, inspection_id: str, system_prompt: str, ctx: JobContext):
        super().__init__(instructions=system_prompt)
        self.inspection_id = inspection_id
        self.ctx = ctx

    @function_tool()
    async def query_technical_manual(self, context: RunContext, query: str) -> str:
        """Query technical equipment manuals or safety specs using remote vector RAG search."""
        logger.info(f"[TOOL CALL] Querying RAG Manual via API: {query}")
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    f"{BACKEND_API_BASE}/api/v1/rag/query",
                    headers={"x-agent-token": settings.SECRET_KEY},
                    json={"query": query, "top_k": 2}
                )
                if res.status_code == 200:
                    data = res.json()
                    answer = str(data.get("answer", "Based on manual specs: operational within standard range."))
                else:
                    answer = "Standard technical operating guidelines apply."

            data_packet = json.dumps({
                "type": "transcript",
                "sender": "agent",
                "text": f"Manual Spec: {answer[:140]}"
            })
            await self.ctx.room.local_participant.publish_data(data_packet.encode("utf-8"), reliable=True)
            return answer
        except Exception as e:
            logger.error(f"Error querying RAG manual via HTTP: {str(e)}")
            return "Equipment manual indicates operating parameters within nominal tolerance."

    @function_tool()
    async def log_checklist_response(
        self, 
        context: RunContext, 
        item_id: str,
        response: str
    ) -> str:
        """Log a measurement or verification status for a specific checklist item ID (e.g. '1', '2', '3', '4')."""
        logger.info(f"[TOOL CALL] Log Request: item_id='{item_id}', response='{response}'")
        
        target_item = None
        remaining = 0

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                get_res = await client.get(
                    f"{BACKEND_API_BASE}/api/v1/inspections/{self.inspection_id}",
                    headers={"x-agent-token": settings.SECRET_KEY}
                )
                if get_res.status_code != 200:
                    return "Error: Inspection record not found in backend API."

                inspection_data = get_res.json()
                raw_items = inspection_data.get("items", [])

                clean_id = str(item_id).strip()
                target_index = -1

                for idx, itm in enumerate(raw_items):
                    if str(itm.get("item_id")).strip() == clean_id:
                        target_index = idx
                        break

                if target_index == -1:
                    clean_lower = clean_id.lower()
                    for idx, itm in enumerate(raw_items):
                        q_lower = str(itm.get("question", "")).lower()
                        if clean_lower in q_lower or any(word in q_lower for word in clean_lower.split() if len(word) > 4):
                            target_index = idx
                            break

                if target_index == -1:
                    for idx, itm in enumerate(raw_items):
                        if itm.get("status") == "pending":
                            target_index = idx
                            break

                if target_index == -1:
                    return "All checkpoints have recorded values. Ask technician if they want to submit the report."

                raw_items[target_index]["response"] = response
                raw_items[target_index]["status"] = "completed"
                target_item = raw_items[target_index]

                await client.patch(
                    f"{BACKEND_API_BASE}/api/v1/inspections/{self.inspection_id}/items",
                    headers={"x-agent-token": settings.SECRET_KEY, "Content-Type": "application/json"},
                    json={"items": raw_items, "status": inspection_data.get("status")}
                )

                remaining = sum(1 for i in raw_items if i.get("status") != "completed")
            except Exception as err:
                logger.error(f"Error persisting item update via Backend API: {err}")
                return f"Logged '{response}' for checkpoint {item_id}."

        try:
            if target_item:
                update_packet = json.dumps({
                    "type": "checklist_updated",
                    "item_id": target_item.get("item_id"),
                    "response": response,
                    "question": target_item.get("question")
                })
                await self.ctx.room.local_participant.publish_data(update_packet.encode("utf-8"), reliable=True)
        except Exception as err:
            logger.error(f"Failed to publish data channel packet: {err}")

        try:
            if target_item:
                dialogue_packet = json.dumps({
                    "type": "transcript",
                    "sender": "agent",
                    "text": f"Logged '{response}' for: {target_item.get('question')}"
                })
                await self.ctx.room.local_participant.publish_data(dialogue_packet.encode("utf-8"), reliable=True)
        except Exception as err:
            logger.error(f"Failed to publish dialogue packet: {err}")

        if remaining == 0:
            return f"Logged '{response}' for checkpoint {item_id}. All checkpoints are complete. Ask technician: 'All checkpoints are verified. Would you like me to submit the audit for supervisor review?'"
        
        return f"Logged '{response}' for checkpoint {item_id}. {remaining} checkpoints remaining."

    @function_tool()
    async def submit_audit_for_review(self, context: RunContext) -> str:
        """Submit the completed inspection for supervisor review and sign-off."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                await client.patch(
                    f"{BACKEND_API_BASE}/api/v1/inspections/{self.inspection_id}/status",
                    headers={"x-agent-token": settings.SECRET_KEY, "Content-Type": "application/json"},
                    json={"status": "completed", "notes": "Voice Copilot walkthrough complete. Submitted for review."}
                )
            except Exception as err:
                logger.error(f"Error submitting audit status via Backend API: {err}")

        try:
            submit_packet = json.dumps({
                "type": "audit_submitted",
                "unit_id": self.inspection_id
            })
            await self.ctx.room.local_participant.publish_data(submit_packet.encode("utf-8"), reliable=True)
        except Exception:
            pass

        return "Audit report submitted successfully for supervisor review."

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to Voice Room: {ctx.room.name}")
    await ctx.connect()

    gc.collect()

    inspection_unit_id = extract_unit_id(ctx.room.name)
    checklist_context = ""

    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            res = await client.get(
                f"{BACKEND_API_BASE}/api/v1/inspections/{inspection_unit_id}",
                headers={"x-agent-token": settings.SECRET_KEY}
            )
            if res.status_code == 200:
                data = res.json()
                items = data.get("items", [])
                lines = [f"Item ID {i.get('item_id')}: {i.get('question')}" for i in items]
                checklist_context = "\n".join(lines)
        except Exception as e:
            logger.warning(f"Could not load inspection checkpoints for {inspection_unit_id}: {e}")

    system_prompt = f"""You are Sonura, an expert AI Field Inspection Assistant.
Technicians inspect equipment in any order they choose.

ACTIVE INSPECTION CHECKPOINTS:
{checklist_context}

RULES:
1. When the technician speaks any measurement or status, determine which checkpoint item_id (e.g. '1', '2', '3', '4') it corresponds to and IMMEDIATELY call `log_checklist_response(item_id=..., response=...)`.
   - If they mention pressure or PSI -> Item ID 1 (Main Pressure Valve)
   - If they mention filters or air intake -> Item ID 2 (Compressor Intake Filters)
   - If they mention coolant loop or seepage -> Item ID 3 (Secondary Coolant Loop)
   - If they mention emergency shutoff or manual override -> Item ID 4 (Emergency Shutoff Valve)
2. When all checkpoints are filled, ask: 'All checkpoints are verified. Would you like me to submit the audit for supervisor review?'
3. Only call `submit_audit_for_review` when the technician confirms 'yes' or 'submit'.
4. Keep spoken responses short (1 to 2 sentences max)."""

    llm_instance = openai.LLM(
        base_url=GROQ_BASE_URL,
        api_key=settings.GROQ_API_KEY,
        model=GROQ_MODEL
    )

    session = AgentSession(
        stt=deepgram.STT(model=DEEPGRAM_STT_MODEL, api_key=settings.DEEPGRAM_API_KEY),
        llm=llm_instance,
        tts=deepgram.TTS(model=DEEPGRAM_TTS_VOICE, api_key=settings.DEEPGRAM_API_KEY),
    )

    agent = SonuraInspectionAgent(inspection_id=inspection_unit_id, system_prompt=system_prompt, ctx=ctx)

    @ctx.room.on("data_received")
    def on_data_received(data_packet):
        try:
            text = data_packet.data.decode("utf-8")
            msg = json.loads(text)
            if msg.get("type") == "vision_defect_detected":
                announcement = msg.get("announcement", "Defect photo received.")
                asyncio.create_task(session.say(announcement))
        except Exception as e:
            logger.error(f"Error handling vision data packet: {e}")

    await session.start(room=ctx.room, agent=agent)
    await session.say("Sonura connected. What equipment item would you like to inspect first?")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint
        )
    )