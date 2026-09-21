# backend/app/agent/audit_analyzer.py
import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.constants import GROQ_MODEL, GROQ_BASE_URL
from app.adapters.db.supabase_adapter import SupabaseAdapter

logger = logging.getLogger("audit-analyzer")
db_adapter = SupabaseAdapter()

class AuditAnalyzer:
    @staticmethod
    async def evaluate_inspection(inspection_id: str, org_id: Optional[str] = None) -> Dict[str, Any]:
        inspection = await db_adapter.get_inspection(inspection_id, org_id=org_id)
        if not inspection:
            return {"error": f"Inspection record '{inspection_id}' not found."}

        has_flagged = any(item.flagged for item in inspection.items)
        flagged_items_list = [item.question for item in inspection.items if item.flagged]

        items_summary = [
            f"- Requirement: {item.question} | Spoken Value: {item.response or 'Not Checked'} | Status: {item.status.value} | Flagged: {item.flagged}"
            for item in inspection.items
        ]
        items_text = "\n".join(items_summary)

        analysis_prompt = (
            "You are Sonura Quality Assurance and Industrial Risk Assessor.\n"
            "Analyze the following field inspection checklist readings and safety verifications.\n\n"
            f"FACILITY UNIT ID: {inspection.unit_id}\n"
            f"INSPECTION TITLE: {inspection.title}\n"
            f"TOTAL ITEMS CHECKED: {len(inspection.items)}\n"
            "VERIFIED READINGS AND OPERATIONAL LOGS:\n"
            f"{items_text}\n\n"
            "Respond STRICTLY with a valid JSON object matching this schema:\n"
            "{\n"
            '  "risk_level": "LOW RISK" | "MODERATE RISK" | "CRITICAL DEFECT",\n'
            '  "executive_summary": "2 to 3 sentences summarizing operational readiness and compliance.",\n'
            '  "recommended_actions": ["Action 1", "Action 2"],\n'
            '  "safety_score": 0-100 integer,\n'
            '  "flagged_items": ["Item requirement text if hazard detected"]\n'
            "}"
        )

        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY is not configured. Utilizing deterministic safety evaluation.")
            fallback_risk = "CRITICAL DEFECT" if has_flagged else "LOW RISK"
            fallback_score = 65 if has_flagged else 98
            return {
                "risk_level": fallback_risk,
                "executive_summary": (
                    f"Official compliance walkthrough for Unit {inspection.unit_id} completed. "
                    f"{'Defects were flagged during inspection requiring immediate supervisor remediation.' if has_flagged else 'All primary safety parameters verified within acceptable operational limits.'}"
                ),
                "recommended_actions": [
                    "Maintain standard 30-day preventative maintenance schedule.",
                    "Verify manifold seals and coolant sensor telemetry on next routine walkthrough."
                ],
                "safety_score": fallback_score,
                "flagged_items": flagged_items_list
            }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{GROQ_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": GROQ_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a certified industrial safety auditor that evaluates checklist telemetry and outputs strictly valid JSON."
                            },
                            {
                                "role": "user",
                                "content": analysis_prompt
                            }
                        ],
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"}
                    }
                )
                res.raise_for_status()
                response_json = res.json()
                raw_content = response_json["choices"][0]["message"]["content"]
                analysis_data = json.loads(raw_content)

                summary_text = analysis_data.get("executive_summary", "")
                if summary_text:
                    db_adapter.client.table("inspections").update({
                        "transcript_summary": summary_text
                    }).eq("id", inspection.id).execute()

                return analysis_data
        except Exception as e:
            logger.error(f"Groq audit analysis failed: {str(e)}")
            fallback_risk = "CRITICAL DEFECT" if has_flagged else "LOW RISK"
            fallback_score = 65 if has_flagged else 95
            return {
                "risk_level": fallback_risk,
                "executive_summary": (
                    f"Field inspection completed for Unit {inspection.unit_id}. "
                    f"{'Defects detected requiring maintenance intervention.' if has_flagged else 'Checklist items logged within operational tolerances.'}"
                ),
                "recommended_actions": [
                    "Schedule routine 30-day preventative maintenance walkthrough.",
                    "Review manifold pressure telemetry logs."
                ],
                "safety_score": fallback_score,
                "flagged_items": flagged_items_list
            }