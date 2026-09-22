import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Depends
from supabase import create_client
from app.core.config import settings
from app.core.security import get_current_user
from app.ports.vision_port import VisionPort
from app.ports.db_port import DatabasePort
from app.adapters.vision.gemini_vision_adapter import GeminiVisionAdapter
from app.adapters.db.supabase_adapter import SupabaseAdapter

router = APIRouter(prefix="/vision", tags=["Multimodal Vision AI"])

def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def get_database_service() -> DatabasePort:
    return SupabaseAdapter()

@router.post("/analyze-photo")
async def analyze_equipment_photo(
    file: UploadFile = File(...),
    unit_id: str = Form(...),
    x_custom_gemini_key: Optional[str] = Header(None, description="Ephemeral Gemini API Key for session testing"),
    current_user: dict = Depends(get_current_user),
    db_service: DatabasePort = Depends(get_database_service)
) -> Dict[str, Any]:
    client = get_supabase_client()
    photo_id = str(uuid.uuid4())
    file_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"
    file_ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    storage_path = f"{unit_id}/{photo_id}.{file_ext}"

    user_org = current_user.get("org_id")
    inspection = await db_service.get_inspection(unit_id, org_id=user_org)
    if not inspection:
        raise HTTPException(status_code=404, detail=f"Inspection for unit '{unit_id}' not found.")

    questions = [item.question for item in inspection.items]

    try:
        client.storage.from_("inspection-photos").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": mime_type, "upsert": "true"}
        )
    except Exception:
        pass

    vision_service = GeminiVisionAdapter(api_key=x_custom_gemini_key)
    analysis = await vision_service.analyze_defect_image(file_bytes, mime_type, questions)

    signed_url = ""
    try:
        signed_res = client.storage.from_("inspection-photos").create_signed_url(storage_path, 86400)
        signed_url = signed_res.get("signedURL", "")
    except Exception:
        signed_url = f"https://supabase-storage-placeholder/{storage_path}"

    updated_items = [item.model_dump() for item in inspection.items]
    matched_item_id = None

    if analysis.get("defect_detected"):
        keyword = analysis.get("matched_checklist_keyword", "").lower().strip()
        matched_index = -1
        
        if keyword:
            for idx, item in enumerate(updated_items):
                q_text = item["question"].lower()
                if keyword in q_text or any(k in q_text for k in keyword.split() if len(k) > 2):
                    matched_index = idx
                    break

        if matched_index != -1:
            updated_items[matched_index]["flagged"] = True
            updated_items[matched_index]["status"] = "flagged"
            updated_items[matched_index]["response"] = f"DEFECT DETECTED: {analysis['defect_summary']}"
            matched_item_id = updated_items[matched_index]["item_id"]

    photo_meta = {
        "id": photo_id,
        "storage_path": storage_path,
        "signed_url": signed_url,
        "defect_summary": analysis.get("defect_summary"),
        "severity": analysis.get("severity"),
        "timestamp": inspection.updated_at.isoformat()
    }

    current_res = client.table("inspections").select("photo_attachments").eq("id", inspection.id).execute()
    current_attachments = current_res.data[0].get("photo_attachments") or [] if current_res.data else []
    current_attachments.append(photo_meta)

    client.table("inspections").update({
        "items": updated_items,
        "photo_attachments": current_attachments
    }).eq("id", inspection.id).execute()

    return {
        "status": "success",
        "photo_id": photo_id,
        "photo_url": signed_url,
        "analysis": analysis,
        "matched_item_id": matched_item_id
    }