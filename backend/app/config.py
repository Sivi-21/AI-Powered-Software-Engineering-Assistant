import os
import sys
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator

# Define paths relative to the config file itself for robustness
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"

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
    JWT_SECRET: str | None = None
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # GitHub OAuth Settings
    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None
    GITHUB_REDIRECT_URI: str = "http://localhost:5173/oauth/callback"

    # Google OAuth Settings
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None

    # Allowed CORS Origins (comma-separated string)
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @model_validator(mode="after")
    def set_jwt_secret_key(self):
        if self.JWT_SECRET:
            self.JWT_SECRET_KEY = self.JWT_SECRET
        return self

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
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def print_diagnostics(self):
        """Displays startup diagnostics."""
        print("=" * 60)
        print("STARTUP DIAGNOSTICS:")
        print(f"Current Working Directory : {os.getcwd()}")
        print(f"Loaded .env path          : {ENV_FILE_PATH.resolve() if ENV_FILE_PATH.exists() else 'NOT FOUND'}")
        print(f"Loaded GOOGLE_CLIENT_ID   : {self.GOOGLE_CLIENT_ID}")
        print(f"Loaded JWT_SECRET         : {'[CONFIGURED]' if (self.JWT_SECRET or self.JWT_SECRET_KEY) else 'MISSING'}")
        print(f"Loaded Mongo URI          : {self.MONGO_URI}")
        print("=" * 60)
        sys.stdout.flush()

    def validate_required_env(self):
        """Validates configuration and stops application if required variables are missing."""
        missing = []
        if not self.GOOGLE_CLIENT_ID:
            print("WARNING: GOOGLE_CLIENT_ID is not configured. Google Sign-In will be disabled.", file=sys.stderr)
            sys.stderr.flush()
        if not self.MONGO_URI:
            missing.append("MONGO_URI")
        if not self.JWT_SECRET and self.JWT_SECRET_KEY == "supersecretkey_change_me_in_prod":
            missing.append("JWT_SECRET (must not be default/empty)")

        if missing:
            error_message = (
                f"FATAL STARTUP ERROR: Missing or invalid required environment variable(s): {', '.join(missing)}.\n"
                f"Please ensure they are correctly set in the environment or inside {ENV_FILE_PATH.resolve()}"
            )
            print(error_message, file=sys.stderr)
            sys.stderr.flush()
            raise ValueError(error_message)


# Load single global settings object
settings = Settings()

# Ensure folders exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)