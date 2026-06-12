from pydantic import BaseModel, ConfigDict, model_validator
from uuid import UUID
from datetime import datetime

class ProjectBase(BaseModel):
    name: str

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    status: str | None = None
    error_message: str | None = None

class ProjectResponse(BaseModel):
    id: UUID
    repository_name: str
    status: str
    current_progress: str | None = None
    error_message: str | None = None
    repository_source: str | None = "ZIP"
    github_url: str | None = None
    clone_timestamp: datetime | None = None
    commit_hash: str | None = None
    owner_id: UUID | None = None
    created_at: datetime
    updated_at: datetime
    
    # Legacy outputs
    name: str
    user_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @model_validator(mode="before")
    @classmethod
    def populate_legacy_fields(cls, data):
        if isinstance(data, dict):
            if "repository_name" in data and "name" not in data:
                data["name"] = data["repository_name"]
            elif "name" in data and "repository_name" not in data:
                data["repository_name"] = data["name"]

            if "owner_id" in data and "user_id" not in data:
                data["user_id"] = data["owner_id"]
            elif "user_id" in data and "owner_id" not in data:
                data["owner_id"] = data["user_id"]
            return data

        try:
            if hasattr(data, "repository_name"):
                data.name = data.repository_name
            if hasattr(data, "owner_id"):
                data.user_id = data.owner_id
        except Exception:
            pass
        return data

# Alias RepositoryResponse to ProjectResponse for codebase compatibility
RepositoryResponse = ProjectResponse

class GitAnalyzeRequest(BaseModel):
    repo_url: str
