import uuid
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status, Depends
from supabase import create_client
from app.core.config import settings
from app.core.security import get_current_user, require_roles
from app.domain.models import ChecklistTemplateCreate, ChecklistTemplateResponse, InspectionItem

logger = logging.getLogger("templates-endpoint")
router = APIRouter(prefix="/templates", tags=["Checklist Templates"])

def get_supabase_client():
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

class ChecklistTemplateUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    category: Optional[str] = None
    items: Optional[List[InspectionItem]] = None

@router.get("/", response_model=List[ChecklistTemplateResponse])
async def list_templates(current_user: dict = Depends(get_current_user)):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    try:
        query = client.table("checklist_templates").select("*").order("created_at", desc=True)
        if current_user.get("role") != "super_admin":
            query = query.eq("org_id", org_id)

        res = query.execute()
        return [
            ChecklistTemplateResponse(
                id=item["id"],
                org_id=item["org_id"],
                title=item["title"],
                category=item.get("category", "General"),
                items=item.get("items", []),
                created_at=item["created_at"]
            )
            for item in res.data or []
        ]
    except Exception as e:
        logger.error(f"Failed to fetch templates: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve templates.")

@router.post("/", response_model=ChecklistTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: ChecklistTemplateCreate,
    current_user: dict = Depends(require_roles(["org_admin", "supervisor", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")
    new_id = str(uuid.uuid4())

    data = {
        "id": new_id,
        "org_id": org_id,
        "title": payload.title.strip(),
        "category": payload.category.strip(),
        "items": [item.model_dump() for item in payload.items],
    }

    try:
        res = client.table("checklist_templates").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Template insertion failed.")
        
        created = res.data[0]
        return ChecklistTemplateResponse(
            id=created["id"],
            org_id=created["org_id"],
            title=created["title"],
            category=created["category"],
            items=created.get("items", []),
            created_at=created["created_at"]
        )
    except Exception as e:
        logger.error(f"Template creation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create template.")

@router.patch("/{template_id}", response_model=ChecklistTemplateResponse)
async def update_template(
    template_id: str,
    payload: ChecklistTemplateUpdateRequest,
    current_user: dict = Depends(require_roles(["org_admin", "supervisor", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")

    query = client.table("checklist_templates").select("id").eq("id", template_id)
    if current_user.get("role") != "super_admin":
        query = query.eq("org_id", org_id)

    check = query.execute()
    if not check.data or len(check.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found in your organization.")

    update_dict = {}
    if payload.title is not None:
        update_dict["title"] = payload.title.strip()
    if payload.category is not None:
        update_dict["category"] = payload.category.strip()
    if payload.items is not None:
        update_dict["items"] = [item.model_dump() for item in payload.items]

    try:
        res = client.table("checklist_templates").update(update_dict).eq("id", template_id).execute()
        updated = res.data[0]
        return ChecklistTemplateResponse(
            id=updated["id"],
            org_id=updated["org_id"],
            title=updated["title"],
            category=updated["category"],
            items=updated.get("items", []),
            created_at=updated["created_at"]
        )
    except Exception as e:
        logger.error(f"Failed to update template: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update template.")

@router.delete("/{template_id}", status_code=status.HTTP_200_OK)
async def delete_template(
    template_id: str,
    current_user: dict = Depends(require_roles(["org_admin", "super_admin"]))
):
    client = get_supabase_client()
    org_id = current_user.get("org_id")

    query = client.table("checklist_templates").select("id").eq("id", template_id)
    if current_user.get("role") != "super_admin":
        query = query.eq("org_id", org_id)

    check = query.execute()
    if not check.data or len(check.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found in your organization.")

    try:
        client.table("checklist_templates").delete().eq("id", template_id).execute()
        return {"status": "success", "deleted_id": template_id}
    except Exception as e:
        logger.error(f"Failed to delete template: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete template.")