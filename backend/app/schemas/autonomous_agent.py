from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class EngineeringGoalRequest(BaseModel):
    goal: str
    project_id: str | None = None

class TaskBreakdownItem(BaseModel):
    id: str
    title: str
    description: str
    assigned_agent: str
    status: str = "pending"  # pending, running, completed, failed
    output: str | None = None

class ExecutionLogEntry(BaseModel):
    timestamp: datetime
    message: str
    level: str = "INFO"

class AutonomousAgentResponse(BaseModel):
    id: str
    goal: str
    project_id: str | None = None
    status: str = "running"  # running, completed, failed
    tasks: List[TaskBreakdownItem] = Field(default_factory=list)
    logs: List[ExecutionLogEntry] = Field(default_factory=list)
    final_report: str | None = None
    created_at: datetime
    updated_at: datetime
