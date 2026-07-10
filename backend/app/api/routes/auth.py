import json
import logging
import urllib.parse
import urllib.request
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.services.db_service import db_service
from app.services.auth_helper import verify_password, create_access_token
from app.api.deps import get_current_user
from app.mongodb import get_database

router = APIRouter(tags=["authentication"])
logger = logging.getLogger("app.api.routes.auth")

class GitHubCallbackInput(BaseModel):
    code: str
    state: str | None = None

def exchange_github_code(client_id: str, client_secret: str, code: str) -> str | None:
    url = "https://github.com/login/oauth/access_token"
    data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code
    }).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Accept": "application/json", "User-Agent": "intellios-api"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("access_token")
    except Exception as e:
        logger.error(f"Failed to exchange GitHub code: {str(e)}")
        return None

def get_github_user(access_token: str) -> dict | None:
    url = "https://api.github.com/user"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "User-Agent": "intellios-api"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to fetch GitHub user: {str(e)}")
        return None

def get_github_emails(access_token: str) -> list | None:
    url = "https://api.github.com/user/emails"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "User-Agent": "intellios-api"
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to fetch GitHub emails: {str(e)}")
        return None

@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate):
    """Registers a new user."""
    existing_user = await db_service.get_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )
    user_doc = await db_service.create_user(user_in)
    return user_doc

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Logs in an existing user."""
    user = await db_service.get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": str(user["id"])})
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserOut)
async def get_me(current_user: UserOut = Depends(get_current_user)):
    """Retrieves the authenticated user profile."""
    return current_user

@router.get("/github/authorize")
async def github_authorize():
    """Returns the GitHub Authorize URL for redirecting the client."""
    client_id = settings.GITHUB_CLIENT_ID or "mock_client_id"
    redirect_uri = settings.GITHUB_REDIRECT_URI
    authorize_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=read:user,user:email"
    )
    return {"authorize_url": authorize_url}

@router.post("/github/callback", response_model=Token)
async def github_callback(payload: GitHubCallbackInput):
    """Exchanges authorization code for GitHub access token, retrieves user info, and returns a JWT login token."""
    client_id = settings.GITHUB_CLIENT_ID
    client_secret = settings.GITHUB_CLIENT_SECRET
    
    # Check if OAuth is mock or unconfigured
    if not client_id or not client_secret or payload.code == "mock_code":
        # Simulate OAuth flow with a sandbox account
        mock_github_id = "12345678"
        mock_email = "sandbox_github@intellios.ai"
        mock_username = "SIVAGAMI R"
        mock_avatar = "https://github.com/identicons/sandbox.png"
        
        user = await db_service.get_user_by_github_id(mock_github_id)
        if not user:
            user = await db_service.get_user_by_email(mock_email)
            if user:
                db = get_database()
                await db.users.update_one(
                    {"_id": user["id"]},
                    {"$set": {"github_id": mock_github_id, "avatar_url": mock_avatar}}
                )
            else:
                user = await db_service.create_github_user(
                    github_id=mock_github_id,
                    email=mock_email,
                    full_name=mock_username,
                    avatar_url=mock_avatar
                )
        
        access_token = create_access_token(data={"sub": str(user["id"])})
        return {"access_token": access_token, "token_type": "bearer"}

    access_token = exchange_github_code(client_id, client_secret, payload.code)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve access token from GitHub."
        )

    gh_profile = get_github_user(access_token)
    if not gh_profile or "id" not in gh_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve user profile from GitHub."
        )

    github_id = str(gh_profile["id"])
    username = gh_profile.get("login") or "GitHubUser"
    full_name = gh_profile.get("name") or username
    avatar_url = gh_profile.get("avatar_url")

    email = gh_profile.get("email")
    if not email:
        emails_list = get_github_emails(access_token)
        if emails_list:
            for em in emails_list:
                if em.get("primary") and em.get("verified"):
                    email = em.get("email")
                    break
            if not email:
                email = emails_list[0].get("email")

    if not email:
        email = f"{github_id}+{username}@users.noreply.github.com"

    user = await db_service.get_user_by_github_id(github_id)
    if not user:
        user = await db_service.get_user_by_email(email)
        if user:
            db = get_database()
            update_data = {"github_id": github_id}
            if not user.get("avatar_url") and avatar_url:
                update_data["avatar_url"] = avatar_url
            await db.users.update_one({"_id": user["id"]}, {"$set": update_data})
        else:
            user = await db_service.create_github_user(
                github_id=github_id,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url
            )

    jwt_access_token = create_access_token(data={"sub": str(user["id"])})
    return {
        "access_token": jwt_access_token,
        "token_type": "bearer"
    }


class GoogleCallbackInput(BaseModel):
    id_token: str

class GoogleLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

@router.post("/google", response_model=GoogleLoginResponse)
async def google_callback(payload: GoogleCallbackInput):
    """Verifies the Google ID token and logs in or registers the user."""
    from google.oauth2 import id_token
    from google.auth.transport import requests
    from app.services.auth_helper import create_refresh_token
    from app.schemas.user import UserOut

    client_id = settings.GOOGLE_CLIENT_ID
    logger.info("Initiating Google authentication flow.")
    if not client_id:
        logger.warning("Google Authentication is disabled: GOOGLE_CLIENT_ID is not configured on the server.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google Authentication is disabled / not configured on this server."
        )
    logger.info(f"Google Client ID verified on server: {client_id[:15]}...")

    try:
        logger.debug("Verifying ID Token using Google's authentication libraries.")
        # Verify the ID Token using Google's official library
        idinfo = id_token.verify_oauth2_token(
            payload.id_token, 
            requests.Request(), 
            client_id
        )

        # Check issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            logger.error(f"Google authentication failed: Wrong issuer '{idinfo.get('iss')}'")
            raise ValueError('Wrong issuer.')

        logger.info("Google ID token verified successfully via google-auth API.")

    except Exception as e:
        logger.error(f"Google ID token verification failed with error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credentials or ID Token."
        )

    # Token is valid; extract user parameters
    google_id = idinfo.get("sub")
    email = idinfo.get("email")
    full_name = idinfo.get("name") or idinfo.get("given_name") or "Google User"
    avatar_url = idinfo.get("picture")

    logger.info(f"Extracted user info: email={email}, sub={google_id}, name={full_name}")

    if not email:
        logger.error("Google ID token is missing verified email address.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google ID token does not contain a verified email address."
        )

    # Check if user already registered via Google
    logger.debug(f"Checking if user with Google ID {google_id} exists in database.")
    user = await db_service.get_user_by_google_id(google_id)
    if not user:
        logger.info(f"No user found by Google ID. Checking if email {email} exists for local account association.")
        # Check if email is already in use by local user
        user = await db_service.get_user_by_email(email)
        if user:
            logger.info(f"Found existing local user with email {email}. Linking Google ID {google_id}.")
            # Associate Google login with existing local account
            db = get_database()
            update_data = {
                "google_id": google_id,
                "login_provider": "google"
            }
            if not user.get("avatar_url") and avatar_url:
                update_data["avatar_url"] = avatar_url
            await db.users.update_one({"_id": user["id"]}, {"$set": update_data})
            # Retrieve updated user
            user = await db_service.get_user(user["id"])
        else:
            logger.info(f"Creating a new Google user in database for email {email}.")
            # Create a brand new Google user
            user = await db_service.create_google_user(
                google_id=google_id,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url
            )
    else:
        logger.info(f"User {email} successfully resolved using Google ID.")

    jwt_access_token = create_access_token(data={"sub": str(user["id"])})
    jwt_refresh_token = create_refresh_token(data={"sub": str(user["id"])})
    logger.info(f"Authentication token generated successfully for user ID: {user['id']}")

    return {
        "access_token": jwt_access_token,
        "refresh_token": jwt_refresh_token,
        "token_type": "bearer",
        "user": UserOut(**user)
    }
