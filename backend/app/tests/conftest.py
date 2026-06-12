import pytest
import uuid
from datetime import datetime, timezone
from app.main import app
from app.api.deps import get_current_user
from app.models.user import User

MOCK_TEST_USER = User(
    id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
    email="test_user@intellios.ai",
    hashed_password="hashed_password",
    full_name="SIVAGAMI R",
    organization="Test Org",
    plan_type="Enterprise Plan",
    created_at=datetime.now(timezone.utc)
)

@pytest.fixture(autouse=True)
def override_auth(request):
    # Do not override auth for test_auth.py since it tests authentication mechanisms
    if "test_auth" in request.node.fspath.strpath:
        yield
        return

    # Globally override security dependency for all other logic tests
    app.dependency_overrides[get_current_user] = lambda: MOCK_TEST_USER
    yield
    app.dependency_overrides.pop(get_current_user, None)
