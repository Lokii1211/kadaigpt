"""
KadaiGPT - Main Application Entry Point
India's First Agentic AI-Powered Retail Intelligence Platform

"Kadai" (கடை) = Shop in Tamil | GPT = Next-Gen AI
Tagline: "கடை சிறியது, கனவுகள் பெரியது" (The shop may be small, but dreams are big)

This backend serves both the API and the React frontend from a single host.
"""

import os
import time
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager

from sqlalchemy import text
from app.config import get_settings
from app.database import engine, Base, check_db_health
from app.routers import (
    auth_router,
    products_router,
    bills_router,
    ocr_router,
    print_router,
    customers_router,
    suppliers_router,
    whatsapp_router,
    dashboard_router,
    analytics_router,
    notifications_router
)
from app.routers.bulk import router as bulk_router
from app.routers.telegram import router as telegram_router
from app.services.scheduler import router as scheduler_router
from app.routers.subscription import router as subscription_router
from app.routers.gst import router as gst_router
from app.routers.credit import router as credit_router
from app.routers.audit import router as audit_router
from app.routers.inapp_notifications import router as inapp_notifications_router
from app.routers.backup import router as backup_router
from app.services.keepalive import keepalive
from app.services.scheduler import scheduler, register_default_tasks
from app.middleware.security import rate_limiter, get_rate_limit_type, RATE_LIMITS, audit_logger
import uuid

settings = get_settings()

# Track server start time for uptime reporting
SERVER_START_TIME = time.time()

