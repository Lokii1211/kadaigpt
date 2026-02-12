"""
KadaiGPT - Configuration Settings
India's First Agentic AI-Powered Retail Intelligence Platform
"Kadai" (கடை) = Shop in Tamil | GPT = Next-Gen AI

Supports deployment on Vercel (serverless) with Neon PostgreSQL.
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
    
    # Database
    # Vercel + Neon: Use DATABASE_URL env var (postgresql+asyncpg://)
    # Local dev: Falls back to SQLite
    database_url: str = "sqlite+aiosqlite:///./kadaigpt.db"
    
    # JWT Settings
    jwt_secret_key: str = "kadaigpt-jwt-secret-key-2026"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # Google AI (Gemini) for OCR & Predictions
    google_api_key: Optional[str] = None
    
    # Redis (optional - gracefully degrades without it)
    redis_url: str = "redis://localhost:6379/0"
    
    # Printer Settings
    default_printer_name: str = "auto"
    silent_print_enabled: bool = True
    printer_width: int = 32
    printer_type: str = "thermal"
    
    # File Storage
    upload_dir: str = "/tmp/uploads"  # Vercel uses /tmp for writable storage
    max_upload_size_mb: int = 10
    
    # API Settings
    api_v1_prefix: str = "/api/v1"
    
    # Feature Flags
    enable_voice_commands: bool = True
    enable_multilingual: bool = True
    enable_predictive_analytics: bool = True
    enable_whatsapp_integration: bool = True
    
    # Evolution API (WhatsApp Bot) Settings
    EVOLUTION_API_URL: Optional[str] = None
    EVOLUTION_API_KEY: Optional[str] = None
    EVOLUTION_INSTANCE_NAME: str = "kadaigpt"
    WHATSAPP_VERIFY_TOKEN: str = "kadaigpt_verify_token"
    
    # Telegram Bot Settings
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    
    # Encryption
    ENCRYPTION_KEY: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    def get_async_database_url(self) -> str:
        """
        Convert database URL to async-compatible format.
        
        Supports:
        - Neon PostgreSQL (Vercel): postgres:// or postgresql://
        - Railway PostgreSQL: postgres://
        - Local SQLite: sqlite+aiosqlite://
        """
        url = self.database_url
        
        # Check for DATABASE_URL environment variable (Vercel/Railway/Neon)
        env_url = os.environ.get("DATABASE_URL")
        if env_url:
            url = env_url
        
        # Also check POSTGRES_URL (Vercel Postgres integration)
        if not env_url:
            vercel_url = os.environ.get("POSTGRES_URL")
            if vercel_url:
                url = vercel_url
        
        # Convert postgres:// to postgresql+asyncpg://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        # Neon requires SSL - add sslmode if not present
        if "neon.tech" in url and "sslmode" not in url:
            separator = "&" if "?" in url else "?"
            url = f"{url}{separator}sslmode=require"
        
        return url


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
