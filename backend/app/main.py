from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.logging_config import setup_logging
from app.exceptions import register_exception_handlers
from app.api.router import api_router
from app.database import engine, Base

from app.mongodb import connect_to_mongo, close_mongo_connection

# Lifespan events management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup Events
    setup_logging()
    await connect_to_mongo()
    yield
    # Shutdown Events
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for parsing repositories, indexing code semantically, and analyzing using LangGraph + Gemini API.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom API routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# Register exceptions handlers
register_exception_handlers(app)

@app.get("/", tags=["root"])
async def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API.",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
