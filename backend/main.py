"""
CursorPM backend entrypoint.

Run locally with:
    uvicorn main:app --reload
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.exceptions import CursorPMError
from app.core.logging import configure_logging, get_logger
from app.routers import analyze, export

configure_logging()
logger = get_logger(__name__)
settings = get_settings()

app = FastAPI(
    title="CursorPM API",
    description="AI Product Manager Copilot - analyzes customer feedback into prioritized engineering work.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(CursorPMError)
async def cursorpm_error_handler(request: Request, exc: CursorPMError) -> JSONResponse:
    logger.error("Unhandled CursorPMError on %s: %s", request.url.path, exc.message)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred."})


@app.get("/health", tags=["meta"])
async def health_check() -> dict:
    return {
        "status": "ok",
        "groq_configured": bool(settings.groq_api_key),
        "model": settings.groq_model,
    }


app.include_router(analyze.router)
app.include_router(export.router)
