#!/usr/bin/env python3
"""
Simple script to run the FastAPI application
"""
import os
from dotenv import load_dotenv

# CRITICAL: Load environment variables BEFORE importing anything else
load_dotenv()

# Now import the app AFTER loading env variables
import uvicorn

if __name__ == "__main__":
    # Get port from environment or default to 8000
    port = int(os.getenv("PORT", 8000))
    
    print(f"Starting OneAI Backend API on port {port}")
    print("API Documentation will be available at:")
    print(f"  - Swagger UI: http://localhost:{port}/docs")
    print(f"  - ReDoc: http://localhost:{port}/redoc")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    ) 