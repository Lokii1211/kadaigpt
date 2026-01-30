#!/bin/bash
# Start script for Railway deployment
exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
