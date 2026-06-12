from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import register_exception_handlers
from app.api.router import api_router
from app.database.session import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Events
    setup_logging()
    yield
    # Shutdown Events: Clean connection pools
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready FastAPI backend skeleton for the AI-Powered Software Engineering Assistant.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware mapping
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include central API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Register custom app exception mapping handlers
register_exception_handlers(app)

@app.get("/", tags=["root"])
async def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API.",
        "docs_url": "/docs",
        "version": "1.0.0"
    }
