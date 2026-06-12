import pytest
import uuid
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from app.main import app
from app.api.routes.repositories import GITHUB_URL_REGEX
from app.exceptions import AppException
from app.services.git_handler import git_handler

client = TestClient(app)

# ==========================================
# 1. URL VALIDATION TESTS
# ==========================================

def test_github_url_regex_validation_success():
    """Positive Case: Verify that valid GitHub URLs match the regex."""
    valid_urls = [
        "https://github.com/user/repository",
        "http://github.com/user/repository",
        "https://www.github.com/user/repository",
        "https://github.com/user/repository.git",
        "https://github.com/user-name/repo_name.git/",
    ]
    for url in valid_urls:
        match = GITHUB_URL_REGEX.match(url.strip())
        assert match is not None
        assert match.group(2) in ["user", "user-name"]
        assert match.group(3) in ["repository", "repo_name"]

def test_github_url_regex_validation_failure():
    """Negative Case: Verify that invalid GitHub URLs fail the regex."""
    invalid_urls = [
        "https://gitlab.com/user/repository",
        "https://github.com/user",  # Missing repo name
        "https://github.com//repository",  # Empty user
        "https://github.com/user/repository/tree/main",  # Subfolder / branch path not supported in simple root URL
        "invalid_string",
    ]
    for url in invalid_urls:
        match = GITHUB_URL_REGEX.match(url.strip())
        assert match is None

# ==========================================
# 2. GIT HANDLER UNIT TESTS
# ==========================================

@patch("git.Repo.clone_from")
def test_git_clone_success(mock_clone):
    """Positive Case: Verify successful repository cloning and commit hash extraction."""
    mock_repo = MagicMock()
    mock_repo.bare = False
    mock_repo.heads = [MagicMock()]
    mock_repo.head.commit.hexsha = "abcdef1234567890"
    mock_clone.return_value = mock_repo

    dest_dir = Path("./temp_test_dir")
    commit_hash = git_handler.clone_repo("https://github.com/user/repo", dest_dir)

    assert commit_hash == "abcdef1234567890"
    mock_clone.assert_called_once_with("https://github.com/user/repo", str(dest_dir), depth=1)

@patch("git.Repo.clone_from")
def test_git_clone_empty_repo(mock_clone):
    """Boundary Case: Verify exception raised when the cloned repository is empty."""
    mock_repo = MagicMock()
    mock_repo.bare = True  # Empty repo indicator
    mock_clone.return_value = mock_repo

    dest_dir = Path("./temp_test_dir")
    with pytest.raises(AppException) as exc_info:
        git_handler.clone_repo("https://github.com/user/repo", dest_dir)
        
    assert exc_info.value.status_code == 400
    assert "empty" in str(exc_info.value.message).lower()

@patch("git.Repo.clone_from")
def test_git_clone_not_found(mock_clone):
    """Failure Case: Verify exception mapping for repository not found."""
    import git
    mock_clone.side_effect = git.exc.GitCommandError("clone", "Repository not found")

    dest_dir = Path("./temp_test_dir")
    with pytest.raises(AppException) as exc_info:
        git_handler.clone_repo("https://github.com/user/repo", dest_dir)

    assert exc_info.value.status_code == 404
    assert "not found" in str(exc_info.value.message).lower()

# ==========================================
# 3. ROUTER INTEGRATION TESTS
# ==========================================

def test_analyze_github_endpoint_success():
    """Positive Case: POST /repositories/analyze-github triggers analysis workflow and returns project."""
    mock_db = MagicMock()
    now = datetime.now(timezone.utc)
    mock_project = MagicMock()
    mock_project.id = uuid.uuid4()
    mock_project.repository_name = "test-repo"
    mock_project.name = "test-repo"
    mock_project.status = "pending"
    mock_project.repository_source = "GITHUB"
    mock_project.github_url = "https://github.com/user/test-repo"
    mock_project.commit_hash = None
    mock_project.clone_timestamp = None
    mock_project.error_message = None
    mock_project.owner_id = uuid.uuid4()
    mock_project.user_id = mock_project.owner_id
    mock_project.created_at = now
    mock_project.updated_at = now

    mock_create = AsyncMock(return_value=mock_project)

    with patch("app.database.get_db", return_value=mock_db):
        with patch("app.services.db_service.db_service.create_project", mock_create):
            with patch("app.services.analysis_pipeline.analysis_pipeline.process_git_project_background") as mock_bg_task:
                response = client.post(
                    "/api/v1/repositories/analyze-github",
                    json={"repo_url": "https://github.com/user/test-repo"}
                )

                assert response.status_code == 201
                data = response.json()
                assert data["name"] == "test-repo"
                assert data["status"] == "pending"
                assert data["repository_source"] == "GITHUB"
                assert data["github_url"] == "https://github.com/user/test-repo"
                mock_bg_task.assert_called_once()

def test_analyze_github_endpoint_invalid_url():
    """Negative Case: POST /repositories/analyze-github fails with 400 on invalid URLs."""
    response = client.post(
        "/api/v1/repositories/analyze-github",
        json={"repo_url": "https://gitlab.com/user/test-repo"}
    )
    assert response.status_code == 400
    assert "Invalid GitHub repository URL" in response.json()["detail"]
