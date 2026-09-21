import uuid
import logging
from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from supabase import create_client
from app.core.config import settings
from app.core.security import get_current_user

logger = logging.getLogger("audio-storage-endpoint")
router = APIRouter(prefix="/audio", tags=["Audio Cloud Storage"])

def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.post("/upload")
async def upload_inspection_audio(
    file: UploadFile = File(...),
    unit_id: str = Form(...),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    client = get_supabase_client()
    recording_id = str(uuid.uuid4())
    file_bytes = await file.read()
    
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file contains zero bytes."
        )

    mime_type = file.content_type or "audio/webm"
    storage_path = f"{unit_id}/{recording_id}.webm"

    try:
        client.storage.from_("inspection-audio").upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": mime_type, "upsert": "true"}
        )
    except Exception as upload_err:
        logger.error(f"Failed to upload audio to Supabase Storage: {upload_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage upload failed: {str(upload_err)}"
        )

    signed_url = ""
    try:
        signed_res = client.storage.from_("inspection-audio").create_signed_url(storage_path, 3600)
        signed_url = signed_res.get("signedURL", "")
    except Exception as sign_err:
        logger.warning(f"Could not generate signed URL: {sign_err}")

    try:
        client.table("inspections").update({
            "audio_url": storage_path
        }).eq("unit_id", unit_id).execute()
    except Exception as db_err:
        logger.error(f"Failed to update inspection audio_url: {db_err}")

    return {
        "status": "success",
        "unit_id": unit_id,
        "recording_id": recording_id,
        "storage_path": storage_path,
        "signed_url": signed_url
    }

@router.get("/signed-url/{unit_id}")
async def get_audio_signed_url(
    unit_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    client = get_supabase_client()
    user_org = current_user.get("org_id")
    
    query = client.table("inspections").select("audio_url").eq("unit_id", unit_id)
    if user_org != "00000000-0000-0000-0000-000000000000":
        query = query.eq("org_id", user_org)
        
    res = query.execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Inspection record for unit '{unit_id}' not found."
        )

    storage_path = res.data[0].get("audio_url")
    if not storage_path:
        return {
            "status": "not_found",
            "unit_id": unit_id,
            "signed_url": None,
            "message": "No audio session has been recorded for this inspection yet."
        }

    try:
        signed_res = client.storage.from_("inspection-audio").create_signed_url(storage_path, 3600)
        signed_url = signed_res.get("signedURL")
        return {
            "status": "success",
            "unit_id": unit_id,
            "storage_path": storage_path,
            "signed_url": signed_url
        }
    except Exception as err:
        logger.error(f"Signed URL generation failure: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate secure audio playback URL."
        )