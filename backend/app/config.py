# import os
# from pathlib import Path
# from pydantic_settings import BaseSettings, SettingsConfigDict

# class Settings(BaseSettings):
#     PROJECT_NAME: str = "AI-Powered Software Engineering Assistant"
#     API_V1_STR: str = "/api/v1"
    
#     # Database Settings
#     POSTGRES_USER: str = "postgres"
#     POSTGRES_PASSWORD: str = "postgres"
#     POSTGRES_SERVER: str = "db"
#     POSTGRES_PORT: str = "5432"
#     POSTGRES_DB: str = "assistant"
    
#     # Construct Async Database URL by default
#     @property
# def DATABASE_URL(self) -> str:
#     return "sqlite+aiosqlite:///./assistant.db"    
#     # Gemini API Settings
#     GEMINI_API_KEY: str
    
#     # ChromaDB Settings
#     CHROMA_PERSIST_DIR: str = "/app/chromadb_data"
    
#     # File Storage Settings
#     UPLOAD_DIR: str = "/app/uploads"
    
#     # Allowed File Extensions for parsing
#     ALLOWED_EXTENSIONS: set[str] = {
#         ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", 
#         ".h", ".go", ".rs", ".html", ".css", ".json", ".md", ".yml", ".yaml", ".sh"
#     }
    
#     # Max file size in bytes (50MB)
#     MAX_FILE_SIZE: int = 50 * 1024 * 1024
    
#     model_config = SettingsConfigDict(
#         env_file=".env",
#         env_file_encoding="utf-8",
#         extra="ignore"
#     )

# # Instantiate settings
# settings = Settings(
#     _env_file=os.environ.get("ENV_FILE", ".env")
# )

# # Ensure folders exist
# Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
# Path(settings.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)


import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Software Engineering Assistant"
    API_V1_STR: str = "/api/v1"

    # Database Settings (kept for future PostgreSQL migration)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "assistant"

    # Temporary SQLite database for development (Deprecated for MongoDB)
    @property
    def DATABASE_URL(self) -> str:
        return "sqlite+aiosqlite:///./assistant.db"

    # MongoDB Settings
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "intellios_db"

    # Gemini API Settings
    GEMINI_API_KEY: str | None = None

    # Groq API Settings
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # OpenRouter Settings
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_MODEL: str = "google/gemini-2.5-flash:free"

    # GitHub Models Settings
    GITHUB_TOKEN: str | None = None
    GITHUB_MODEL: str = "gpt-4o-mini"

    # JWT Settings
    JWT_SECRET_KEY: str = "supersecretkey_change_me_in_prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours

    # GitHub OAuth Settings
    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None
    GITHUB_REDIRECT_URI: str = "http://localhost:5173/oauth/callback"


    # ChromaDB Settings
    CHROMA_PERSIST_DIR: str = "./chromadb_data"

    # File Storage Settings
    UPLOAD_DIR: str = "./uploads"

    # Allowed File Extensions
    ALLOWED_EXTENSIONS: set[str] = {
        ".py",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".java",
        ".cpp",
        ".c",
        ".h",
        ".go",
        ".rs",
        ".html",
        ".css",
        ".json",
        ".md",
        ".yml",
        ".yaml",
        ".sh",
    }

    # Max file size (50 MB)
    MAX_FILE_SIZE: int = 50 * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings(
    _env_file=os.environ.get("ENV_FILE", ".env")
)

# Create required folders automatically
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)