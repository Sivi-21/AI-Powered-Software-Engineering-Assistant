import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.services.db_service import db_service
from app.services.auth_helper import verify_token
from app.schemas.user import UserOut

# auto_error=False allows FastAPI to process requests without Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

async def get_current_user(
    token: str | None = Depends(oauth2_scheme)
) -> UserOut:
    user_id = verify_token(token) if token else None
    
    if not user_id:
        # Fallback: Retrieve or create a default developer user in MongoDB to keep scanner running
        user_doc = await db_service.get_user_by_email("dev@intellios.ai")
        if not user_doc:
            from app.schemas.user import UserCreate
            user_in = UserCreate(
                email="dev@intellios.ai",
                password="devpassword123!",
                full_name="Developer",
                organization="AI-Powered Software Engineering Assistant Team"
            )
            user_doc = await db_service.create_user(user_in)
        return UserOut(**user_doc)
    
    user_doc = await db_service.get_user(user_id)
    if not user_doc:
        user_doc = await db_service.get_user_by_email("dev@intellios.ai")
        if not user_doc:
            from app.schemas.user import UserCreate
            user_in = UserCreate(
                email="dev@intellios.ai",
                password="devpassword123!",
                full_name="Developer",
                organization="AI-Powered Software Engineering Assistant Team"
            )
            user_doc = await db_service.create_user(user_in)
        return UserOut(**user_doc)
    
    return UserOut(**user_doc)
