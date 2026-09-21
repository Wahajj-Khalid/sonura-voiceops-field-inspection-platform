from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from supabase import create_client
from app.core.config import settings
from app.core.security import get_current_user
from app.domain.models import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    current_user: dict = Depends(get_current_user)
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    user_id = current_user.get("id")
    user_role = current_user.get("role", "inspector").lower()

    try:
        query = client.table("notifications").select("*").order("created_at", desc=True).limit(25)
        
        if current_user.get("role") != "super_admin":
            # Show if target is specifically this user, or target role matches, or general org alert
            filter_conditions = f"and(org_id.eq.{org_id},or(user_id.eq.{user_id},role_target.eq.{user_role},and(user_id.is.null,role_target.is.null)))"
            query = query.or_(filter_conditions)

        res = query.execute()
        return [NotificationResponse(**item) for item in res.data or []]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")

@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    client = get_supabase_client()
    try:
        res = client.table("notifications").update({"read": True}).eq("id", notification_id).execute()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to mark notification as read.")