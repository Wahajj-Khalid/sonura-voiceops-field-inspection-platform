import os
import sys
import json
import logging
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
from app.domain.models import RAGQuery, InspectionStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sonura-voice-agent")

_lazy_rag_adapter = None
_lazy_db_adapter = None

def get_rag_adapter():
    global _lazy_rag_adapter
    if _lazy_rag_adapter is None:
        from app.adapters.rag.vector_rag_adapter import VectorRAGAdapter
        _lazy_rag_adapter = VectorRAGAdapter()
    return _lazy_rag_adapter

def get_db_adapter():
    global _lazy_db_adapter
    if _lazy_db_adapter is None:
        from app.adapters.db.supabase_adapter import SupabaseAdapter
        _lazy_db_adapter = SupabaseAdapter()
    return _lazy_db_adapter

class SonuraInspectionAgent(Agent):
    def __init__(self, inspection_id: str, system_prompt: str, ctx: JobContext):
        super().__init__(instructions=system_prompt)
        self.inspection_id = inspection_id
        self.ctx = ctx

    @function_tool()
    async def query_technical_manual(self, context: RunContext, query: str) -> str:
        """Query technical equipment manuals or safety specs using local vector RAG search."""
        logger.info(f"[TOOL CALL] Querying RAG Manual: {query}")
        try:
            rag_service = get_rag_adapter()
            result = await rag_service.query_knowledge_base(RAGQuery(query=query, top_k=2))
            
            data_packet = json.dumps({
                "type": "transcript",
                "sender": "agent",
                "text": f"Manual Spec: {result.answer[:140]}"
            })
            await self.ctx.room.local_participant.publish_data(data_packet.encode("utf-8"), reliable=True)
            return result.answer
        except Exception as e:
            logger.error(f"Error querying RAG manual: {str(e)}")
            return "Unable to access technical manuals at this moment."

    @function_tool()
    async def log_checklist_response(
        self, 
        context: RunContext, 
        item_id: str,
        response: str
    ) -> str:
        """Log a measurement or verification status for a specific checklist item ID (e.g. '1', '2', '3', '4')."""
        logger.info(f"[TOOL CALL] Log Request: item_id='{item_id}', response='{response}'")
        
        db_service = get_db_adapter()
        inspection = await db_service.get_inspection(self.inspection_id)
        if not inspection:
            return "Error: Inspection record not found in database."

        clean_id = str(item_id).strip()
        target_item = None

        for item in inspection.items:
            if str(item.item_id).strip() == clean_id:
                target_item = item
                break

        if not target_item:
            clean_lower = clean_id.lower()
            for item in inspection.items:
                q_lower = item.question.lower()
                if clean_lower in q_lower or any(word in q_lower for word in clean_lower.split() if len(word) > 4):
                    target_item = item
                    break

        if not target_item:
            for item in inspection.items:
                if item.status == InspectionStatus.PENDING:
                    target_item = item
                    break

        if not target_item:
            return "All checkpoints have recorded values. Ask technician if they want to submit the report."

        target_item.response = response
        target_item.status = InspectionStatus.COMPLETED

        updated_items = [item.model_dump() for item in inspection.items]
        db_service.client.table("inspections").update({"items": updated_items}).eq("id", inspection.id).execute()

        try:
            update_packet = json.dumps({
                "type": "checklist_updated",
                "item_id": target_item.item_id,
                "response": response,
                "question": target_item.question
            })
            await self.ctx.room.local_participant.publish_data(update_packet.encode("utf-8"), reliable=True)
        except Exception as err:
            logger.error(f"Failed to publish data channel packet: {err}")

        try:
            dialogue_packet = json.dumps({
                "type": "transcript",
                "sender": "agent",
                "text": f"Logged '{response}' for: {target_item.question}"
            })
            await self.ctx.room.local_participant.publish_data(dialogue_packet.encode("utf-8"), reliable=True)
        except Exception as err:
            logger.error(f"Failed to publish dialogue packet: {err}")

        remaining = sum(1 for i in updated_items if i.get("status") != InspectionStatus.COMPLETED.value)
        if remaining == 0:
            return f"Logged '{response}' for checkpoint {target_item.item_id}. All checkpoints are complete. Ask technician: 'All checkpoints are verified. Would you like me to submit the audit for supervisor review?'"
        
        return f"Logged '{response}' for checkpoint {target_item.item_id}. {remaining} checkpoints remaining."

    @function_tool()
    async def submit_audit_for_review(self, context: RunContext) -> str:
        """Submit the completed inspection for supervisor review and sign-off."""
        db_service = get_db_adapter()
        inspection = await db_service.get_inspection(self.inspection_id)
        if not inspection:
            return "Inspection not found."

        db_service.client.table("inspections").update({
            "status": InspectionStatus.COMPLETED.value
        }).eq("id", inspection.id).execute()

        db_service.client.table("notifications").insert({
            "org_id": inspection.org_id,
            "role_target": "supervisor",
            "title": f"Audit Submitted: {inspection.unit_id}",
            "message": f"Inspector {inspection.inspector_id} completed walkthrough for {inspection.unit_id}. Ready for sign-off.",
            "type": "info"
        }).execute()

        try:
            submit_packet = json.dumps({
                "type": "audit_submitted",
                "unit_id": inspection.unit_id
            })
            await self.ctx.room.local_participant.publish_data(submit_packet.encode("utf-8"), reliable=True)
        except Exception:
            pass

        return "Audit report submitted successfully for supervisor review."

async def entrypoint(ctx: JobContext):
    logger.info(f"Connecting to Voice Room: {ctx.room.name}")
    await ctx.connect()

    inspection_id = ctx.room.name.replace("inspection-unit-", "")

    db_service = get_db_adapter()
    inspection = await db_service.get_inspection(inspection_id)
    checklist_context = ""
    if inspection and inspection.items:
        lines = [f"Item ID {item.item_id}: {item.question}" for item in inspection.items]
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
                import asyncio
                asyncio.create_task(session.say(announcement))
        except Exception as e:
            logger.error(f"Error handling vision data packet: {e}")

    await session.start(room=ctx.room, agent=agent)
    await session.say("Sonura connected. What equipment item would you like to inspect first?")

if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            num_idle_processes=0
        )
    )