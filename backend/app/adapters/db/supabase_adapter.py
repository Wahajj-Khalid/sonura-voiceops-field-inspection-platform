# backend/app/adapters/db/supabase_adapter.py
import uuid
import logging
from datetime import datetime
from typing import List, Optional
from supabase import create_client, Client
from app.core.config import settings
from app.core.constants import DEFAULT_ORG_ID, DEFAULT_INSPECTOR_ID
from app.ports.db_port import DatabasePort
from app.domain.models import InspectionCreate, InspectionResponse, InspectionStatus, PriorityLevel

logger = logging.getLogger("supabase-adapter")

class SupabaseAdapter(DatabasePort):
    def __init__(self):
        try:
            self.client: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise e

    async def create_inspection(self, data: InspectionCreate, org_id: str = DEFAULT_ORG_ID) -> InspectionResponse:
        record_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        resolved_org = data.org_id or org_id
        
        payload = {
            "id": record_id,
            "org_id": resolved_org,
            "title": data.title,
            "unit_id": data.unit_id,
            "inspector_id": data.inspector_id,
            "status": InspectionStatus.PENDING.value,
            "priority": data.priority.value,
            "items": [item.model_dump() for item in data.items],
            "created_at": now,
            "updated_at": now
        }
        
        try:
            res = self.client.table("inspections").insert(payload).execute()
            created = res.data[0]
            return InspectionResponse(**created)
        except Exception as e:
            logger.error(f"Error creating inspection record: {str(e)}")
            raise e

    async def get_inspection(self, inspection_id: str, org_id: Optional[str] = None) -> Optional[InspectionResponse]:
        try:
            query = self.client.table("inspections").select("*").eq("unit_id", inspection_id)
            if org_id and org_id != "00000000-0000-0000-0000-000000000000":
                query = query.eq("org_id", org_id)
            res = query.execute()
            
            if not res.data:
                try:
                    uuid_query = self.client.table("inspections").select("*").eq("id", inspection_id)
                    if org_id and org_id != "00000000-0000-0000-0000-000000000000":
                        uuid_query = uuid_query.eq("org_id", org_id)
                    res = uuid_query.execute()
                except Exception:
                    pass

            if not res.data:
                now = datetime.utcnow().isoformat()
                template_items = []
                template_title = f"Field Walkthrough Audit - {inspection_id}"
                resolved_org = org_id or DEFAULT_ORG_ID

                site_query = self.client.table("sites").select("*").eq("unit_id", inspection_id)
                if org_id and org_id != "00000000-0000-0000-0000-000000000000":
                    site_query = site_query.eq("org_id", org_id)
                site_res = site_query.execute()

                bound_tmpl_id = None
                if site_res.data and len(site_res.data) > 0:
                    site_row = site_res.data[0]
                    resolved_org = site_row.get("org_id", resolved_org)
                    bound_tmpl_id = site_row.get("bound_template_id")
                    if site_row.get("title"):
                        template_title = site_row.get("title")

                if bound_tmpl_id:
                    tmpl_res = self.client.table("checklist_templates").select("*").eq("id", bound_tmpl_id).execute()
                else:
                    tmpl_res = self.client.table("checklist_templates").select("*").eq("org_id", resolved_org).limit(1).execute()

                if tmpl_res.data and len(tmpl_res.data) > 0:
                    matched_tmpl = tmpl_res.data[0]
                    template_title = f"{matched_tmpl.get('title', 'Audit')} - {inspection_id}"
                    raw_items = matched_tmpl.get("items", [])
                    for idx, itm in enumerate(raw_items):
                        template_items.append({
                            "item_id": itm.get("item_id", str(idx + 1)),
                            "question": itm.get("question", "Operational verification checkpoint"),
                            "response": None,
                            "status": "pending",
                            "flagged": False,
                            "notes": ""
                        })

                if not template_items:
                    template_items = [
                        {"item_id": "1", "question": "Main Pressure Valve PSI reading within 45 to 60 range?", "response": None, "status": "pending", "flagged": False, "notes": ""},
                        {"item_id": "2", "question": "Compressor intake filters free of debris and particulate obstruction?", "response": None, "status": "pending", "flagged": False, "notes": ""},
                        {"item_id": "3", "question": "Secondary coolant loop seal integrity intact with zero fluid seepage?", "response": None, "status": "pending", "flagged": False, "notes": ""},
                        {"item_id": "4", "question": "Emergency shutoff valve manual override mechanical operation verified?", "response": None, "status": "pending", "flagged": False, "notes": ""}
                    ]

                default_payload = {
                    "id": str(uuid.uuid4()),
                    "org_id": resolved_org,
                    "title": template_title,
                    "unit_id": inspection_id,
                    "inspector_id": DEFAULT_INSPECTOR_ID,
                    "status": InspectionStatus.IN_PROGRESS.value,
                    "priority": PriorityLevel.HIGH.value,
                    "items": template_items,
                    "created_at": now,
                    "updated_at": now
                }
                res = self.client.table("inspections").insert(default_payload).execute()

            return InspectionResponse(**res.data[0])
        except Exception as e:
            logger.error(f"Error fetching inspection '{inspection_id}': {str(e)}")
            return None

    async def list_inspections(self, org_id: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[InspectionResponse]:
        try:
            query = self.client.table("inspections").select("*").order("created_at", desc=True)
            if org_id and org_id != "00000000-0000-0000-0000-000000000000":
                query = query.eq("org_id", org_id)
            res = query.range(offset, offset + limit - 1).execute()
            return [InspectionResponse(**item) for item in res.data or []]
        except Exception as e:
            logger.error(f"Error listing inspections: {str(e)}")
            return []

    async def update_inspection_status(self, inspection_id: str, status: InspectionStatus, summary: Optional[str] = None, org_id: Optional[str] = None) -> InspectionResponse:
        now = datetime.utcnow().isoformat()
        update_data = {"status": status.value, "updated_at": now}
        if summary:
            update_data["transcript_summary"] = summary
            
        try:
            query = self.client.table("inspections").update(update_data)
            if org_id and org_id != "00000000-0000-0000-0000-000000000000":
                query = query.eq("org_id", org_id)
            
            res = query.eq("unit_id", inspection_id).execute()
            if not res.data:
                res = self.client.table("inspections").update(update_data).eq("id", inspection_id).execute()
            return InspectionResponse(**res.data[0])
        except Exception as e:
            logger.error(f"Error updating inspection status for '{inspection_id}': {str(e)}")
            raise e