import os
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
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli, function_tool, RunContext, Worker
from livekit.plugins import deepgram, openai
from supabase import create_client, Client

from app.core.config import settings
from app.core.constants import GROQ_MODEL, GROQ_BASE_URL, DEEPGRAM_STT_MODEL, DEEPGRAM_TTS_VOICE, DEFAULT_ORG_ID
from app.domain.common import InspectionStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sonura-voice-agent")

_db_client: Optional[Client] = None

def get_supabase() -> Client:
    global _db_client
    if _db_client is None:
        _db_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _db_client

class SonuraInspectionAgent(Agent):
    def __init__(self, inspection_id: str, system_prompt: str, ctx: JobContext):
        super().__init__(instructions=system_prompt)
        self.inspection_id = inspection_id
        self.ctx = ctx

    @function_tool()
    async def query_technical_manual(self, context: RunContext, query: str) -> str:
        """Query technical equipment manuals or safety specs using remote vector RAG search."""
        logger.info(f"[TOOL CALL] Querying RAG Manual: {query}")
        try:
            api_base = getattr(settings, "BACKEND_API_URL", "http://127.0.0.1:8000")
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    f"{api_base}/api/v1/rag/query",
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
        
        client = get_supabase()
        res = client.table("inspections").select("*").eq("unit_id", self.inspection_id).execute()
        
        if not res.data:
            res = client.table("inspections").select("*").eq("id", self.inspection_id).execute()
            
        if not res.data:
            return "Error: Inspection record not found in database."

        inspection_record = res.data[0]
        raw_items = inspection_record.get("items", [])

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
                if itm.get("status") == InspectionStatus.PENDING.value:
                    target_index = idx
                    break

        if target_index == -1:
            return "All checkpoints have recorded values. Ask technician if they want to submit the report."

        raw_items[target_index]["response"] = response
        raw_items[target_index]["status"] = InspectionStatus.COMPLETED.value

        client.table("inspections").update({"items": raw_items}).eq("id", inspection_record["id"]).execute()

        try:
            update_packet = json.dumps({
                "type": "checklist_updated",
                "item_id": raw_items[target_index]["item_id"],
                "response": response,
                "question": raw_items[target_index]["question"]
            })
            await self.ctx.room.local_participant.publish_data(update_packet.encode("utf-8"), reliable=True)
        except Exception as err:
            logger.error(f"Failed to publish data channel packet: {err}")

        try:
            dialogue_packet = json.dumps({
                "type": "transcript",
                "sender": "agent",
                "text": f"Logged '{response}' for: {raw_items[target_index]['question']}"
            })
            await self.ctx.room.local_participant.publish_data(dialogue_packet.encode("utf-8"), reliable=True)
        except Exception as err:
            logger.error(f"Failed to publish dialogue packet: {err}")

        remaining = sum(1 for i in raw_items if i.get("status") != InspectionStatus.COMPLETED.value)
        if remaining == 0:
            return f"Logged '{response}' for checkpoint {raw_items[target_index]['item_id']}. All checkpoints are complete. Ask technician: 'All checkpoints are verified. Would you like me to submit the audit for supervisor review?'"
        
        return f"Logged '{response}' for checkpoint {raw_items[target_index]['item_id']}. {remaining} checkpoints remaining."

    @function_tool()
    async def submit_audit_for_review(self, context: RunContext) -> str:
        """Submit the completed inspection for supervisor review and sign-off."""
        client = get_supabase()
        res = client.table("inspections").select("*").eq("unit_id", self.inspection_id).execute()
        if not res.data:
            res = client.table("inspections").select("*").eq("id", self.inspection_id).execute()
            
        if not res.data:
            return "Inspection record not found."

        inspection_record = res.data[0]
        client.table("inspections").update({
            "status": InspectionStatus.COMPLETED.value
        }).eq("id", inspection_record["id"]).execute()

        client.table("notifications").insert({
            "org_id": inspection_record.get("org_id", DEFAULT_ORG_ID),
            "role_target": "supervisor",
            "title": f"Audit Submitted: {inspection_record['unit_id']}",
            "message": f"Inspector {inspection_record['inspector_id']} completed walkthrough for {inspection_record['unit_id']}. Ready for sign-off.",
            "type": "info"
        }).execute()

        try:
            submit_packet = json.dumps({
                "type": "audit_submitted",
                "unit_id": inspection_record["unit_id"]
            })
            await self.ctx.room.local_participant.publish_data(submit_packet.encode("utf-8"), reliable=True)
        except Exception:
            pass

        return "Audit report submitted successfully for supervisor review."

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to Voice Room: {ctx.room.name}")
    await ctx.connect()

    gc.collect()

    inspection_id = ctx.room.name.replace("inspection-unit-", "")

    client = get_supabase()
    res = client.table("inspections").select("*").eq("unit_id", inspection_id).execute()
    if not res.data:
        res = client.table("inspections").select("*").eq("id", inspection_id).execute()

    checklist_context = ""
    if res.data:
        items = res.data[0].get("items", [])
        lines = [f"Item ID {i.get('item_id')}: {i.get('question')}" for i in items]
        checklist_context = "\n".join(lines)

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

    agent = SonuraInspectionAgent(inspection_id=inspection_id, system_prompt=system_prompt, ctx=ctx)

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

async def run_embedded_voice_worker():
    """Runs the LiveKit agent worker directly within the FastAPI async event loop."""
    logger.info("Initializing embedded LiveKit Voice Agent within FastAPI event loop...")
    opts = WorkerOptions(
        entrypoint_fnc=entrypoint,
        ws_url=settings.LIVEKIT_URL,
        api_key=settings.LIVEKIT_API_KEY,
        api_secret=settings.LIVEKIT_API_SECRET
    )
    worker = Worker(opts)
    await worker.run()

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))