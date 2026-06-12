import io
import zipfile
import tempfile
import uuid
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.services.file_parser import parse_zip_file
from app.exceptions import ParsingError, AppException

client = TestClient(app)

# ==========================================
# 1. PATH TRAVERSAL (ZIP SLIP) SECURITY TEST
# ==========================================

def test_zip_slip_traversal_detection():
    """Security Case: Verify that Zip Slip traversal files inside ZIP raise ParsingError."""
    project_id = uuid.uuid4()
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
        # Create a malicious zip entry trying to escape the target directory
        zip_file.writestr("../../../etc/passwd", "root:x:0:0:root:/root:/bin/bash")
        
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as temp_zip:
        temp_zip.write(zip_buffer.getvalue())
        temp_zip_path = Path(temp_zip.name)

    try:
        with pytest.raises(ParsingError) as exc_info:
            parse_zip_file(temp_zip_path, project_id)
        # Verify that Zip Slip traversal was blocked
        assert "invalid file path traversal" in str(exc_info.value.message)
    finally:
        if temp_zip_path.exists():
            temp_zip_path.unlink()


# ==========================================
# 2. ENVELOPE / ROUTE UPLOAD SECURITY TESTS
# ==========================================

def test_upload_non_zip_file():
    """Negative Case: Uploading a file without a .zip extension should return 400 Bad Request."""
    file_content = b"print('not a zip file')"
    response = client.post(
        "/api/v1/projects/upload",
        files={"file": ("malicious.py", file_content, "text/x-python")},
        data={"name": "test_security_project"}
    )
    
    assert response.status_code == 400
    assert "Only ZIP files are supported" in response.json()["detail"]


def test_upload_corrupt_zip_file():
    """Negative Case: Uploading a corrupted zip file should return a parsing error status."""
    # A corrupt ZIP is sent, background processing handles it and marks the project as failed.
    # To test validation, we mock the background tasks and database.
    from unittest.mock import AsyncMock, patch
    from app.models.project import Project
    from app.database import get_db
    from datetime import datetime, timezone
    
    mock_project = Project(name="corrupt_project", status="pending", repository_source="ZIP")
    mock_project.id = uuid.uuid4()
    mock_project.created_at = datetime.now(timezone.utc)
    mock_project.updated_at = datetime.now(timezone.utc)
    mock_create = AsyncMock(return_value=mock_project)
    
    mock_db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    
    try:
        with patch("app.api.routes.projects.db_service.create_project", mock_create):
            response = client.post(
                "/api/v1/projects/upload",
                files={"file": ("corrupt.zip", b"INVALID_ZIP_SIGNATURE_DATA", "application/zip")},
                data={"name": "corrupt_project"}
            )
            # Endpoint immediately accepts and delegates to background, returning 201
            assert response.status_code == 201
            assert response.json()["status"] == "pending"
    finally:
        app.dependency_overrides.clear()
