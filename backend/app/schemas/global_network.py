from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class SharedPolicyRequest(BaseModel):
    policy_name: str
    source_org: str
    targets: List[str]

class OrgNode(BaseModel):
    id: str
    name: str
    health_score: int
    connected_repos_count: int

class CivilizationMetrics(BaseModel):
    total_organizations: int
    total_collaborative_agents: int
    shared_policies_count: int
    security_alerts_patched: int

class NetworkOverviewResponse(BaseModel):
    civilization_id: str
    metrics: CivilizationMetrics
    organizations: List[OrgNode] = Field(default_factory=list)
    shared_policy_registry: List[Dict[str, Any]] = Field(default_factory=list)
    updated_at: datetime
