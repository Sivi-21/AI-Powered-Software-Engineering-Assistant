import os
import shutil
import logging
from pathlib import Path
import git
from app.exceptions import AppException
from app.config import settings

logger = logging.getLogger("app.services.git_handler")

class GitHandler:
    def clone_repo(self, repo_url: str, dest_dir: Path) -> str:
        """
        Clones a public Git repository into dest_dir with depth=1.
        Returns the commit hash of the cloned repository.
        """
        logger.info(f"Cloning {repo_url} into {dest_dir}")
        dest_dir.mkdir(parents=True, exist_ok=True)
        try:
            # depth=1 for shallow clone to minimize download size
            repo = git.Repo.clone_from(repo_url, str(dest_dir), depth=1)
            
            # Check if empty
            if repo.bare or not repo.heads:
                raise AppException("The cloned repository is empty.", status_code=400)
                
            commit_hash = repo.head.commit.hexsha
            logger.info(f"Successfully cloned repo. Latest commit: {commit_hash}")
            return commit_hash
        except git.exc.GitCommandError as e:
            logger.error(f"GitCommandError cloning repository: {str(e)}", exc_info=True)
            err_msg = str(e)
            if "not found" in err_msg.lower() or "could not resolve host" in err_msg.lower() or "authentication failed" in err_msg.lower():
                raise AppException("Repository not found or is private/inaccessible.", status_code=404)
            raise AppException(f"Git clone failed: {err_msg}", status_code=400)
        except AppException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error cloning repository: {str(e)}", exc_info=True)
            raise AppException(f"Failed to clone Git repository: {str(e)}", status_code=500)

git_handler = GitHandler()
