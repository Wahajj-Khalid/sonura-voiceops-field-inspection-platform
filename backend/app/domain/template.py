from typing import List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.domain.inspection import InspectionItem

class ChecklistTemplateCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    category: str = Field(default="HVAC")
    items: List[InspectionItem] = Field(default_factory=list)

class ChecklistTemplateResponse(BaseModel):
    id: str
    org_id: str
    title: str
    category: str
    items: List[InspectionItem]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)