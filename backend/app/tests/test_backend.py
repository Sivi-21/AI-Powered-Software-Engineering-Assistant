import io
import os
import zipfile
import tempfile
from pathlib import Path
import uuid
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import app
from app.config import settings
from app.services.vector_store import vector_store
from app.services.file_parser import is_text_file, parse_zip_file
from app.exceptions import ParsingError

# Initialize the TestClient
client = TestClient(app)

# ==========================================
# 1. TEXT CHUNKER TESTS (vector_store.py)
# ==========================================

def test_chunk_text_basic():
    """Positive Case: Verify text is split into chunks with proper overlap."""
    text = "\n".join([f"Line {i}" for i in range(1, 100)])
    # Custom small chunk size for testing
    chunks = vector_store.chunk_text(text, chunk_size=100, chunk_overlap=20)
    
    assert len(chunks) > 1
    for content, start_line in chunks:
        assert isinstance(content, str)
        assert len(content) > 0
        assert start_line >= 1

def test_chunk_text_empty_input():
    """Boundary Case: Verify chunking an empty string returns no chunks."""
    chunks = vector_store.chunk_text("", chunk_size=100, chunk_overlap=20)
    assert len(chunks) == 0

def test_chunk_text_shorter_than_chunk_size():
    """Boundary Case: Verify text shorter than chunk_size returns a single chunk."""
    text = "Short python code block."
    chunks = vector_store.chunk_text(text, chunk_size=100, chunk_overlap=20)
    assert len(chunks) == 1
    assert chunks[0][0] == text
    assert chunks[0][1] == 1

def test_chunk_text_very_long_line():
    """Edge Case: Verify how chunker behaves when a single line exceeds chunk_size."""
    long_line = "A" * 500
    text = f"First Line\n{long_line}\nLast Line"
    chunks = vector_store.chunk_text(text, chunk_size=100, chunk_overlap=10)
    
    # Chunker line-integrity preservation means the long line is grouped as a single chunk
    assert len(chunks) >= 2
    contents = [c[0] for c in chunks]
    assert long_line in contents

# ==========================================
# 2. FILE PARSER TESTS (file_parser.py)
# ==========================================

def test_is_text_file_allowed_extensions():
    """Positive & Negative Cases: Verify allowed/disallowed extensions."""
    assert is_text_file(Path("test.py")) is True
    assert is_text_file(Path("index.js")) is True
    assert is_text_file(Path("main.cpp")) is True
    assert is_text_file(Path("picture.png")) is False
    assert is_text_file(Path("archive.zip")) is False
    assert is_text_file(Path("no_extension")) is False

def test_parse_zip_file_success():
    """Positive Case: Verify extraction and parsing of valid source files inside ZIP."""
    project_id = uuid.uuid4()
    
    # Create an in-memory zip file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
        zip_file.writestr("main.py", "print('hello')")
        zip_file.writestr("utils.js", "console.log('test')")
        zip_file.writestr("ignored.png", "binary_data_here")
        zip_file.writestr("sub_dir/helper.py", "def help(): pass")
        
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as temp_zip:
        temp_zip.write(zip_buffer.getvalue())
        temp_zip_path = Path(temp_zip.name)

    try:
        parsed_files = parse_zip_file(temp_zip_path, project_id)
        
        # Verify valid files were extracted and non-text files were filtered out
        assert len(parsed_files) == 3
        
        file_paths = {f["file_path"] for f in parsed_files}
        assert "main.py" in file_paths
        assert "utils.js" in file_paths
        assert "sub_dir/helper.py" in file_paths
        assert "ignored.png" not in file_paths
        
        for f in parsed_files:
            assert f["project_id"] == str(project_id)
            assert len(f["content"]) > 0
    finally:
        # Cleanup temp file and extracted files
        if temp_zip_path.exists():
            temp_zip_path.unlink()
        
        extracted_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        if extracted_dir.exists():
            import shutil
            shutil.rmtree(extracted_dir)

