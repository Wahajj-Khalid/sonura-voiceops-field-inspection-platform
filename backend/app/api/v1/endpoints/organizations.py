import uuid
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status, Depends
from supabase import create_client
from app.core.config import settings
from app.core.constants import PLAN_QUOTAS
from app.core.security import get_current_user, require_roles, hash_password
from app.domain.models import OrganizationProvisionRequest, OrganizationQuotaUpdate, PlatformTelemetry

logger = logging.getLogger("organizations-endpoint")
router = APIRouter(prefix="/organizations", tags=["Tenant Organizations"])

def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

class SuspendTenantRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Reason for suspension")

@router.get("/", response_model=List[Dict[str, Any]])
async def list_organizations(
    current_user: dict = Depends(require_roles(["super_admin"]))
):
    client = get_supabase_client()
    try:
        orgs_res = client.table("organizations").select("*").order("created_at", desc=True).execute()
        orgs = orgs_res.data or []

        for org in orgs:
            org_id = org.get("id")
            members_res = client.table("team_members").select("id", count="exact").eq("org_id", org_id).execute()
            sites_res = client.table("sites").select("id", count="exact").eq("org_id", org_id).execute()
            audits_res = client.table("inspections").select("id", count="exact").eq("org_id", org_id).execute()
            
            org["members_count"] = members_res.count if members_res.count is not None else 0
            org["sites_count"] = sites_res.count if sites_res.count is not None else 0
            org["audits_count"] = audits_res.count if audits_res.count is not None else 0

        return orgs
    except Exception as e:
        logger.error(f"Failed to list organizations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve tenant organizations."
        )

