from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.domain.common import InspectionStatus, PriorityLevel

class InspectionItem(BaseModel):
    item_id: str = Field(..., description="Unique checklist item identifier")
    question: str = Field(..., min_length=3, description="Checkpoint requirement prompt")
    response: Optional[str] = Field(None, description="Spoken or confirmed answer value")
    status: InspectionStatus = Field(default=InspectionStatus.PENDING)
    flagged: bool = Field(default=False)
    notes: Optional[str] = Field(None)

class InspectionCreate(BaseModel):
    org_id: Optional[str] = Field(None, description="Tenant organization identifier")
    title: str = Field(..., min_length=3, max_length=150)
    unit_id: str = Field(..., min_length=1, max_length=50)
    inspector_id: str = Field(..., min_length=1, max_length=50)
    priority: PriorityLevel = Field(default=PriorityLevel.MEDIUM)
    items: List[InspectionItem]

class InspectionResponse(BaseModel):
    id: str
    org_id: str
    title: str
    unit_id: str
    inspector_id: str
    status: InspectionStatus
    priority: PriorityLevel
    items: List[InspectionItem]
    transcript_summary: Optional[str] = None
    audio_url: Optional[str] = None
    photo_attachments: Optional[List[dict]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)