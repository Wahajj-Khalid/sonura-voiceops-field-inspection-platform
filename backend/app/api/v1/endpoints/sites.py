import uuid
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status, Depends
from supabase import create_client
from app.core.config import settings
from app.core.security import get_current_user, require_roles
from app.domain.models import SiteCreate, SiteResponse

logger = logging.getLogger("sites-endpoint")
router = APIRouter(prefix="/sites", tags=["Sites and Units"])

def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

class SiteUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    assigned_inspector: Optional[str] = Field(None, min_length=2, max_length=100)
    bound_template_id: Optional[str] = None
    status: Optional[str] = None

@router.get("/", response_model=List[SiteResponse])
async def list_sites(current_user: dict = Depends(get_current_user)):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    try:
        query = client.table("sites").select("*").order("created_at", desc=True)
        if current_user.get("role") != "super_admin":
            query = query.eq("org_id", org_id)

        res = query.execute()
        return [
            SiteResponse(
                id=item["id"],
                org_id=item["org_id"],
                unit_id=item["unit_id"],
                title=item["title"],
                status=item.get("status", "pending"),
                assigned_inspector=item.get("assigned_inspector", "Operator 01"),
                bound_template_id=item.get("bound_template_id"),
                created_at=item["created_at"]
            )
            for item in res.data or []
        ]
    except Exception as e:
        logger.error(f"Failed to fetch sites: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve sites.")

@router.post("/", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
async def create_site(
    payload: SiteCreate,
    current_user: dict = Depends(require_roles(["org_admin", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    clean_unit_id = payload.unit_id.upper().strip()

    if current_user.get("role") != "super_admin":
        org_res = client.table("organizations").select("max_sites").eq("id", org_id).execute()
        max_sites = org_res.data[0].get("max_sites", 15) if org_res.data else 15
        current_count = client.table("sites").select("id", count="exact").eq("org_id", org_id).execute().count or 0
        if current_count >= max_sites:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Plan limit reached: Maximum {max_sites} site units allowed for this organization. Upgrade subscription tier to register more sites."
            )

    existing = client.table("sites").select("id").eq("org_id", org_id).eq("unit_id", clean_unit_id).execute()
    if existing.data and len(existing.data) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Unit ID '{clean_unit_id}' already exists in your organization."
        )

    site_id = str(uuid.uuid4())
    data = {
        "id": site_id,
        "org_id": org_id,
        "unit_id": clean_unit_id,
        "title": payload.title.strip(),
        "assigned_inspector": payload.assigned_inspector.strip(),
        "bound_template_id": payload.bound_template_id,
        "status": "pending"
    }

    try:
        res = client.table("sites").insert(data).execute()
        created = res.data[0]

        if payload.bound_template_id:
            tmpl_res = client.table("checklist_templates").select("*").eq("id", payload.bound_template_id).execute()
            if tmpl_res.data and len(tmpl_res.data) > 0:
                template = tmpl_res.data[0]
                raw_items = template.get("items", [])
                
                prepared_items = [
                    {
                        "item_id": itm.get("item_id", str(idx + 1)),
                        "question": itm.get("question", "Operational verification required"),
                        "response": None,
                        "status": "pending",
                        "flagged": False,
                        "notes": ""
                    }
                    for idx, itm in enumerate(raw_items)
                ]

                inspection_payload = {
                    "id": str(uuid.uuid4()),
                    "org_id": org_id,
                    "title": f"{template.get('title')} - {clean_unit_id}",
                    "unit_id": clean_unit_id,
                    "inspector_id": payload.assigned_inspector,
                    "status": "in_progress",
                    "priority": "high",
                    "items": prepared_items,
                }
                client.table("inspections").insert(inspection_payload).execute()

        return SiteResponse(
            id=created["id"],
            org_id=created["org_id"],
            unit_id=created["unit_id"],
            title=created["title"],
            status=created["status"],
            assigned_inspector=created["assigned_inspector"],
            bound_template_id=created.get("bound_template_id"),
            created_at=created["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to register site: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create site.")

@router.patch("/{site_id}", response_model=SiteResponse)
async def update_site(
    site_id: str,
    payload: SiteUpdateRequest,
    current_user: dict = Depends(require_roles(["org_admin", "supervisor", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")

    query = client.table("sites").select("*").eq("id", site_id)
    if current_user.get("role") != "super_admin":
        query = query.eq("org_id", org_id)

    check = query.execute()
    if not check.data or len(check.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found in your organization.")

    update_dict = {}
    if payload.title is not None:
        update_dict["title"] = payload.title.strip()
    if payload.assigned_inspector is not None:
        update_dict["assigned_inspector"] = payload.assigned_inspector.strip()
    if payload.bound_template_id is not None:
        update_dict["bound_template_id"] = payload.bound_template_id
    if payload.status is not None:
        update_dict["status"] = payload.status.strip()

    try:
        res = client.table("sites").update(update_dict).eq("id", site_id).execute()
        updated = res.data[0]
        return SiteResponse(
            id=updated["id"],
            org_id=updated["org_id"],
            unit_id=updated["unit_id"],
            title=updated["title"],
            status=updated["status"],
            assigned_inspector=updated["assigned_inspector"],
            bound_template_id=updated.get("bound_template_id"),
            created_at=updated["created_at"]
        )
    except Exception as e:
        logger.error(f"Failed to update site: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update site.")

@router.delete("/{site_id}", status_code=status.HTTP_200_OK)
async def delete_site(
    site_id: str,
    current_user: dict = Depends(require_roles(["org_admin", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")

    query = client.table("sites").select("id, unit_id").eq("id", site_id)
    if current_user.get("role") != "super_admin":
        query = query.eq("org_id", org_id)

    check = query.execute()
    if not check.data or len(check.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found in your organization.")

    try:
        client.table("sites").delete().eq("id", site_id).execute()
        return {"status": "success", "deleted_id": site_id}
    except Exception as e:
        logger.error(f"Failed to delete site: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete site.")