@router.get("/my-org")
async def get_my_organization_overview(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    try:
        org_res = client.table("organizations").select("*").eq("id", org_id).execute()
        if not org_res.data or len(org_res.data) == 0:
            raise HTTPException(status_code=404, detail="Organization record not found.")
        
        org = org_res.data[0]
        members_count = client.table("team_members").select("id", count="exact").eq("org_id", org_id).execute().count or 0
        sites_count = client.table("sites").select("id", count="exact").eq("org_id", org_id).execute().count or 0
        audits_count = client.table("inspections").select("id", count="exact").eq("org_id", org_id).execute().count or 0
        templates_count = client.table("checklist_templates").select("id", count="exact").eq("org_id", org_id).execute().count or 0

        return {
            "organization": org,
            "usage": {
                "users_used": members_count,
                "users_limit": org.get("max_users", 25),
                "sites_used": sites_count,
                "sites_limit": org.get("max_sites", 15),
                "audits_used": audits_count,
                "audits_limit": org.get("max_audits", 500),
                "storage_used_mb": 45,
                "storage_limit_mb": org.get("storage_limit_mb", 1024),
                "templates_count": templates_count
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve tenant organization overview: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load organization metrics.")

@router.get("/stats", response_model=PlatformTelemetry)
async def get_platform_telemetry(
    current_user: dict = Depends(require_roles(["super_admin"]))
):
    client = get_supabase_client()
    try:
        orgs_count = client.table("organizations").select("id", count="exact").execute().count or 0
        sites_count = client.table("sites").select("id", count="exact").execute().count or 0
        members_count = client.table("team_members").select("id", count="exact").execute().count or 0
        audits_count = client.table("inspections").select("id", count="exact").execute().count or 0
        chunks_count = client.table("manual_sections").select("id", count="exact").execute().count or 0

        return PlatformTelemetry(
            total_organizations=orgs_count,
            total_sites=sites_count,
            total_users=members_count,
            total_inspections=audits_count,
            total_vector_chunks=chunks_count,
            system_uptime="99.98%",
            active_webrtc_channels=sites_count
        )
    except Exception as e:
        logger.error(f"Telemetry calculation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate platform telemetry."
        )

@router.get("/analytics/global")
async def get_global_analytics(
    current_user: dict = Depends(require_roles(["super_admin"]))
) -> Dict[str, Any]:
    client = get_supabase_client()
    try:
        inspections_res = client.table("inspections").select("id, status, priority, created_at").execute()
        rows = inspections_res.data or []
        
        approved_count = sum(1 for r in rows if r.get("status") == "approved")
        flagged_count = sum(1 for r in rows if r.get("status") == "flagged")
        in_progress_count = sum(1 for r in rows if r.get("status") in ["in_progress", "pending"])
        total = len(rows)

        pass_rate = round((approved_count / total * 100), 1) if total > 0 else 100.0

        return {
            "total_audits": total,
            "approved_count": approved_count,
            "flagged_count": flagged_count,
            "in_progress_count": in_progress_count,
            "system_pass_rate": f"{pass_rate}%",
            "active_nodes": 4,
            "database_size": "24.8 MB",
            "vector_index_size": "14.2 MB",
            "audio_storage_size": "188.4 MB"
        }
    except Exception as e:
        logger.error(f"Failed to fetch global analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Analytics query failed.")

@router.get("/{org_id}/details")
async def get_organization_drilldown_details(
    org_id: str,
    current_user: dict = Depends(require_roles(["super_admin"]))
) -> Dict[str, Any]:
    client = get_supabase_client()
    try:
        org_res = client.table("organizations").select("*").eq("id", org_id).execute()
        if not org_res.data or len(org_res.data) == 0:
            raise HTTPException(status_code=404, detail="Organization not found.")
        
        org = org_res.data[0]
        members = client.table("team_members").select("*").eq("org_id", org_id).execute().data or []
        sites = client.table("sites").select("*").eq("org_id", org_id).execute().data or []
        templates = client.table("checklist_templates").select("*").eq("org_id", org_id).execute().data or []
        audits = client.table("inspections").select("*").eq("org_id", org_id).order("created_at", desc=True).limit(50).execute().data or []
        manuals = client.table("manual_sections").select("manual_title, category").eq("org_id", org_id).execute().data or []

        manuals_map = {}
        for m in manuals:
            title = m.get("manual_title")
            cat = m.get("category", "General")
            if title not in manuals_map:
                manuals_map[title] = {"manual_title": title, "category": cat, "chunks": 0}
            manuals_map[title]["chunks"] += 1

        approved = sum(1 for a in audits if a.get("status") == "approved")
        flagged = sum(1 for a in audits if a.get("status") == "flagged")
        total_audits = len(audits)
        pass_rate = round((approved / total_audits * 100), 1) if total_audits > 0 else 100.0

        return {
            "organization": org,
            "members": members,
            "sites": sites,
            "templates": templates,
            "audits": audits,
            "manuals": list(manuals_map.values()),
            "analytics": {
                "total_audits": total_audits,
                "approved_audits": approved,
                "flagged_audits": flagged,
                "pass_rate": f"{pass_rate}%",
                "storage_used_mb": 45
            },
            "metrics": {
                "total_users": len(members),
                "total_sites": len(sites),
                "total_templates": len(templates),
                "total_manuals": len(manuals_map),
                "total_audits": total_audits
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching organization details: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch organization details.")

@router.post("/provision", status_code=status.HTTP_201_CREATED)
async def provision_organization(
    payload: OrganizationProvisionRequest,
    current_user: dict = Depends(require_roles(["super_admin"]))
):
    client = get_supabase_client()
    new_org_id = str(uuid.uuid4())
    admin_id = str(uuid.uuid4())
    clean_org_name = payload.name.strip()
    clean_admin_email = payload.admin_email.lower().strip()
    clean_admin_name = payload.admin_name.strip()
    clean_plan = payload.plan.lower().strip()

    existing_member = client.table("team_members").select("id").eq("email", clean_admin_email).execute()
    if existing_member.data and len(existing_member.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{clean_admin_email}' already exists."
        )

    default_quotas = PLAN_QUOTAS.get(clean_plan, PLAN_QUOTAS["enterprise"])
    max_users = payload.max_users or default_quotas["max_users"]
    max_sites = payload.max_sites or default_quotas["max_sites"]
    max_audits = payload.max_audits or default_quotas["max_audits"]
    storage_limit_mb = payload.storage_limit_mb or default_quotas["storage_limit_mb"]

    try:
        org_data = {
            "id": new_org_id,
            "name": clean_org_name,
            "plan": clean_plan,
            "is_active": True,
            "max_users": max_users,
            "max_sites": max_sites,
            "max_audits": max_audits,
            "storage_limit_mb": storage_limit_mb
        }
        client.table("organizations").insert(org_data).execute()

        admin_data = {
            "id": admin_id,
            "org_id": new_org_id,
            "name": clean_admin_name,
            "email": clean_admin_email,
            "role": "Org Admin",
            "audits_count": 0,
            "password_hash": hash_password("sonura2026"),
            "is_active": True
        }
        client.table("team_members").insert(admin_data).execute()

        return {
            "status": "success",
            "message": f"Successfully provisioned client organization '{clean_org_name}'.",
            "org_id": new_org_id,
            "org_name": clean_org_name,
            "admin_name": clean_admin_name,
            "admin_email": clean_admin_email,
            "default_password": "sonura2026",
            "plan": clean_plan,
            "quotas": {
                "max_users": max_users,
                "max_sites": max_sites,
                "max_audits": max_audits,
                "storage_limit_mb": storage_limit_mb
            }
        }
    except Exception as e:
        logger.error(f"Organization provisioning failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Provisioning error: {str(e)}"
        )

@router.patch("/{org_id}/quotas")
async def update_organization_quotas(
    org_id: str,
    payload: OrganizationQuotaUpdate,
    current_user: dict = Depends(require_roles(["super_admin"]))
):
    client = get_supabase_client()
    update_data = {}

    if payload.plan:
        clean_plan = payload.plan.lower().strip()
        update_data["plan"] = clean_plan
        if clean_plan in PLAN_QUOTAS:
            q = PLAN_QUOTAS[clean_plan]
            update_data.setdefault("max_users", q["max_users"])
            update_data.setdefault("max_sites", q["max_sites"])
            update_data.setdefault("max_audits", q["max_audits"])
            update_data.setdefault("storage_limit_mb", q["storage_limit_mb"])

    if payload.max_users is not None:
        update_data["max_users"] = payload.max_users
    if payload.max_sites is not None:
        update_data["max_sites"] = payload.max_sites
    if payload.max_audits is not None:
        update_data["max_audits"] = payload.max_audits
    if payload.storage_limit_mb is not None:
        update_data["storage_limit_mb"] = payload.storage_limit_mb

    try:
        res = client.table("organizations").update(update_data).eq("id", org_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Organization not found.")
        return {"status": "success", "updated_quotas": res.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update quotas: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update quotas.")

@router.post("/{org_id}/suspend")
async def suspend_organization(
    org_id: str,
    payload: SuspendTenantRequest,
    current_user: dict = Depends(require_roles(["super_admin"]))
):
    client = get_supabase_client()
    if org_id == "11111111-1111-1111-1111-111111111111":
        raise HTTPException(status_code=400, detail="Cannot suspend default root organization.")

    reason = payload.reason or "Administrative suspension by Super Admin."
    try:
        res = client.table("organizations").update({
            "is_active": False,
            "suspension_reason": reason
        }).eq("id", org_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Organization not found.")

        client.table("notifications").insert({
            "org_id": org_id,
            "title": "Organization Workspace Suspended",
            "message": f"Organization suspended by Platform Super Administrator: {reason}",
            "type": "danger"
        }).execute()

        return {"status": "success", "message": "Tenant organization suspended successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to suspend organization: {str(e)}")
        raise HTTPException(status_code=500, detail="Suspension failed.")

@router.post("/{org_id}/resume")
async def resume_organization(
    org_id: str,
    current_user: dict = Depends(require_roles(["super_admin"]))
):
    client = get_supabase_client()
    try:
        res = client.table("organizations").update({
            "is_active": True,
            "suspension_reason": None
        }).eq("id", org_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Organization not found.")

        client.table("notifications").insert({
            "org_id": org_id,
            "title": "Organization Workspace Restored",
            "message": "Organization access has been resumed by Platform Super Administrator.",
            "type": "success"
        }).execute()

        return {"status": "success", "message": "Tenant organization resumed successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to resume organization: {str(e)}")
        raise HTTPException(status_code=500, detail="Resume failed.")

@router.delete("/{org_id}", status_code=status.HTTP_200_OK)
async def deprovision_organization(
    org_id: str,
    current_user: dict = Depends(require_roles(["super_admin"]))
):
    client = get_supabase_client()
    if org_id == "11111111-1111-1111-1111-111111111111":
        raise HTTPException(status_code=400, detail="Cannot deprovision default platform organization.")

    try:
        client.table("organizations").delete().eq("id", org_id).execute()
        return {"status": "success", "deleted_org_id": org_id}
    except Exception as e:
        logger.error(f"Failed to deprovision organization: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to deprovision organization.")