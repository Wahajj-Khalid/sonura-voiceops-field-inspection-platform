from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict

class TeamMemberCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr = Field(..., description="Corporate email address")
    role: str = Field(default="Inspector", description="Assigned authorization role")

class TeamMemberSafetyCheck(BaseModel):
    can_delete_or_suspend: bool
    assigned_active_sites: list[str] = Field(default_factory=list)
    warning_message: Optional[str] = None

class TeamMemberResponse(BaseModel):
    id: str
    org_id: str
    name: str
    email: str
    role: str
    audits_count: int
    is_active: bool = Field(default=True)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)