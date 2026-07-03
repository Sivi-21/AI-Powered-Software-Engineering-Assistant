from pydantic import BaseModel, Field
from typing import List, Dict, Any
from datetime import datetime

class GovernmentProposalRequest(BaseModel):
    proposal: str

class CouncilDebateStatement(BaseModel):
    role: str  # CEO, CTO, CSO, Chief Architect, Chief DevOps
    opinion: str
    vote: str  # yes, no

class GovernmentSessionResponse(BaseModel):
    id: str
    proposal: str
    owner_id: str | None = None
    debate_statements: List[CouncilDebateStatement] = Field(default_factory=list)
    verdict: str  # approved, rejected, tabled
    yes_votes: int
    no_votes: int
    created_at: datetime
