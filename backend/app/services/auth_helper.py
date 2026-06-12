import jwt
import bcrypt
import logging
from datetime import datetime, timedelta, timezone
from app.config import settings

logger = logging.getLogger("app.services.auth_helper")

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a password against its hashed representation."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        logger.error(f"Error verifying password: {str(e)}")
        return False

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Generates a JWT access token for a user."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> str | None:
    """Decodes and validates a JWT token. Returns the sub (user ID) if valid, otherwise None."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        return user_id
    except jwt.PyJWTError as e:
        logger.warning(f"JWT Verification failed: {str(e)}")
        return None
