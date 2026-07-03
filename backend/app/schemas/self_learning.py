from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class FeedbackSubmission(BaseModel):
    category: str  # Code Quality, Security, Architecture, Testing, Database
    original_recommendation: str
    user_corrections: str
    score: int = Field(default=5, ge=1, le=5)

class LearningLogEntry(BaseModel):
    id: str
    category: str
    rule_summary: str
    guideline: str
    confidence_score: int
    created_at: datetime
