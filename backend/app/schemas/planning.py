from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class ProjectPlanRequest(BaseModel):
    idea: str

class UserStory(BaseModel):
    title: str
    description: str
    acceptance_criteria: List[str] = Field(default_factory=list)

class Epic(BaseModel):
    title: str
    description: str

class SprintTask(BaseModel):
    title: str
    description: str
    story_points: int
    priority: str

class TechStack(BaseModel):
    frontend: List[str] = Field(default_factory=list)
    backend: List[str] = Field(default_factory=list)
    database: List[str] = Field(default_factory=list)
    devops: List[str] = Field(default_factory=list)

class DBDesignTable(BaseModel):
    name: str
    description: str
    fields: List[Dict[str, str]] = Field(default_factory=list)
    relationships: List[str] = Field(default_factory=list)

class DBDesign(BaseModel):
    tables: List[DBDesignTable] = Field(default_factory=list)
    notes: str | None = None

class APIEndpoint(BaseModel):
    endpoint: str
    method: str
    description: str
    request_model: str | None = None
    response_model: str | None = None

class RiskItem(BaseModel):
    risk: str
    impact: str
    mitigation: str

class TimelinePhase(BaseModel):
    phase: str
    duration: str
    description: str

class TeamRole(BaseModel):
    role: str
    count: int
    responsibilities: List[str] = Field(default_factory=list)

class ProjectPlanResponse(BaseModel):
    id: str
    idea: str
    functional_requirements: List[str] = Field(default_factory=list)
    non_functional_requirements: List[str] = Field(default_factory=list)
    user_stories: List[UserStory] = Field(default_factory=list)
    epics: List[Epic] = Field(default_factory=list)
    sprint_backlog: List[SprintTask] = Field(default_factory=list)
    technology_stack: TechStack
    database_design: DBDesign
    api_list: List[APIEndpoint] = Field(default_factory=list)
    folder_structure: str
    development_timeline: List[TimelinePhase] = Field(default_factory=list)
    risk_analysis: List[RiskItem] = Field(default_factory=list)
    estimated_complexity: str
    team_recommendation: List[TeamRole] = Field(default_factory=list)
    created_at: datetime
