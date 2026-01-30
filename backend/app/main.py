"""
KadaiGPT - Main Application Entry Point
India's First Agentic AI-Powered Retail Intelligence Platform

"Kadai" (கடை) = Shop in Tamil | GPT = Next-Gen AI
Tagline: "கடை சிறியது, கனவுகள் பெரியது" (The shop may be small, but dreams are big)

This backend serves both the API and the React frontend from a single host.
"""

import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database import engine, Base
from app.routers import (
    auth_router,
    products_router,
    bills_router,
    ocr_router,
    print_router
)

settings = get_settings()

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

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "tagline": settings.app_tagline,
        "environment": settings.app_env,
        "features": {
            "voice_commands": settings.enable_voice_commands,
            "multilingual": settings.enable_multilingual,
            "predictive_analytics": settings.enable_predictive_analytics,
            "whatsapp": settings.enable_whatsapp_integration
        }
    }


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
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": str(exc),
            "detail": "An unexpected error occurred"
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
