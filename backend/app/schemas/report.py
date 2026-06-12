from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class Vulnerability(BaseModel):
    severity: str  # HIGH, MEDIUM, LOW
    file_path: str
    line_number: int | None = None
    description: str
    snippet: str | None = None

class Suggestion(BaseModel):
    file_path: str
    suggestion: str
    explanation: str

class ReportBase(BaseModel):
    summary: str
    code_quality_score: int
    vulnerabilities: list[Vulnerability] = []
    suggestions: list[Suggestion] = []
    full_report_md: str

class ReportCreate(ReportBase):
    project_id: UUID

class ReportResponse(ReportBase):
    id: UUID
    project_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QueryInput(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[str] = []