def test_parse_zip_file_invalid_format():
    """Negative Case: Verify that invalid zip archives raise a ParsingError."""
    project_id = uuid.uuid4()
    
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as temp_zip:
        temp_zip.write(b"NOT_A_ZIP_CONTENT")
        temp_zip_path = Path(temp_zip.name)

    try:
        with pytest.raises(ParsingError) as exc_info:
            parse_zip_file(temp_zip_path, project_id)
        assert "not a valid zip archive" in str(exc_info.value.message)
    finally:
        if temp_zip_path.exists():
            temp_zip_path.unlink()

def test_parse_zip_file_exclusions():
    """Boundary Case: Verify files in excluded folders (node_modules, venv) are skipped."""
    project_id = uuid.uuid4()
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
        zip_file.writestr("app/main.py", "print('main')")
        zip_file.writestr("node_modules/express/index.js", "console.log('node')")
        zip_file.writestr(".venv/lib/site-packages/package.py", "def package(): pass")
        
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as temp_zip:
        temp_zip.write(zip_buffer.getvalue())
        temp_zip_path = Path(temp_zip.name)

    try:
        parsed_files = parse_zip_file(temp_zip_path, project_id)
        
        # Only app/main.py should be parsed
        assert len(parsed_files) == 1
        assert parsed_files[0]["file_path"] == "app/main.py"
    finally:
        if temp_zip_path.exists():
            temp_zip_path.unlink()
        extracted_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        if extracted_dir.exists():
            import shutil
            shutil.rmtree(extracted_dir)

def test_parse_zip_file_size_limit():
    """Boundary Case: Verify files exceeding MAX_FILE_SIZE are silently skipped."""
    project_id = uuid.uuid4()
    
    # Create content that exceeds max file size limit (1MB default in settings)
    large_content = "A" * (settings.MAX_FILE_SIZE + 100)
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
        zip_file.writestr("small.py", "print('small')")
        zip_file.writestr("large.py", large_content)
        
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as temp_zip:
        temp_zip.write(zip_buffer.getvalue())
        temp_zip_path = Path(temp_zip.name)

    try:
        parsed_files = parse_zip_file(temp_zip_path, project_id)
        
        # Only small.py should be parsed; large.py is skipped
        assert len(parsed_files) == 1
        assert parsed_files[0]["file_path"] == "small.py"
    finally:
        if temp_zip_path.exists():
            temp_zip_path.unlink()
        extracted_dir = Path(settings.UPLOAD_DIR) / str(project_id)
        if extracted_dir.exists():
            import shutil
            shutil.rmtree(extracted_dir)

# ==========================================
# 3. ROUTER / API ENDPOINTS TESTS (main.py)
# ==========================================

def test_read_root_endpoint():
    """Positive Case: Verify root path responds with API instructions."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Welcome" in data["message"]
    assert data["docs_url"] == "/docs"

def test_list_projects_empty_db():
    """Positive Case: List projects returns an empty array when no projects exist."""
    # Mock db dependency and crud service
    mock_db = MagicMock()
    mock_get_projects = AsyncMock(return_value=[])
    
    with patch("app.database.get_db", return_value=mock_db):
        with patch("app.services.db_service.db_service.get_all_projects", mock_get_projects):
            response = client.get("/api/v1/projects")
            
            assert response.status_code == 200
            assert response.json() == []

def test_get_project_not_found():
    """Negative Case: Retrieve a project ID that does not exist returns 404."""
    project_id = uuid.uuid4()
    mock_db = MagicMock()
    mock_get_project = AsyncMock(return_value=None)
    
    with patch("app.database.get_db", return_value=mock_db):
        with patch("app.services.db_service.db_service.get_project", mock_get_project):
            response = client.get(f"/api/v1/projects/{project_id}")
            
            assert response.status_code == 404
            assert "not found" in response.json()["detail"]
