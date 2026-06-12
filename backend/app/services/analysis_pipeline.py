import logging
import uuid
import shutil
from pathlib import Path

from app.config import settings
from app.exceptions import AppException
from app.services.db_service import db_service
from app.services.file_parser import parse_directory, extract_zip
from app.services.vector_store import vector_store
from app.services.agent_workflow import agent_workflow
from app.services.git_handler import git_handler
from app.mongodb import get_database

logger = logging.getLogger("app.services.analysis_pipeline")

class AnalysisPipeline:
    async def process_codebase_directory(
        self, 
        project_id: uuid.UUID, 
        dir_path: Path, 
        project_name: str
    ):
        """
        Runs the shared analysis pipeline:
        1. Parse files -> 2. Index in ChromaDB -> 3. Run LangGraph analysis -> 4. Store Report
        """
        # 1. Parse directory
        await db_service.update_project_status(project_id, "parsing")
        await db_service.update_project_progress(project_id, "Extracting and parsing codebase files...")
        parsed_files = parse_directory(dir_path, project_id)
        if not parsed_files:
            raise AppException("No readable source code files found in the repository.")

        file_paths = [f["file_path"] for f in parsed_files]
        
        # 2. Index in ChromaDB
        await db_service.update_project_status(project_id, "indexing")
        await db_service.update_project_progress(project_id, f"Indexing {len(parsed_files)} files for semantic search...")
        await vector_store.index_files(project_id, parsed_files)
        
        # 3. Trigger LangGraph workflow
        await db_service.update_project_status(project_id, "analyzing")
        
        report_create_data = await agent_workflow.run_analysis(
            project_id=project_id,
            project_name=project_name,
            file_paths=file_paths
        )
        
        # 4. Save analysis report
        await db_service.create_report(report_create_data)
        
        # 5. Complete project state
        await db_service.update_project_progress(project_id, "Done!")
        await db_service.update_project_status(project_id, "completed")

    async def process_git_project_background(self, project_id: uuid.UUID, repo_url: str):
        """
        Background worker that clones, analyzes, and cleans up a Git project.
        """
        cloned_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        
        try:
            # 1. Clone repository
            await db_service.update_project_status(project_id, "parsing")
            await db_service.update_project_progress(project_id, f"Cloning repository from GitHub...")
            commit_hash = git_handler.clone_repo(repo_url, cloned_dir)
            
            # Update commit hash
            db = get_database()
            await db.repositories.update_one(
                {"_id": str(project_id)},
                {"$set": {"commit_hash": commit_hash}}
            )
            
            project_record = await db_service.get_project(project_id)
            
            # 2. Run shared analysis pipeline
            await self.process_codebase_directory(
                project_id=project_id,
                dir_path=cloned_dir,
                project_name=project_record.get("repository_name", "github-repo") if project_record else "github-repo"
            )
            
        except Exception as e:
            logger.error(f"Error processing git project {project_id} in background: {str(e)}", exc_info=True)
            await db_service.update_project_status(project_id, "failed", error_message=str(e))
        finally:
            # Clean up cloned directory to save disk space
            try:
                if cloned_dir.exists():
                    shutil.rmtree(cloned_dir)
                logger.info(f"Cleanup completed for git project cloned files: {project_id}")
            except Exception as e:
                logger.warning(f"Failed to clean up cloned files for project {project_id}: {str(e)}")

    async def process_zip_project_background(self, project_id: uuid.UUID, zip_path: Path):
        """
        Background worker that extracts, analyzes, and cleans up a ZIP project.
        """
        extracted_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        
        try:
            # 1. Extract ZIP securely
            await db_service.update_project_status(project_id, "parsing")
            await db_service.update_project_progress(project_id, "Extracting ZIP archive...")
            extract_zip(zip_path, extracted_dir)
            
            project_record = await db_service.get_project(project_id)
            
            # 2. Run shared analysis pipeline
            await self.process_codebase_directory(
                project_id=project_id,
                dir_path=extracted_dir,
                project_name=project_record.get("repository_name", "zip-repo") if project_record else "zip-repo"
            )
            
        except Exception as e:
            logger.error(f"Error processing zip project {project_id} in background: {str(e)}", exc_info=True)
            await db_service.update_project_status(project_id, "failed", error_message=str(e))
        finally:
            # Clean up ZIP and extracted files
            try:
                if zip_path.exists():
                    zip_path.unlink()
                if extracted_dir.exists():
                    shutil.rmtree(extracted_dir)
                logger.info(f"Cleanup completed for zip project files: {project_id}")
            except Exception as e:
                logger.warning(f"Failed to clean up temp files for project {project_id}: {str(e)}")

analysis_pipeline = AnalysisPipeline()
