import uuid
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status, Depends
from supabase import create_client
from app.core.config import settings
from app.core.security import get_current_user, require_roles, hash_password
from app.domain.models import TeamMemberCreate, TeamMemberSafetyCheck, TeamMemberResponse

logger = logging.getLogger("team-endpoint")
router = APIRouter(prefix="/team", tags=["Team Members"])

def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

class TeamMemberUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = None
    is_active: Optional[bool] = None

class TeamMemberStatusToggleRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = Field(None, description="Administrative reason for status change")

class TeamMemberReassignAndDeleteRequest(BaseModel):
    reassign_to_inspector: Optional[str] = Field(None, description="Inspector name to reassign pending sites to")

@router.get("/", response_model=List[TeamMemberResponse])
async def list_team_members(current_user: dict = Depends(get_current_user)):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    try:
        query = client.table("team_members").select("*").order("created_at", desc=True)
        if current_user.get("role") != "super_admin":
            query = query.eq("org_id", org_id)

        res = query.execute()
        return [
            TeamMemberResponse(
                id=item["id"],
                org_id=item["org_id"],
                name=item["name"],
                email=item["email"],
                role=item["role"],
                audits_count=item.get("audits_count", 0),
                is_active=item.get("is_active", True),
                created_at=item["created_at"]
            )
            for item in res.data or []
        ]
    except Exception as e:
        logger.error(f"Failed to fetch team members: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve team members.")

