"""
KadaiGPT - Configuration Settings
India's First Agentic AI-Powered Retail Intelligence Platform
"Kadai" (கடை) = Shop in Tamil | GPT = Next-Gen AI
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App Settings
    app_name: str = "KadaiGPT"
    app_tagline: str = "AI-Powered Retail Intelligence for Bharat"
    app_env: str = "development"
    debug: bool = False
    secret_key: str = "kadaigpt-super-secret-key-change-in-production-2026"
    
    # Database - Railway provides DATABASE_URL for PostgreSQL
    # We need to convert postgres:// to postgresql+asyncpg:// for async support
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
    
    # Evolution API (WhatsApp Bot) Settings
    EVOLUTION_API_URL: Optional[str] = None  # e.g., https://your-evolution.railway.app
    EVOLUTION_API_KEY: Optional[str] = None  # Your API key
    EVOLUTION_INSTANCE_NAME: str = "kadaigpt"  # Instance name
    WHATSAPP_VERIFY_TOKEN: str = "kadaigpt_verify_token"  # For Meta API verification
    
    # Telegram Bot Settings (Easy & Reliable!)
    TELEGRAM_BOT_TOKEN: Optional[str] = None  # Get from @BotFather
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    def get_async_database_url(self) -> str:
        """
        Convert database URL to async-compatible format.
        Railway provides postgres:// but we need postgresql+asyncpg://
        """
        url = self.database_url
        
        # Check for Railway's DATABASE_URL environment variable
        railway_url = os.environ.get("DATABASE_URL")
        if railway_url:
            url = railway_url
        
        # Convert postgres:// to postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        return url


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()

