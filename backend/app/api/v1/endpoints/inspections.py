import asyncio
import httpx
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from app.domain.models import InspectionCreate, InspectionResponse, InspectionStatus, InspectionItem
from app.ports.db_port import DatabasePort
from app.adapters.db.supabase_adapter import SupabaseAdapter
from app.agent.audit_analyzer import AuditAnalyzer
from app.core.security import get_current_user, require_roles

logger = logging.getLogger("inspections-endpoint")
router = APIRouter()

def get_db() -> DatabasePort:
    return SupabaseAdapter()

class SupervisorReviewRequest(BaseModel):
    status: str
    reviewer_notes: Optional[str] = None
    webhook_url: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None

class ItemsUpdateRequest(BaseModel):
    items: List[InspectionItem]
    status: Optional[str] = None

async def dispatch_webhook_with_retry(webhook_url: str, payload: dict, max_retries: int = 3):
    if not webhook_url:
        return
    delay = 1.0
    for attempt in range(1, max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.post(webhook_url, json=payload)
                if res.status_code in [200, 201, 202, 204]:
                    logger.info(f"Outbound webhook delivered to {webhook_url} on attempt {attempt}")
                    return
        except Exception as err:
            logger.warning(f"Webhook dispatch attempt {attempt} failed: {err}")
        if attempt < max_retries:
            await asyncio.sleep(delay)
            delay *= 2.0
    logger.error(f"All {max_retries} webhook delivery attempts failed for {webhook_url}")

@router.post("/", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
async def create_inspection(
    payload: InspectionCreate,
    current_user: dict = Depends(get_current_user),
    db: DatabasePort = Depends(get_db)
):
    try:
        user_org = current_user.get("org_id")
        return await db.create_inspection(payload, org_id=user_org)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Insertion Error: {str(e)}")

@router.get("/{inspection_id}", response_model=InspectionResponse)
async def get_inspection(
    inspection_id: str,
    current_user: dict = Depends(get_current_user),
    db: DatabasePort = Depends(get_db)
):
    user_org = current_user.get("org_id")
    inspection = await db.get_inspection(inspection_id, org_id=user_org)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")
    return inspection

@router.get("/", response_model=List[InspectionResponse])
async def list_inspections(
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
    db: DatabasePort = Depends(get_db)
):
    user_org = current_user.get("org_id")
    return await db.list_inspections(org_id=user_org, limit=limit, offset=offset)

@router.post("/{inspection_id}/analyze")
async def analyze_inspection_with_ai(
    inspection_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    user_org = current_user.get("org_id")
    result = await AuditAnalyzer.evaluate_inspection(inspection_id, org_id=user_org)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/{inspection_id}/report")
async def generate_inspection_report(
    inspection_id: str,
    current_user: dict = Depends(get_current_user),
    db: DatabasePort = Depends(get_db)
) -> Dict[str, Any]:
    user_org = current_user.get("org_id")
    inspection = await db.get_inspection(inspection_id, org_id=user_org)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    completed_items = [item for item in inspection.items if item.status == InspectionStatus.COMPLETED]
    total_items = len(inspection.items)
    pass_rate = round((len(completed_items) / total_items) * 100, 1) if total_items > 0 else 0

    has_flagged = any(item.flagged for item in inspection.items)
    risk_level = "CRITICAL DEFECT" if has_flagged else "LOW RISK"

    executive_summary = inspection.transcript_summary or (
        f"Official compliance walkthrough for Unit {inspection.unit_id} completed with a "
        f"{pass_rate}% verified score. All primary safety checkpoints were verified using "
        f"hands-free AI voice telemetry and cross-referenced with technical safety documentation."
    )

    client = SupabaseAdapter().client
    res = client.table("inspections").select("photo_attachments, audio_url").eq("unit_id", inspection.unit_id).execute()
    photos = res.data[0].get("photo_attachments") or [] if res.data else []
    audio_path = res.data[0].get("audio_url") if res.data else None

    signed_audio_url = None
    if audio_path:
        try:
            signed_res = client.storage.from_("inspection-audio").create_signed_url(audio_path, 3600)
            signed_audio_url = signed_res.get("signedURL")
        except Exception:
            signed_audio_url = None

    return {
        "certificate_id": f"CERT-{inspection.unit_id}-{inspection.id[:8].upper()}",
        "unit_id": inspection.unit_id,
        "title": inspection.title,
        "inspector_id": inspection.inspector_id,
        "timestamp": inspection.updated_at.isoformat(),
        "overall_status": inspection.status,
        "status": inspection.status,
        "pass_rate": f"{pass_rate}%",
        "risk_level": risk_level,
        "executive_summary": executive_summary,
        "ai_summary": executive_summary,
        "verified_items": [item.model_dump() for item in inspection.items],
        "items": [item.model_dump() for item in inspection.items],
        "photo_attachments": photos,
        "audio_url": signed_audio_url,
        "compliance_officer": "Automated Sonura AI Quality Assurance Engine"
    }

@router.patch("/{inspection_id}/items", response_model=InspectionResponse)
async def update_inspection_items(
    inspection_id: str,
    payload: ItemsUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: DatabasePort = Depends(get_db)
):
    client = SupabaseAdapter().client
    user_org = current_user.get("org_id")
    
    update_data = {
        "items": [item.model_dump() for item in payload.items],
    }
    if payload.status:
        update_data["status"] = payload.status

    query = client.table("inspections").update(update_data)
    if user_org != "00000000-0000-0000-0000-000000000000":
        query = query.eq("org_id", user_org)

    res = query.eq("unit_id", inspection_id).execute()
    if not res.data:
        res = client.table("inspections").update(update_data).eq("id", inspection_id).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    return InspectionResponse(**res.data[0])

@router.patch("/{inspection_id}/status")
async def update_inspection_status_route(
    inspection_id: str,
    payload: StatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: DatabasePort = Depends(get_db)
):
    client = SupabaseAdapter().client
    user_org = current_user.get("org_id")
    new_status = payload.status.lower().strip()
    update_data = {"status": new_status}
    if payload.notes:
        update_data["transcript_summary"] = payload.notes

    query = client.table("inspections").update(update_data)
    if user_org != "00000000-0000-0000-0000-000000000000":
        query = query.eq("org_id", user_org)

    res = query.eq("unit_id", inspection_id).execute()
    if not res.data:
        res = client.table("inspections").update(update_data).eq("id", inspection_id).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    return {"status": "success", "new_status": new_status}

@router.patch("/{inspection_id}/review")
async def supervisor_review_inspection(
    inspection_id: str,
    payload: SupervisorReviewRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_roles(["supervisor", "org_admin", "super_admin"])),
    db: DatabasePort = Depends(get_db)
):
    client = SupabaseAdapter().client
    user_org = current_user.get("org_id")
    new_status = payload.status.lower().strip()
    update_data = {"status": new_status}
    if payload.reviewer_notes:
        update_data["transcript_summary"] = payload.reviewer_notes

    query = client.table("inspections").update(update_data)
    if user_org != "00000000-0000-0000-0000-000000000000":
        query = query.eq("org_id", user_org)

    res = query.eq("unit_id", inspection_id).execute()
    if not res.data:
        res = client.table("inspections").update(update_data).eq("id", inspection_id).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    if payload.webhook_url:
        webhook_body = {
            "event": f"audit_{new_status}",
            "certificate_id": f"CERT-{inspection_id}",
            "unit_id": inspection_id,
            "status": new_status,
            "reviewer_notes": payload.reviewer_notes or "Supervisor sign-off recorded.",
            "system": "Sonura Enterprise AI",
            "timestamp": res.data[0].get("updated_at")
        }
        background_tasks.add_task(dispatch_webhook_with_retry, payload.webhook_url, webhook_body)

    return {"status": "success", "new_status": new_status}