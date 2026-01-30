"""
KadaiGPT - Configuration Settings
India's First Agentic AI-Powered Retail Intelligence Platform
"Kadai" (கடை) = Shop in Tamil | GPT = Next-Gen AI
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App Settings
    app_name: str = "KadaiGPT"
    app_tagline: str = "AI-Powered Retail Intelligence for Bharat"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "kadaigpt-super-secret-key-change-in-production-2026"
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./kadaigpt.db"
    
    # JWT Settings
    jwt_secret_key: str = "kadaigpt-jwt-secret-key-2026"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # Google AI (Gemini) for OCR & Predictions
    google_api_key: Optional[str] = None
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Printer Settings
    default_printer_name: str = "auto"
    silent_print_enabled: bool = True
    printer_width: int = 32
    printer_type: str = "thermal"
    
    # File Storage
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10
    
    # API Settings
    api_v1_prefix: str = "/api/v1"
    
    # Feature Flags
    enable_voice_commands: bool = True
    enable_multilingual: bool = True
    enable_predictive_analytics: bool = True
    enable_whatsapp_integration: bool = True
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