# Path to frontend build directory
FRONTEND_BUILD_DIR = Path(__file__).parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events"""
    # Startup
    print("🚀 KadaiGPT Starting up...")
    print("   கடை சிறியது, கனவுகள் பெரியது")
    print("   'The shop may be small, but dreams are big'")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created")
    
    # Start keep-alive service (prevents Render free tier from sleeping)
    await keepalive.start()
    
    # Start task scheduler
    register_default_tasks()
    await scheduler.start()
    print("✅ Scheduler started with", len(scheduler.tasks), "tasks")
    
    # Check if frontend build exists
    if FRONTEND_BUILD_DIR.exists():
        print(f"✅ Frontend build found at {FRONTEND_BUILD_DIR}")
    else:
        print(f"⚠️ Frontend build not found at {FRONTEND_BUILD_DIR}")
        print("   Run 'npm run build' in the frontend directory")
    
    print("🎉 KadaiGPT is ready! Visit http://localhost:8000")
    
    yield
    
    # Shutdown
    print("👋 KadaiGPT shutting down... நன்றி!")
    await keepalive.stop()
    await scheduler.stop()
    await engine.dispose()


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="""
    # 🛒 KadaiGPT - AI-Powered Retail Intelligence for Bharat
    
    **"Kadai" (கடை) = Shop in Tamil | GPT = Next-Gen AI**
    
    ## Features
    - 🗣️ **Multilingual Voice Commands** - Tamil, Hindi, Telugu, English
    - 📸 **AI OCR** - Scan handwritten bills instantly
    - 📊 **Predictive Analytics** - Demand forecasting & smart reordering
    - 💬 **WhatsApp Integration** - Bills, reminders, promotions
    - 🔌 **Offline-First** - Works without internet
    - 🖨️ **Thermal Printing** - ESC/POS compatible
    
    ## National Level Hackathon Project 🏆
    Transforming 12 Million+ Kirana Stores with Agentic AI
    """,
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# ═══════════════════════════════════════════════════════════════════
# CORS — Production-safe origins (NO wildcard "*")
# ═══════════════════════════════════════════════════════════════════
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://kadaigpt.vercel.app",
    "https://kadaigpt.onrender.com",
]

# In development, allow all origins for convenience
if settings.app_env == "development":
    ALLOWED_ORIGINS.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time"],
)


# ═══════════════════════════════════════════════════════════════════
# Security Middleware — Rate Limiting + Headers + Request Timing
# ═══════════════════════════════════════════════════════════════════
@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """Adds rate limiting, security headers, request IDs, and timing."""
    start_time = time.time()
    request_id = str(uuid.uuid4())[:8]
    
    # Rate limiting (skip for health/ping/docs endpoints)
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path
    
    if not path.startswith(("/api/ping", "/api/health", "/api/docs", "/api/redoc", "/api/openapi")):
        limit_type = get_rate_limit_type(path)
        limits = RATE_LIMITS.get(limit_type, RATE_LIMITS['api'])
        allowed, remaining = rate_limiter.check_rate_limit(
            f"{client_ip}:{limit_type}",
            max_requests=limits['max'],
            window_seconds=limits['window']
        )
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": True,
                    "message": "Too many requests. Please slow down.",
                    "retry_after": limits['window']
                },
                headers={"Retry-After": str(limits['window'])}
            )
    
    # Process request
    response = await call_next(request)
    
    # Add security headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{(time.time() - start_time)*1000:.1f}ms"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
    
    # HSTS in production
    if settings.app_env == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response


# API Health check endpoint — production-grade
@app.get("/api/health")
async def health_check():
    """Comprehensive health check with DB pool stats, uptime, and keepalive status."""
    uptime_seconds = time.time() - SERVER_START_TIME
    hours = int(uptime_seconds // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    
    # Detailed DB health check with pool stats
    db_health = await check_db_health()
    
    return {
        "status": "healthy",
        "app": settings.app_name,
        "tagline": settings.app_tagline,
        "version": "2.0.0",
        "environment": settings.app_env,
        "uptime": f"{hours}h {minutes}m",
        "uptime_seconds": int(uptime_seconds),
        "server_started": datetime.fromtimestamp(SERVER_START_TIME).isoformat(),
        "database": db_health,
        "keepalive": keepalive.get_status(),
        "scheduler": {
            "running": scheduler.running,
            "tasks": len(scheduler.tasks)
        },
        "features": {
            "voice_commands": settings.enable_voice_commands,
            "multilingual": settings.enable_multilingual,
            "predictive_analytics": settings.enable_predictive_analytics,
            "whatsapp": settings.enable_whatsapp_integration
        },
        "security": {
            "cors_restricted": settings.app_env == "production",
            "rate_limiting": True,
            "security_headers": True
        }
    }


# Ultra-lightweight ping endpoint for external monitors (UptimeRobot, etc.)
@app.get("/api/ping")
async def ping():
    """Minimal response for uptime monitors. Returns instantly."""
    return {"pong": True, "ts": int(time.time())}


# API Info endpoint
@app.get("/api/info")
async def app_info():
    return {
        "name": "KadaiGPT",
        "tamil_name": "கடைGPT",
        "tagline": "AI-Powered Retail Intelligence for Bharat",
        "tamil_tagline": "கடை சிறியது, கனவுகள் பெரியது",
        "version": "2.0.0",
        "hackathon": "National Level 2026",
        "team": "KadaiGPT Team",
        "features": [
            "Multilingual Voice Commands (Tamil, Hindi, Telugu, English)",
            "AI-Powered OCR for Handwritten Bills",
            "Predictive Demand Forecasting",
            "WhatsApp Business Integration",
            "Offline-First PWA Architecture",
            "GST-Compliant Billing",
            "Customer Loyalty Program",
            "Smart Inventory Management"
        ]
    }


# Include API routers with /api/v1 prefix
app.include_router(auth_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(bills_router, prefix="/api/v1")
app.include_router(ocr_router, prefix="/api/v1")
app.include_router(print_router, prefix="/api/v1")
app.include_router(customers_router, prefix="/api/v1")
app.include_router(suppliers_router, prefix="/api/v1")
app.include_router(whatsapp_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(bulk_router, prefix="/api/v1")
app.include_router(scheduler_router, prefix="/api/v1")
app.include_router(telegram_router, prefix="/api/v1")
app.include_router(subscription_router, prefix="/api/v1")
app.include_router(gst_router, prefix="/api/v1")
app.include_router(credit_router, prefix="/api/v1")
app.include_router(audit_router)  # Already has /api/audit prefix
app.include_router(inapp_notifications_router)  # Already has /api/notifications prefix
app.include_router(backup_router, prefix="/api/v1")  # /api/v1/backup


# Serve static files from frontend build (assets like JS, CSS, images)
if FRONTEND_BUILD_DIR.exists():
    # Serve static assets
    assets_dir = FRONTEND_BUILD_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    # Serve other static files (favicon, etc.)
    app.mount("/static", StaticFiles(directory=str(FRONTEND_BUILD_DIR)), name="static")


# Catch-all route to serve the React app for client-side routing
@app.get("/{full_path:path}")
async def serve_spa(request: Request, full_path: str):
    """
    Serve the React SPA for all non-API routes.
    This enables client-side routing in the React app.
    """
    # If it's an API request that wasn't matched, return 404
    if full_path.startswith("api/"):
        return JSONResponse(
            status_code=404,
            content={"error": True, "message": "API endpoint not found"}
        )
    
    # Check if requesting a specific file
    file_path = FRONTEND_BUILD_DIR / full_path
    if file_path.is_file():
        return FileResponse(file_path)
    
    # For all other routes, serve the React app's index.html
    index_file = FRONTEND_BUILD_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    # If frontend build doesn't exist, show helpful message
    return JSONResponse(
        status_code=200,
        content={
            "app": "KadaiGPT",
            "tamil": "கடைGPT",
            "tagline": "AI-Powered Retail Intelligence for Bharat",
            "message": "Frontend not built. Run 'npm run build' in the frontend directory.",
            "api_docs": "/api/docs",
            "health": "/api/health",
            "info": "/api/info"
        }
    )


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Log the error for debugging (never leak sensitive info in production)
    print(f"[Error] {type(exc).__name__}: {str(exc)}")
    
    # Audit log the error
    client_ip = request.client.host if request.client else "unknown"
    audit_logger.log_event(
        event_type="server_error",
        user_id=None,
        ip_address=client_ip,
        path=str(request.url.path),
        method=request.method,
        status_code=500,
        details={"error": type(exc).__name__}
    )
    
    # Don't expose internal errors in production
    message = str(exc) if settings.app_env == "development" else "An unexpected error occurred"
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": message,
            "detail": "Internal server error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
