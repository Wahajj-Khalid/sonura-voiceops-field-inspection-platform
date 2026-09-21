from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.domain.common import NotificationType

class NotificationCreate(BaseModel):
    org_id: str
    user_id: Optional[str] = None
    role_target: Optional[str] = None
    title: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=2)
    type: NotificationType = Field(default=NotificationType.INFO)

class NotificationResponse(BaseModel):
    id: str
    org_id: str
    user_id: Optional[str] = None
    role_target: Optional[str] = None
    title: str
    message: str
    type: NotificationType
    read: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)