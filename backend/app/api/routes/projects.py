import logging
import os
import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.exceptions import ProjectNotFoundError, AppException
from app.schemas.project import ProjectResponse, GitAnalyzeRequest
from app.schemas.report import ReportResponse, QueryInput, QueryResponse
from app.services.db_service import db_service
from app.services.file_parser import parse_zip_file
from app.services.vector_store import vector_store
from app.services.agent_workflow import agent_workflow
from app.services.analysis_pipeline import analysis_pipeline
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/projects", tags=["projects"])
logger = logging.getLogger("app.api.routes.projects")

# --- Endpoints ---

@router.post("/upload", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def upload_repository(
    background_tasks: BackgroundTasks,
    name: str = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a repository ZIP file. Starts the extraction and analysis pipeline asynchronously.
    """
    if not file.filename.endswith(".zip"):
        raise AppException("Only ZIP files are supported.", status_code=status.HTTP_400_BAD_REQUEST)
        
    project_name = name or Path(file.filename).stem
    
    # 1. Save ZIP file temporarily with streaming size validation
    project_id = uuid.uuid4()
    temp_zip_path = Path(settings.UPLOAD_DIR) / f"{project_id}.zip"
    
    try:
        total_size = 0
        with open(temp_zip_path, "wb") as buffer:
            # Read in 1MB chunks to evaluate size bounds and write securely
            while chunk := file.file.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > settings.MAX_FILE_SIZE:
                    raise AppException(
                        f"Uploaded file exceeds the maximum allowed limit of {settings.MAX_FILE_SIZE / (1024 * 1024)} MB.",
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                    )
                buffer.write(chunk)
    except AppException:
        if temp_zip_path.exists():
            temp_zip_path.unlink()
        raise
    except Exception as e:
        if temp_zip_path.exists():
            temp_zip_path.unlink()
        logger.error(f"Failed to save uploaded file: {str(e)}")
        raise AppException("Failed to store the uploaded file.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    # 2. Create database entry using the enhanced db_service
    project = await db_service.create_project(
        name=project_name,
        project_id=project_id,
        user_id=current_user.id,
        repository_source="ZIP"
    )
    
    # 3. Add task to background workers via the shared analysis pipeline
    background_tasks.add_task(analysis_pipeline.process_zip_project_background, project_id, temp_zip_path)
    
    return project

@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user)
):
    """
    Lists all uploaded repositories and their processing status.
    """
    return await db_service.get_all_projects(user_id=current_user.id)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID, 
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the status of a specific project.
    """
    project = await db_service.get_project(project_id)
    if not project:
        raise ProjectNotFoundError(str(project_id))
    
    if str(project.get("owner_id")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access this repository."
        )
    return project

# @router.get("/{project_id}/report", response_model=ReportResponse)
# async def get_project_report(
#     project_id: uuid.UUID, 
#     current_user: User = Depends(get_current_user)
# ):
#     """
#     Retrieves the generated report for a specific project.
#     """
#     project = await db_service.get_project(project_id)
#     if not project:
#         raise ProjectNotFoundError(str(project_id))
        
#     if str(project.get("owner_id")) != str(current_user.id):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Forbidden: You do not have permission to access this repository."
#         )

#     if project.get("status") != "completed":
#         raise AppException(
#             f"Report is not ready. Project status: {project.get('status')}", 
#             status_code=status.HTTP_400_BAD_REQUEST
#         )
        
#     report = await db_service.get_report_by_project(project_id)
#     if not report:
#         raise AppException("Report data not found.", status_code=status.HTTP_404_NOT_FOUND)
        
#     return report


@router.get("/{project_id}/report", response_model=ReportResponse)
async def get_project_report(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the generated report for a specific project.
    """
    project = await db_service.get_project(project_id)

    if not project:
        raise ProjectNotFoundError(str(project_id))

    if str(project.get("owner_id")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access this repository."
        )

    if project.get("status") != "completed":
        raise AppException(
            f"Report is not ready. Project status: {project.get('status')}",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    report = await db_service.get_report_by_project(project_id)

    if not report:
        raise AppException(
            "Report data not found.",
            status_code=status.HTTP_404_NOT_FOUND
        )

    # Fix MongoDB -> FastAPI schema mismatch
    if "repository_id" in report:
        report["project_id"] = report.pop("repository_id")

    return report

@router.post("/{project_id}/query", response_model=QueryResponse)
async def query_codebase(
    project_id: uuid.UUID,
    payload: QueryInput,
    current_user: User = Depends(get_current_user)
):
    """
    Interactive semantic Q&A chatbot query against the indexed codebase repository.
    """
    project = await db_service.get_project(project_id)
    if not project:
        raise ProjectNotFoundError(str(project_id))
        
    if str(project.get("owner_id")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access this repository."
        )

    if project.get("status") not in ["indexing", "analyzing", "completed"]:
        raise AppException(
            f"Codebase cannot be queried in status: {project.get('status')}", 
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
    response = await agent_workflow.answer_codebase_query(
        project_id=project_id,
        project_name=project.get("repository_name"),
        query=payload.query
    )
    return response

@router.delete("/{project_id}")
async def delete_project(
    project_id: uuid.UUID, 
    current_user: User = Depends(get_current_user)
):
    """
    Deletes the project metadata, report database records, and ChromaDB vector indices.
    """
    project = await db_service.get_project(project_id)
    if not project:
        raise ProjectNotFoundError(str(project_id))
        
    if str(project.get("owner_id")) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to access this repository."
        )

    # 1. Delete Chroma collection
    await vector_store.delete_project_index(project_id)
    
    # 2. Delete DB project (cascades report deletion)
    deleted = await db_service.delete_project(project_id)
    if not deleted:
        raise ProjectNotFoundError(str(project_id))
        
    return {"status": "success", "message": f"Project {project_id} deleted successfully."}

@router.post("/analyze-mvp", status_code=status.HTTP_200_OK)
async def analyze_mvp_repository(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Direct MVP Endpoint:
    1. Upload ZIP file -> 2. Secure Extraction -> 3. Static Code Scanning ->
    4. Repository Agent Analysis -> 5. Immediate JSON response & cleanup.
    """
    if not file.filename.endswith(".zip"):
        raise AppException("Only ZIP files are supported.", status_code=status.HTTP_400_BAD_REQUEST)

    # 1. Generate temp paths
    project_id = uuid.uuid4()
    temp_zip_path = Path(settings.UPLOAD_DIR) / f"{project_id}.zip"
    extract_dir = Path(settings.UPLOAD_DIR) / str(project_id)

    try:
        # 2. Save ZIP file temporarily with size validation
        total_size = 0
        with open(temp_zip_path, "wb") as buffer:
            while chunk := file.file.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > settings.MAX_FILE_SIZE:
                    raise AppException(
                        f"Uploaded file exceeds limit of {settings.MAX_FILE_SIZE / (1024 * 1024)} MB.",
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                    )
                buffer.write(chunk)

        # 3. Secure Extraction & Parse
        from app.services.file_parser import parse_zip_file
        # parse_zip_file runs the Zip Slip path checks internally and returns code dictionaries
        parsed_files = parse_zip_file(temp_zip_path, project_id)
        if not parsed_files:
            raise AppException("No readable source files found inside the ZIP archive.")

        # 4. Trigger Repository Agent to summarize structure & stack
        from app.services.repository_agent import repository_agent
        analysis_result = await repository_agent.run_node(project_id, file.filename)
        
        return analysis_result

    except AppException:
        raise
    except Exception as e:
        logger.error(f"MVP analysis failed: {str(e)}", exc_info=True)
        raise AppException(f"Failed to analyze repository: {str(e)}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        # 5. Clean up temporary directories immediately
        try:
            if temp_zip_path.exists():
                temp_zip_path.unlink()
            if extract_dir.exists():
                shutil.rmtree(extract_dir)
            logger.info(f"MVP cleanup completed for project: {project_id}")
        except Exception as e:
            logger.warning(f"Failed to clean up temp files for project {project_id}: {str(e)}")


import re

GITHUB_URL_REGEX = re.compile(
    r"^https?://(www\.)?github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+?)(?:\.git)?/?$"
)

@router.post("/analyze-mvp-github", status_code=status.HTTP_200_OK)
async def analyze_mvp_github_repository(
    payload: GitAnalyzeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Direct MVP GitHub Endpoint:
    1. Clone repository -> 2. Static Code Scanning ->
    3. Repository Agent Analysis -> 4. Immediate JSON response & cleanup.
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
    
    project_id = uuid.uuid4()
    cloned_dir = Path(settings.UPLOAD_DIR) / str(project_id)
    
    try:
        from app.services.git_handler import git_handler
        # 1. Clone repository
        commit_hash = git_handler.clone_repo(url, cloned_dir)
        
        # 2. Trigger Repository Agent to summarize structure & stack
        from app.services.repository_agent import repository_agent
        analysis_result = await repository_agent.run_node(project_id, repo_name)
        
        return analysis_result

    except AppException:
        raise
    except Exception as e:
        logger.error(f"MVP GitHub analysis failed: {str(e)}", exc_info=True)
        raise AppException(f"Failed to analyze GitHub repository: {str(e)}", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        # 3. Clean up temporary directory immediately
        try:
            if cloned_dir.exists():
                shutil.rmtree(cloned_dir)
            logger.info(f"MVP GitHub cleanup completed for project: {project_id}")
        except Exception as e:
            logger.warning(f"Failed to clean up cloned files for project {project_id}: {str(e)}")


