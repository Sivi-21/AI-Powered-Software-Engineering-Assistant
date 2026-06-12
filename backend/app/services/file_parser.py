import logging
import os
import zipfile
from pathlib import Path
import uuid
from app.config import settings
from app.exceptions import ParsingError, AppException

logger = logging.getLogger("app.services.file_parser")

# Directories to exclude from parsing
EXCLUDED_DIRS = {
    "node_modules", "venv", ".venv", "dist", "build", ".git", 
    "__pycache__", "coverage", ".next", "env", ".github", "target", "out", ".idea", ".vscode"
}

def is_text_file(file_path: Path) -> bool:
    """Helper to check if a file has a text-like extension allowed by configuration."""
    return file_path.suffix.lower() in settings.ALLOWED_EXTENSIONS

def is_safe_path(base_dir: Path, target_path: Path) -> bool:
    """Checks if target_path resides inside base_dir boundary to prevent Zip Slip path traversal."""
    try:
        resolved_base = base_dir.resolve()
        resolved_target = target_path.resolve()
        return resolved_base in resolved_target.parents or resolved_base == resolved_target
    except Exception:
        return False

def extract_zip(zip_path: Path, dest_dir: Path) -> None:
    """Extracts a zip file to the target destination directory securely."""
    logger.info(f"Extracting zip file {zip_path} to {dest_dir}")
    dest_dir.mkdir(parents=True, exist_ok=True)
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Check for zip bomb or empty zip
            total_size = sum(file.file_size for file in zip_ref.infolist())
            if total_size > 100 * 1024 * 1024:  # 100 MB limit on total zip content
                raise ParsingError("Extracted content size exceeds limit of 100MB.")
            
            # Secure Extraction: Loop through members and validate path to prevent Zip Slip
            for member in zip_ref.infolist():
                # Resolve target path to evaluate traversal elements (e.g. '../')
                target_path = (dest_dir / member.filename).resolve()
                if not is_safe_path(dest_dir, target_path):
                    logger.error(f"Zip Slip attempt detected! Rejected file: {member.filename}")
                    raise ParsingError(f"Security Alert: ZIP archive contains invalid file path traversal: {member.filename}")
                
                # Safe to extract
                zip_ref.extract(member, dest_dir)
    except zipfile.BadZipFile as e:
        logger.error(f"Bad zip file: {str(e)}")
        raise ParsingError("Uploaded file is not a valid zip archive.")
    except AppException:
        raise
    except Exception as e:
        logger.error(f"Error extracting zip: {str(e)}")
        raise ParsingError(f"Failed to extract repository ZIP: {str(e)}")

def parse_directory(dir_path: Path, project_id: uuid.UUID) -> list[dict]:
    """
    Traverses a local directory and parses all matching source code files.
    Filters files > 5MB and ignores folders in EXCLUDED_DIRS.
    """
    logger.info(f"Parsing codebase directory {dir_path} for project {project_id}")
    parsed_files = []
    
    # 5MB File Limit specifically for analysis
    MAX_FILE_SIZE_LIMIT = 5 * 1024 * 1024
    
    # Traverse directory and parse files
    for root, dirs, files in os.walk(dir_path):
        # Exclude directories in-place to prevent os.walk from entering them
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            
            # Check suffix
            if not is_text_file(file_path):
                continue
                
            # Check size (Ignore files larger than 5 MB)
            try:
                file_size = file_path.stat().st_size
                if file_size > MAX_FILE_SIZE_LIMIT:
                    logger.debug(f"Skipping {file_path} - file size ({file_size}) exceeds 5 MB limit.")
                    continue
            except OSError:
                continue

            # Read content
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                # Get path relative to base directory
                rel_path = file_path.relative_to(dir_path).as_posix()
                
                parsed_files.append({
                    "file_path": rel_path,
                    "content": content,
                    "project_id": str(project_id)
                })
            except Exception as e:
                logger.warning(f"Failed to read file {file_path}: {str(e)}")
                continue

    logger.info(f"Parsing completed. Found {len(parsed_files)} source files.")
    return parsed_files

def parse_zip_file(zip_path: Path, project_id: uuid.UUID) -> list[dict]:
    """Backward-compatible parse_zip_file for existing code and tests."""
    extract_dir = Path(settings.UPLOAD_DIR) / str(project_id)
    extract_zip(zip_path, extract_dir)
    return parse_directory(extract_dir, project_id)
