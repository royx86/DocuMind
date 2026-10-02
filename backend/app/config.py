import os
import json
from pydantic_settings import BaseSettings
from pydantic import Field

def get_cors_origins() -> list[str]:
    """Return a list of allowed CORS origins from the CORS_ORIGINS environment variable.
    If not set, defaults to allowing all origins ("*").
    The variable should be a comma‑separated list of origins.
    """
    raw = os.getenv("CORS_ORIGINS", "")
    if not raw:
        return ["*"]
    # Split by commas and strip whitespace, ignoring empty entries
    return [origin.strip() for origin in raw.split(",") if origin.strip()]
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

    # NOTE: CORS_ORIGINS is intentionally NOT a field here.
    # pydantic-settings v2 tries to json.loads() any List field from env,
    # which crashes on comma-separated strings and empty values.
    # It is read directly from os.environ in main.py via get_cors_origins().

    class Config:
        env_file = ".env"
        extra = "ignore"   # ignore unknown env vars — prevents CORS_ORIGINS
                           # from being picked up and crashing the parser


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
