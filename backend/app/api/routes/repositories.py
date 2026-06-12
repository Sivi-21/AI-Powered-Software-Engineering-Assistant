import logging
import uuid
import re
from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.database import get_db
from app.exceptions import AppException
from app.schemas.project import ProjectResponse, GitAnalyzeRequest
from app.services.db_service import db_service
from app.services.analysis_pipeline import analysis_pipeline
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/repositories", tags=["repositories"])
logger = logging.getLogger("app.api.routes.repositories")

# Robust regex for public GitHub repositories
GITHUB_URL_REGEX = re.compile(
    r"^https?://(www\.)?github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+?)(?:\.git)?/?$"
)

@router.post("/analyze-github", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def analyze_github_repository(
    payload: GitAnalyzeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Accepts a public GitHub repository URL, validates it, and triggers
    background cloning and analysis.
    """
    url = payload.repo_url.strip()
    match = GITHUB_URL_REGEX.match(url)
    
    if not match:
        raise AppException(
            "Invalid GitHub repository URL. Must be in the format: "
            "https://github.com/user/repository or https://github.com/user/repository.git",
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    owner = match.group(2)
    repo_name = match.group(3)
    
    # Generate unique analysis ID
    project_id = uuid.uuid4()
    
    # Save metadata to DB
    project = await db_service.create_project(
        name=repo_name,
        project_id=project_id,
        user_id=current_user.id,
        repository_source="GITHUB",
        github_url=url,
        clone_timestamp=datetime.now(timezone.utc)
    )
    
    # Run the background worker
    background_tasks.add_task(
        analysis_pipeline.process_git_project_background,
        project_id=project_id,
        repo_url=url
    )
    
    return project
