from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class BusinessUnitStatus(BaseModel):
    name: str
    status: str  # active, warning, critical
    leads: List[str]

class CloudAssetStatus(BaseModel):
    name: str
    asset_type: str  # VM, DB, API Gateway, Cache
    status: str      # healthy, warning, critical
    monthly_cost: float

class DigitalTwinResponse(BaseModel):
    org_id: str
    health_index: int  # 1-100 rating
    compliance_score: int  # SOC2/GDPR checklist score
    monthly_cloud_spend: float
    business_units: List[BusinessUnitStatus] = Field(default_factory=list)
    cloud_assets: List[CloudAssetStatus] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    updated_at: datetime
