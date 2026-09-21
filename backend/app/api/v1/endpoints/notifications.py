from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Depends, Query
from supabase import create_client
from app.core.config import settings
from app.core.security import get_current_user
from app.domain.models import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Tenant Notifications"])

def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    query: Optional[str] = Query(None, description="Search keyword in title or message"),
    type_filter: Optional[str] = Query(None, description="Filter by notification type"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: dict = Depends(get_current_user)
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    user_id = current_user.get("id")
    user_role = current_user.get("role", "inspector").lower()

    try:
        db_query = client.table("notifications").select("*")
        
        if current_user.get("role") != "super_admin":
            filter_conditions = f"and(org_id.eq.{org_id},or(user_id.eq.{user_id},role_target.eq.{user_role},and(user_id.is.null,role_target.is.null)))"
            db_query = db_query.or_(filter_conditions)

        if type_filter and type_filter != "all":
            db_query = db_query.eq("type", type_filter.lower().strip())

        is_desc = sort_order.lower() == "desc"
        db_query = db_query.order("created_at", desc=is_desc).limit(100)

        res = db_query.execute()
        rows = res.data or []

        if query and query.strip():
            clean_q = query.lower().strip()
            rows = [
                r for r in rows 
                if clean_q in r.get("title", "").lower() or clean_q in r.get("message", "").lower()
            ]

        return [NotificationResponse(**item) for item in rows]
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
        if not res.data:
            raise HTTPException(status_code=404, detail="Notification not found.")
        return {"status": "success", "message": "Notification marked as read."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update notification: {str(e)}")

@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    user_id = current_user.get("id")
    user_role = current_user.get("role", "inspector").lower()

    try:
        query = client.table("notifications").update({"read": True})
        if current_user.get("role") != "super_admin":
            query = query.eq("org_id", org_id).or_(f"user_id.eq.{user_id},role_target.eq.{user_role},and(user_id.is.null,role_target.is.null)")
        else:
            query = query.not_.is_("id", "null")

        res = query.execute()
        return {"status": "success", "message": "All notifications marked as read."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark all notifications as read: {str(e)}")

@router.delete("/{notification_id}", status_code=status.HTTP_200_OK)
async def delete_single_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    client = get_supabase_client()
    try:
        res = client.table("notifications").delete().eq("id", notification_id).execute()
        return {"status": "success", "deleted_id": notification_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete notification: {str(e)}")

@router.delete("/clear-all", status_code=status.HTTP_200_OK)
async def clear_all_notifications(
    current_user: dict = Depends(get_current_user)
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    user_id = current_user.get("id")
    user_role = current_user.get("role", "inspector").lower()

    try:
        query = client.table("notifications").delete()
        if current_user.get("role") != "super_admin":
            query = query.eq("org_id", org_id).or_(f"user_id.eq.{user_id},role_target.eq.{user_role},and(user_id.is.null,role_target.is.null)")
        else:
            query = query.not_.is_("id", "null")

        query.execute()
        return {"status": "success", "message": "All notifications cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear notifications: {str(e)}")