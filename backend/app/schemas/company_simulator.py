from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class SimulatorSessionRequest(BaseModel):
    objective: str

class DepartmentMessage(BaseModel):
    department: str  # CEO, CTO, Product Manager, Solution Architect, Backend Team, QA Team, etc.
    role: str
    message: str
    timestamp: datetime

class SimulatorSessionResponse(BaseModel):
    id: str
    objective: str
    owner_id: str | None = None
    status: str = "running"  # running, completed, failed
    messages: List[DepartmentMessage] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
