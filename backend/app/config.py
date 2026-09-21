import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "DocuMind API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Database
    # Default to PostgreSQL, with asyncpg driver
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/qna_db",
        env="DATABASE_URL",
    )

    # JWT Authentication
    SECRET_KEY: str = Field(
        default="documind-super-secret-production-key-2026-secure",
        env="SECRET_KEY",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # File uploads
    UPLOAD_DIR: str = Field(default="./uploads", env="UPLOAD_DIR")
    MAX_FILE_SIZE_MB: int = 50

    # AI Configuration (Optional, system works offline with smart extractive RAG if no key provided)
    GROQ_API_KEY: str = Field(default="", env="GROQ_API_KEY")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-120b", env="GROQ_MODEL")
    AI_API_KEY: str = Field(default="", env="AI_API_KEY")
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
