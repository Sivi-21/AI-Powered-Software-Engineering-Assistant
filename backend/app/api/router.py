from fastapi import APIRouter
from app.api.routes import projects, repositories, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(projects.router)
api_router.include_router(repositories.router)

