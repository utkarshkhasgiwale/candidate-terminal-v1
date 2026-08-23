from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.routes.chat_routes import router as chat_router


# ============================================================
# FastAPI application
# ============================================================

app = FastAPI(
    title="Candidate Terminal API"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Register API routes
# ============================================================

app.include_router(chat_router)


# ============================================================
# Project paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

RESUME_PDF_PATH = (
    PROJECT_ROOT
    / "ai_core"
    / "data"
    / "source-docs"
    / "resume.pdf"
)


# ============================================================
# Root endpoint
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Candidate Terminal API is running"
    }


# ============================================================
# Resume PDF endpoint
# ============================================================

@app.get("/resume.pdf")
def get_resume():
    if not RESUME_PDF_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Resume PDF not found at: {RESUME_PDF_PATH}"
        )

    return FileResponse(
        path=RESUME_PDF_PATH,
        media_type="application/pdf",
        filename="Utkarsh_Khasgiwale_Resume.pdf",
    )