from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from routes import user_routes, token_routes, report_routes
import uvicorn

# Create FastAPI app
app = FastAPI(
    title="OneAI Backend API",
    description="FastAPI backend for OneAI with Supabase integration",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_routes.router)
app.include_router(token_routes.router)
app.include_router(report_routes.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "OneAI Backend API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 