from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sonura VoiceOps Core API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development")
    
    # Internal routing
    BACKEND_API_URL: str = Field(default="http://localhost:8000")

    # Security and CORS
    SECRET_KEY: str = Field(default="SUPER_SECRET_CHANGE_ME_IN_PRODUCTION_32_CHARS_MIN")
    CORS_ORIGINS: List[str] = ["*"]
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Supabase Database Settings
    SUPABASE_URL: str = Field(default="", env="SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")
    
    # LiveKit Voice Settings
    LIVEKIT_URL: str = Field(default="", env="LIVEKIT_URL")
    LIVEKIT_API_KEY: str = Field(default="", env="LIVEKIT_API_KEY")
    LIVEKIT_API_SECRET: str = Field(default="", env="LIVEKIT_API_SECRET")
    
    # AI Provider Keys
    GROQ_API_KEY: str = Field(default="", env="GROQ_API_KEY")
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    DEEPGRAM_API_KEY: str = Field(default="", env="DEEPGRAM_API_KEY")
    
    # Transactional Email Key
    RESEND_API_KEY: str = Field(default="", env="RESEND_API_KEY")

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()