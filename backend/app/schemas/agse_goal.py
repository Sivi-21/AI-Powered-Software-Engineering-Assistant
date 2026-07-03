from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class GoalSubmitRequest(BaseModel):
    business_goal: str

class AGSEStageReport(BaseModel):
    stage_name: str  # Requirements, Architecture, Database, APIs, Deployment
    status: str      # pending, running, completed, failed
    content: str = ""
    updated_at: datetime

class GoalResponse(BaseModel):
    id: str
    business_goal: str
    owner_id: str | None = None
    status: str = "running"  # running, completed, failed
    stages: List[AGSEStageReport] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
