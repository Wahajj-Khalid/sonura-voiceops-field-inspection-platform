from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.domain.common import InspectionStatus, PriorityLevel, UserRole, NotificationType
from app.domain.inspection import InspectionItem, InspectionCreate, InspectionResponse
from app.domain.organization import (
    OrganizationProvisionRequest, 
    OrganizationQuotaUpdate,
    OrganizationResponse, 
    PlatformTelemetry
)
from app.domain.site import SiteCreate, SiteResponse
from app.domain.team import TeamMemberCreate, TeamMemberSafetyCheck, TeamMemberResponse
from app.domain.template import ChecklistTemplateCreate, ChecklistTemplateResponse
from app.domain.notification import NotificationCreate, NotificationResponse

class RAGQuery(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)
    top_k: int = Field(default=3, ge=1, le=10)
    manual_category: Optional[str] = None

class RAGQueryResult(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    confidence_score: float