from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class OrganizationCreate(BaseModel):
    name: str

class InviteMemberRequest(BaseModel):
    email: str
    role: str = "Developer"  # Developer, Admin, Manager

class CloudResource(BaseModel):
    provider: str  # AWS, Azure, GCP
    resource_type: str  # Kubernetes, Database, Caching, VM
    name: str
    status: str = "Connected"

class TeamMember(BaseModel):
    email: str
    role: str
    joined_at: datetime

class OrganizationResponse(BaseModel):
    id: str
    name: str
    owner_id: str
    projects: List[str] = Field(default_factory=list)
    repositories: List[str] = Field(default_factory=list)
    teams: List[TeamMember] = Field(default_factory=list)
    cloud_resources: List[CloudResource] = Field(default_factory=list)
    knowledge_base: List[str] = Field(default_factory=list)
    analytics: Dict[str, Any] = Field(default_factory=dict)
    shared_memory: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
