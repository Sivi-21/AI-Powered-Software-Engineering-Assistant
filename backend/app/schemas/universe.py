from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class UniverseNode(BaseModel):
    id: str
    label: str
    type: str  # organization, team, repository, microservice, database, cloud, policy
    metadata: Dict[str, Any] = Field(default_factory=dict)

class UniverseEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str  # has_team, owns_repo, contains_service, hosted_on, uses_db, implements_policy

class UniverseResponse(BaseModel):
    org_id: str
    summary: str
    nodes: List[UniverseNode] = Field(default_factory=list)
    edges: List[UniverseEdge] = Field(default_factory=list)
    updated_at: datetime
