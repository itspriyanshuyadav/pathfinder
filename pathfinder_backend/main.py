"""
PathFinder Backend — Main Application
======================================
FastAPI entry point for the GuardianFlow API.

- Loads the segmentation model once at startup via lifespan events.
- Registers all API routes.
- Configures CORS for frontend development.
- Provides global exception handlers.

Run with:
    uvicorn main:app --reload
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import router as api_router
from config import API_HOST, API_PORT, DEVICE, ENCODER, MODEL_PATH, NUM_CLASSES
from models.segmentation import load_model

# ── Logging configuration ─────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("pathfinder")


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    On startup:
        - Ensure the checkpoints directory exists.
        - Load the segmentation model (or mock fallback) once.
        - Attach it to ``app.state.model`` for use by all routes.

    On shutdown:
        - Clean up resources (currently a no-op).
    """
    logger.info("Starting PathFinder backend on device=%s", DEVICE)

    # Ensure checkpoints directory exists (for future model placement)
    checkpoint_dir = Path(MODEL_PATH).parent
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    # Load model once
    model = load_model(
        path=MODEL_PATH,
        num_classes=NUM_CLASSES,
        encoder_name=ENCODER,
        device=DEVICE,
    )
    app.state.model = model
    logger.info("Model loaded and attached to app.state")

    yield  # Application is running

    # Shutdown
    logger.info("Shutting down PathFinder backend")


# ── FastAPI app ────────────────────────────────────────────────────────────

app = FastAPI(
    title="GuardianFlow API",
    version="1.0.0",
    description=(
        "AI-Driven Disaster Response and Automatic Rescue Pathfinding System. "
        "Upload satellite or drone imagery and receive segmented maps, "
        "rescue target detection, and optimal A* rescue paths."
    ),
    lifespan=lifespan,
)

# ── CORS middleware ────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Allow all origins for frontend dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routes ────────────────────────────────────────────────────────

app.include_router(api_router)


# ── Exception handlers ────────────────────────────────────────────────────

@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle 422 Unprocessable Entity errors with a clean JSON response."""
    logger.warning("Validation error on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": f"Validation error: {exc}",
        },
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected 500 errors with a clean JSON response."""
    logger.exception("Internal server error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An unexpected internal error occurred.",
        },
    )


# ── Root endpoint ──────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    """Root endpoint with basic API information."""
    return {
        "name": "GuardianFlow API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


# ── Entry point ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
        log_level="info",
    )
