from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class BrainDecisionRequest(BaseModel):
    query: str

class DecomposedTask(BaseModel):
    step_number: int
    task_name: str
    description: str

class BrainDecisionResponse(BaseModel):
    id: str
    query: str
    owner_id: str | None = None
    tasks_decomposition: List[DecomposedTask] = Field(default_factory=list)
    risk_assessment: str
    trade_off_analysis: str
    confidence_score: int  # 1-100 rating
    validation_verdict: str  # approved, needs_revision, rejected
    created_at: datetime
