from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sonura VoiceOps Core API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development")
    
    # Security and CORS
    SECRET_KEY: str = Field(default="SUPER_SECRET_CHANGE_ME_IN_PRODUCTION_32_CHARS_MIN")
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    
    # Supabase Database Settings
    SUPABASE_URL: str = Field(..., env="SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(..., env="SUPABASE_SERVICE_ROLE_KEY")
    
    # LiveKit Voice Settings
    LIVEKIT_URL: str = Field(..., env="LIVEKIT_URL")
    LIVEKIT_API_KEY: str = Field(..., env="LIVEKIT_API_KEY")
    LIVEKIT_API_SECRET: str = Field(..., env="LIVEKIT_API_SECRET")
    
    # AI Provider Keys
    GROQ_API_KEY: str = Field(default="", env="GROQ_API_KEY")
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    DEEPGRAM_API_KEY: str = Field(default="", env="DEEPGRAM_API_KEY")
    
    # Transactional Email Key
    RESEND_API_KEY: str = Field(default="", env="RESEND_API_KEY")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()