@router.patch("/{member_id}/status", response_model=TeamMemberResponse)
async def toggle_team_member_status(
    member_id: str,
    payload: TeamMemberStatusToggleRequest,
    current_user: dict = Depends(require_roles(["org_admin", "super_admin"]))
):
    client = get_supabase_client()
    user_org = current_user.get("org_id")
    user_role = current_user.get("role", "inspector")

    query = client.table("team_members").select("*").eq("id", member_id)
    if user_role != "super_admin":
        query = query.eq("org_id", user_org)

    check = query.execute()
    if not check.data or len(check.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team member not found in your organization.")

    target = check.data[0]
    if target.get("role") == "Org Admin" and user_role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Super Administrators can suspend an Organization Administrator.")

    try:
        res = client.table("team_members").update({"is_active": payload.is_active}).eq("id", member_id).execute()
        updated = res.data[0]

        status_text = "restored" if payload.is_active else "suspended"
        client.table("notifications").insert({
            "org_id": target.get("org_id"),
            "user_id": member_id,
            "title": f"Account Access {status_text.capitalize()}",
            "message": f"Your account access was {status_text} by an administrator. Reason: {payload.reason or 'Administrative update.'}",
            "type": "info" if payload.is_active else "danger"
        }).execute()

        return TeamMemberResponse(
            id=updated["id"],
            org_id=updated["org_id"],
            name=updated["name"],
            email=updated["email"],
            role=updated["role"],
            audits_count=updated.get("audits_count", 0),
            is_active=updated.get("is_active", True),
            created_at=updated["created_at"]
        )
    except Exception as e:
        logger.error(f"Failed to toggle member status: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update member status.")

@router.get("/{member_id}/safety-check", response_model=TeamMemberSafetyCheck)
async def check_team_member_safety(
    member_id: str,
    current_user: dict = Depends(require_roles(["org_admin", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")

    query = client.table("team_members").select("id, name, role").eq("id", member_id)
    if current_user.get("role") != "super_admin":
        query = query.eq("org_id", org_id)

    member_res = query.execute()
    if not member_res.data or len(member_res.data) == 0:
        raise HTTPException(status_code=404, detail="Member not found in organization.")

    member = member_res.data[0]
    member_name = member["name"]

    sites_query = client.table("sites").select("unit_id, title, status").eq("assigned_inspector", member_name)
    if current_user.get("role") != "super_admin":
        sites_query = sites_query.eq("org_id", org_id)

    active_sites_res = sites_query.execute()
    assigned_sites = [
        f"{s['unit_id']} ({s['title']})" 
        for s in (active_sites_res.data or []) 
        if s.get("status") in ["in_progress", "pending"]
    ]

    can_delete = len(assigned_sites) == 0
    warning = f"Member is assigned to {len(assigned_sites)} active facility sites. Reassign sites before removal." if not can_delete else None

    return TeamMemberSafetyCheck(
        can_delete_or_suspend=can_delete,
        assigned_active_sites=assigned_sites,
        warning_message=warning
    )

@router.post("/", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def invite_team_member(
    payload: TeamMemberCreate,
    current_user: dict = Depends(require_roles(["org_admin", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    clean_email = payload.email.lower().strip()

    if current_user.get("role") != "super_admin":
        org_res = client.table("organizations").select("max_users").eq("id", org_id).execute()
        max_users = org_res.data[0].get("max_users", 25) if org_res.data else 25
        current_count = client.table("team_members").select("id", count="exact").eq("org_id", org_id).execute().count or 0
        if current_count >= max_users:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Plan user quota reached: Maximum {max_users} team members allowed for this organization. Upgrade subscription tier to invite more users."
            )

    existing = client.table("team_members").select("id").eq("email", clean_email).execute()
    if existing.data and len(existing.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{clean_email}' is already registered."
        )

    new_id = str(uuid.uuid4())
    data = {
        "id": new_id,
        "org_id": org_id,
        "name": payload.name.strip(),
        "email": clean_email,
        "role": payload.role.strip(),
        "audits_count": 0,
        "password_hash": hash_password("sonura2026"),
        "is_active": True
    }

    try:
        res = client.table("team_members").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database insertion failed.")
        
        created = res.data[0]
        return TeamMemberResponse(
            id=created["id"],
            org_id=created["org_id"],
            name=created["name"],
            email=created["email"],
            role=created["role"],
            audits_count=created.get("audits_count", 0),
            is_active=created.get("is_active", True),
            created_at=created["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating member: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create team member.")

@router.patch("/{member_id}", response_model=TeamMemberResponse)
async def update_team_member(
    member_id: str,
    payload: TeamMemberUpdateRequest,
    current_user: dict = Depends(require_roles(["org_admin", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")

    query = client.table("team_members").select("id").eq("id", member_id)
    if current_user.get("role") != "super_admin":
        query = query.eq("org_id", org_id)

    check = query.execute()
    if not check.data or len(check.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in your organization.")

    update_dict = {}
    if payload.name is not None:
        update_dict["name"] = payload.name.strip()
    if payload.role is not None:
        update_dict["role"] = payload.role.strip()
    if payload.is_active is not None:
        update_dict["is_active"] = payload.is_active

    try:
        res = client.table("team_members").update(update_dict).eq("id", member_id).execute()
        updated = res.data[0]
        return TeamMemberResponse(
            id=updated["id"],
            org_id=updated["org_id"],
            name=updated["name"],
            email=updated["email"],
            role=updated["role"],
            audits_count=updated.get("audits_count", 0),
            is_active=updated.get("is_active", True),
            created_at=updated["created_at"]
        )
    except Exception as e:
        logger.error(f"Failed to update team member: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update team member.")

@router.delete("/{member_id}", status_code=status.HTTP_200_OK)
async def delete_team_member(
    member_id: str,
    payload: Optional[TeamMemberReassignAndDeleteRequest] = None,
    current_user: dict = Depends(require_roles(["org_admin", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")

    query = client.table("team_members").select("id, name").eq("id", member_id)
    if current_user.get("role") != "super_admin":
        query = query.eq("org_id", org_id)

    check = query.execute()
    if not check.data or len(check.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in your organization.")

    member_name = check.data[0]["name"]

    if payload and payload.reassign_to_inspector:
        reassign_name = payload.reassign_to_inspector.strip()
        client.table("sites").update({"assigned_inspector": reassign_name}).eq("org_id", org_id).eq("assigned_inspector", member_name).execute()

    try:
        client.table("team_members").delete().eq("id", member_id).execute()
        return {"status": "success", "deleted_id": member_id}
    except Exception as e:
        logger.error(f"Failed to delete member: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove team member.")