from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class OrganizationProvisionRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=150, description="Organization legal entity name")
    plan: str = Field(default="enterprise", description="Subscription tier")
    admin_name: str = Field(..., min_length=2, max_length=100)
    admin_email: str = Field(..., min_length=5, max_length=150)
    max_users: Optional[int] = Field(None, ge=1)
    max_sites: Optional[int] = Field(None, ge=1)
    max_audits: Optional[int] = Field(None, ge=1)
    storage_limit_mb: Optional[int] = Field(None, ge=50)

class OrganizationQuotaUpdate(BaseModel):
    plan: Optional[str] = Field(None, min_length=3, max_length=50)
    max_users: Optional[int] = Field(None, ge=1)
    max_sites: Optional[int] = Field(None, ge=1)
    max_audits: Optional[int] = Field(None, ge=1)
    storage_limit_mb: Optional[int] = Field(None, ge=50)

class OrganizationResponse(BaseModel):
    id: str
    name: str
    plan: str
    is_active: bool = True
    suspension_reason: Optional[str] = None
    max_users: int = 25
    max_sites: int = 15
    max_audits: int = 500
    storage_limit_mb: int = 1024
    members_count: int = Field(default=0)
    sites_count: int = Field(default=0)
    audits_count: int = Field(default=0)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PlatformTelemetry(BaseModel):
    total_organizations: int
    total_sites: int
    total_users: int
    total_inspections: int
    total_vector_chunks: int
    system_uptime: str
    active_webrtc_channels: int