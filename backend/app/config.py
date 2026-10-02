import os
import json
from pydantic_settings import BaseSettings
from pydantic import Field

def get_cors_origins() -> list[str]:
    """Return normalized allowed origins from JSON or comma-separated config."""
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if not raw:
        return ["*"]

    if raw.startswith("["):
        try:
            configured_origins = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError("CORS_ORIGINS must be valid JSON when it starts with '['.") from exc
        if not isinstance(configured_origins, list) or not all(
            isinstance(origin, str) for origin in configured_origins
        ):
            raise ValueError("CORS_ORIGINS JSON must be an array of strings.")
    else:
        configured_origins = raw.split(",")

    return [
        origin.strip().rstrip("/")
        for origin in configured_origins
        if origin.strip()
    ]
class Settings(BaseSettings):
    PROJECT_NAME: str = "DocuMind API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = Field(default="", env="DATABASE_URL")

    SECRET_KEY: str = Field(default="", env="SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    UPLOAD_DIR: str = Field(default="./uploads", env="UPLOAD_DIR")
    MAX_FILE_SIZE_MB: int = 50

    GROQ_API_KEY: str = Field(default="", env="GROQ_API_KEY")
    GROQ_MODEL: str = Field(default="llama-3.3-70b-versatile", env="GROQ_MODEL")

    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    AI_API_KEY: str = Field(default="", env="AI_API_KEY")

    # NOTE: CORS_ORIGINS is intentionally NOT a field here. It is parsed by
    # get_cors_origins() so both JSON arrays and comma-separated values work.

    class Config:
        env_file = ".env"
        extra = "ignore"   # keep CORS_ORIGINS out of pydantic's List parsing


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
