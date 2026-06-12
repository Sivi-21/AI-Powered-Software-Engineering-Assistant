import uuid
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime, timezone

from app.main import app
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project import Project

client = TestClient(app)

# Mock users for testing
MOCK_USER_A = User(
    id=uuid.uuid4(),
    email="user_a@intellios.ai",
    hashed_password="hashed_password_a",
    full_name="SIVAGAMI R",
    organization="IntelliOS User A",
    plan_type="Enterprise Plan",
    created_at=datetime.now(timezone.utc)
)

MOCK_USER_B = User(
    id=uuid.uuid4(),
    email="user_b@intellios.ai",
    hashed_password="hashed_password_b",
    full_name="User B",
    organization="IntelliOS User B",
    plan_type="Developer Plan",
    created_at=datetime.now(timezone.utc)
)

# ==========================================
# 1. SIGNUP & LOGIN ROUTE TESTS
# ==========================================

@patch("app.services.db_service.db_service.get_user_by_email", new_callable=AsyncMock)
@patch("app.services.db_service.db_service.create_user", new_callable=AsyncMock)
def test_signup_success(mock_create_user, mock_get_user_by_email):
    """Positive Case: Verify user registration completes successfully."""
    mock_get_user_by_email.return_value = None
    mock_create_user.return_value = MOCK_USER_A

    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "user_a@intellios.ai",
            "name": "SIVAGAMI R",
            "organization": "IntelliOS User A",
            "password": "strongpassword123"
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "user_a@intellios.ai"
    assert data["name"] == "SIVAGAMI R"
    assert "password" not in data

@patch("app.services.db_service.db_service.get_user_by_email", new_callable=AsyncMock)
def test_signup_email_conflict(mock_get_user_by_email):
    """Failure Case: Verify that registering an existing email returns 400 Bad Request."""
    mock_get_user_by_email.return_value = MOCK_USER_A

    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "user_a@intellios.ai",
            "name": "SIVAGAMI R",
            "organization": "IntelliOS User A",
            "password": "strongpassword123"
        }
    )

    assert response.status_code == 400
    assert "exists" in response.json()["detail"].lower()

@patch("app.services.db_service.db_service.get_user_by_email", new_callable=AsyncMock)
@patch("app.api.routes.auth.verify_password", return_value=True)
def test_login_success(mock_verify_password, mock_get_user_by_email):
    """Positive Case: Verify correct credentials return a valid access token."""
    mock_get_user_by_email.return_value = MOCK_USER_A

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "user_a@intellios.ai",
            "password": "correctpassword"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@patch("app.services.db_service.db_service.get_user_by_email", new_callable=AsyncMock)
@patch("app.api.routes.auth.verify_password", return_value=False)
def test_login_invalid_credentials(mock_verify_password, mock_get_user_by_email):
    """Failure Case: Verify incorrect password returns 400 Bad Request."""
    mock_get_user_by_email.return_value = MOCK_USER_A

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "user_a@intellios.ai",
            "password": "wrongpassword"
        }
    )

    assert response.status_code == 400
    assert "incorrect" in response.json()["detail"].lower()

# ==========================================
# 2. PROFILE ROUTE & MULTI-TENANT ACCESS TESTS
# ==========================================

def test_get_me_unauthorized():
    """Failure Case: Accessing profile endpoint without JWT token yields 403 / 401."""
    response = client.get("/api/v1/auth/me")
    # Depends(HTTPBearer) returns 401 Unauthorized by default on missing credentials header
    assert response.status_code == 401

def test_get_me_authorized():
    """Positive Case: Accessing profile endpoint with valid JWT token returns profile data."""
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER_A

    try:
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer mock_token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "user_a@intellios.ai"
        assert data["name"] == "SIVAGAMI R"
    finally:
        app.dependency_overrides.clear()

# ==========================================
# 3. PROJECT MULTI-TENANT ISOLATION TESTS
# ==========================================

@patch("app.services.db_service.db_service.get_all_projects", new_callable=AsyncMock)
def test_projects_list_scoped_by_user(mock_get_projects):
    """Positive Case: Lists user's own projects and filters out other projects."""
    now = datetime.now(timezone.utc)
    project_1 = Project(id=uuid.uuid4(), name="UserA Repo", user_id=MOCK_USER_A.id, status="completed", created_at=now, updated_at=now)
    project_2 = Project(id=uuid.uuid4(), name="UserA Zip", user_id=MOCK_USER_A.id, status="completed", created_at=now, updated_at=now)
    
    mock_get_projects.return_value = [project_1, project_2]
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER_A

    try:
        response = client.get(
            "/api/v1/projects",
            headers={"Authorization": "Bearer mock_token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "UserA Repo"
        
        # Verify db_service query filter was called with user_id
        mock_get_projects.assert_called_once()
        args, kwargs = mock_get_projects.call_args
        assert kwargs.get("user_id") == MOCK_USER_A.id
    finally:
        app.dependency_overrides.clear()

@patch("app.services.db_service.db_service.get_project", new_callable=AsyncMock)
def test_project_unauthorized_access_forbidden(mock_get_project):
    """Negative Case: Accessing a project owned by another user yields 403 Forbidden."""
    now = datetime.now(timezone.utc)
    project_other = Project(
        id=uuid.uuid4(),
        repository_name="UserB Secret Repo",
        owner_id=uuid.uuid4(), # different user id
        status="completed",
        created_at=now,
        updated_at=now
    )
    mock_get_project.return_value = project_other
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER_A

    try:
        response = client.get(
            f"/api/v1/projects/{project_other.id}",
            headers={"Authorization": "Bearer mock_token"}
        )
        assert response.status_code == 403
        assert "forbidden" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()

def test_github_authorize():
    """Positive Case: GET /auth/github/authorize returns redirect URL."""
    response = client.get("/api/v1/auth/github/authorize")
    assert response.status_code == 200
    assert "authorize_url" in response.json()

@patch("app.services.db_service.db_service.get_user_by_github_id", new_callable=AsyncMock)
@patch("app.services.db_service.db_service.get_user_by_email", new_callable=AsyncMock)
@patch("app.services.db_service.db_service.create_github_user", new_callable=AsyncMock)
def test_github_callback_mock_success(mock_create_gh_user, mock_get_user_email, mock_get_user_gh):
    """Positive Case: POST /auth/github/callback mock code creates user/logs in."""
    mock_get_user_gh.return_value = None
    mock_get_user_email.return_value = None
    mock_create_gh_user.return_value = MOCK_USER_A

    response = client.post(
        "/api/v1/auth/github/callback",
        json={"code": "mock_code"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

