from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class SiteCreate(BaseModel):
    unit_id: str = Field(..., min_length=1, max_length=50, description="Facility or equipment unit tag")
    title: str = Field(..., min_length=3, max_length=150, description="Facility description name")
    assigned_inspector: str = Field(default="Operator 01")
    bound_template_id: Optional[str] = Field(None, description="Checklist template ID to bind to unit")

class SiteResponse(BaseModel):
    id: str
    org_id: str
    unit_id: str
    title: str
    status: str
    assigned_inspector: str
    bound_template_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)