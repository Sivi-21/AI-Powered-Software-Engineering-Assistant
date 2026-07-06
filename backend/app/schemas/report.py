from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import datetime
from typing import Any

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

class AIFix(BaseModel):
    file_path: str
    line_number: int | None = None
    issue_type: str
    severity: str
    root_cause: str
    explanation: str
    before_code: str
    fixed_code: str
    why_fix_works: str
    best_practices: list[str] = []
    confidence_score: int

    @field_validator('fixed_code', mode='before')
    @classmethod
    def validate_fixed_code(cls, v: Any) -> str:
        if isinstance(v, dict):
            for key in ["code", "corrected_code", "fixed_code"]:
                if key in v and isinstance(v[key], str):
                    return v[key]
            try:
                import json
                return json.dumps(v, indent=2)
            except Exception:
                return str(v)
        if v is None:
            return ""
        if not isinstance(v, str):
            try:
                import json
                return json.dumps(v, indent=2)
            except Exception:
                return str(v)
        return v

class ReportBase(BaseModel):
    summary: str
    code_quality_score: int
    security_score: int = 100
    architecture_score: int = 100
    maintainability_score: int = 100
    documentation_score: int = 100
    testing_score: int = 100
    dependency_score: int = 100
    technical_debt: int = 0
    code_complexity: int = 0
    vulnerabilities: list[Vulnerability] = []
    suggestions: list[Suggestion] = []
    ai_fixes: list[AIFix] = []
    generated_docs: dict[str, str] = {}
    full_report_md: str

class ReportCreate(ReportBase):
    project_id: UUID

class ReportResponse(ReportBase):
    id: UUID
    project_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatMessage(BaseModel):
    role: str # user or assistant
    content: str

class QueryInput(BaseModel):
    query: str
    history: list[ChatMessage] = []

class QueryResponse(BaseModel):
    answer: str
    sources: list[str] = []

class PRComment(BaseModel):
    file_path: str
    line_number: int
    severity: str
    comment: str
    diff_hunk: str | None = None

class PRReviewRequest(BaseModel):
    pr_number: int
    title: str
    source_branch: str = "feature-branch"
    target_branch: str = "main"

class PRReviewResponse(BaseModel):
    id: str
    project_id: str
    pr_number: int
    title: str
    source_branch: str
    target_branch: str
    overall_pr_score: int
    risk_assessment: str
    merge_recommendation: str
    summary: str
    improvements: list[str] = []
    comments: list[PRComment] = []
    created_at: datetime


