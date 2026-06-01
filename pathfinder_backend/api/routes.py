"""
API Routes
==========
FastAPI router defining all REST endpoints for the PathFinder backend:
  - POST /api/analyze        — full pipeline (segment → detect → pathfind → visualise)
  - POST /api/segment-only   — segmentation mask and class distribution only
  - GET  /api/health         — health check with model status
"""

import logging
import time
from typing import Any

import numpy as np
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from core.segmentation_runner import get_segmentation_mask
from core.rescue_detector import detect_rescue_points
from core.cost_map import generate_cost_map
from core.pathfinder import astar
from core.visualizer import draw_output
from utils.image_utils import (
    decode_base64_to_pil,
    encode_pil_to_base64,
    numpy_mask_to_colorized_pil,
)
from config import CLASS_LABELS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["PathFinder"])


# ── Request / Response schemas ────────────────────────────────────────────

class ImageRequest(BaseModel):
    """Request body containing a Base64-encoded image."""
    image_base64: str = Field(..., description="Base64-encoded PNG or JPEG image")


class CostMapStats(BaseModel):
    """Statistics about the cost map along the computed path."""
    min_cost: float
    max_cost: float
    avg_path_cost: float


class AnalyzeResponse(BaseModel):
    """Full analysis response including path and annotated images."""
    status: str
    start_point: list[int]
    goal_point: list[int]
    path_length: int
    path_coordinates: list[list[int]]
    result_image_base64: str
    segmentation_mask_base64: str
    cost_map_stats: CostMapStats
    processing_time_ms: float


class SegmentOnlyResponse(BaseModel):
    """Response containing only the segmentation mask and class distribution."""
    status: str
    mask_base64: str
    class_distribution: dict[str, float]


class ManualPathRequest(BaseModel):
    image_base64: str
    start_point: list[int]
    goal_point: list[int]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_loaded: bool


class ErrorResponse(BaseModel):
    """Error response."""
    status: str = "error"
    message: str


# ── Endpoints ─────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request) -> dict[str, Any]:
    """
    Health check endpoint.

    Returns the API status and whether the segmentation model is loaded.
    """
    model = getattr(request.app.state, "model", None)
    return {
        "status": "ok",
        "model_loaded": model is not None,
    }


@router.post("/segment-only", response_model=SegmentOnlyResponse)
async def segment_only(body: ImageRequest, request: Request) -> dict[str, Any]:
    """
    Run segmentation only (no pathfinding).

    Useful for frontend previews and quick analysis.

    Request body:
        ``image_base64`` — Base64-encoded PNG or JPEG.

    Returns:
        Colourised segmentation mask and per-class pixel distribution.
    """
    try:
        model = request.app.state.model

        # Decode image
        pil_image = decode_base64_to_pil(body.image_base64)

        # Run segmentation
        mask = get_segmentation_mask(model, pil_image)

        # Class distribution (percentage of total pixels)
        total_pixels = mask.size
        distribution: dict[str, float] = {}
        for class_idx, label in CLASS_LABELS.items():
            count = int(np.sum(mask == class_idx))
            distribution[label] = round((count / total_pixels) * 100, 2)

        # Colourised mask
        colour_mask = numpy_mask_to_colorized_pil(mask)
        mask_b64 = encode_pil_to_base64(colour_mask)

        return {
            "status": "success",
            "mask_base64": mask_b64,
            "class_distribution": distribution,
        }

    except ValueError as ve:
        logger.error("Validation error in /segment-only: %s", ve)
        return {"status": "error", "message": str(ve)}

    except Exception as exc:
        logger.exception("Unexpected error in /segment-only")
        return {"status": "error", "message": f"Internal error: {exc}"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(body: ImageRequest, request: Request) -> dict[str, Any]:
    """
    Full analysis pipeline.

    Steps:
        1. Decode the input image.
        2. Run segmentation to produce a class mask.
        3. Detect rescue start and goal points.
        4. Generate a traversal cost map.
        5. Run A* pathfinding.
        6. Produce an annotated visualisation.

    Request body:
        ``image_base64`` — Base64-encoded PNG or JPEG.

    Returns:
        Path coordinates, annotated image, segmentation mask,
        cost statistics, and processing time.
    """
    t_start = time.perf_counter()

    try:
        model = request.app.state.model

        # Step 1 — decode
        pil_image = decode_base64_to_pil(body.image_base64)
        logger.info("Received image for analysis: size=%s", pil_image.size)

        # Step 2 — segmentation
        mask = get_segmentation_mask(model, pil_image)

        # Step 3 — rescue points
        points = detect_rescue_points(mask)
        start = points["start"]
        goal = points["goal"]

        # Step 4 — cost map
        cost_map = generate_cost_map(mask)

        # Step 5 — A* pathfinding
        path = astar(cost_map, start, goal)

        if not path:
            logger.warning("A* returned empty path — map may be disconnected")

        # Cost statistics along the path
        if path:
            path_costs = [float(cost_map[r, c]) for r, c in path]
            cost_stats = CostMapStats(
                min_cost=min(path_costs),
                max_cost=max(path_costs),
                avg_path_cost=round(sum(path_costs) / len(path_costs), 2),
            )
        else:
            cost_stats = CostMapStats(
                min_cost=float(cost_map.min()),
                max_cost=float(cost_map.max()),
                avg_path_cost=0.0,
            )

        # Step 6 — visualisation
        result_image = draw_output(pil_image, mask, path, start, goal)
        result_b64 = encode_pil_to_base64(result_image)

        colour_mask = numpy_mask_to_colorized_pil(mask)
        mask_b64 = encode_pil_to_base64(colour_mask)

        t_end = time.perf_counter()
        processing_ms = round((t_end - t_start) * 1000, 2)
        logger.info("Analysis complete in %.2f ms", processing_ms)

        return {
            "status": "success",
            "start_point": list(start),
            "goal_point": list(goal),
            "path_length": len(path),
            "path_coordinates": [list(p) for p in path],
            "result_image_base64": result_b64,
            "segmentation_mask_base64": mask_b64,
            "cost_map_stats": cost_stats,
            "processing_time_ms": processing_ms,
        }

    except ValueError as ve:
        logger.error("Validation error in /analyze: %s", ve)
        return {"status": "error", "message": str(ve)}

    except Exception as exc:
        logger.exception("Unexpected error in /analyze")
        return {"status": "error", "message": f"Internal error: {exc}"}


@router.post("/manual-path", response_model=AnalyzeResponse)
async def manual_path(body: ManualPathRequest, request: Request) -> dict[str, Any]:
    """
    Manual path pipeline. Runs analysis pipeline with manual start and goal points.
    """
    t_start = time.perf_counter()

    try:
        model = request.app.state.model

        # Step 1 — decode
        pil_image = decode_base64_to_pil(body.image_base64)
        logger.info("Received image for manual path analysis: size=%s", pil_image.size)

        # Step 2 — segmentation
        mask = get_segmentation_mask(model, pil_image)

        # Step 3 — manual points (from request body)
        start = tuple(body.start_point)
        goal = tuple(body.goal_point)

        # Step 4 — cost map
        cost_map = generate_cost_map(mask)

        # Step 5 — A* pathfinding
        path = astar(cost_map, start, goal)

        if not path:
            logger.warning("A* returned empty path — map may be disconnected")

        # Cost statistics along the path
        if path:
            path_costs = [float(cost_map[r, c]) for r, c in path]
            cost_stats = CostMapStats(
                min_cost=min(path_costs),
                max_cost=max(path_costs),
                avg_path_cost=round(sum(path_costs) / len(path_costs), 2),
            )
        else:
            cost_stats = CostMapStats(
                min_cost=float(cost_map.min()),
                max_cost=float(cost_map.max()),
                avg_path_cost=0.0,
            )

        # Step 6 — visualisation
        result_image = draw_output(pil_image, mask, path, start, goal)
        result_b64 = encode_pil_to_base64(result_image)

        colour_mask = numpy_mask_to_colorized_pil(mask)
        mask_b64 = encode_pil_to_base64(colour_mask)

        t_end = time.perf_counter()
        processing_ms = round((t_end - t_start) * 1000, 2)
        logger.info("Manual analysis complete in %.2f ms", processing_ms)

        return {
            "status": "success",
            "start_point": list(start),
            "goal_point": list(goal),
            "path_length": len(path),
            "path_coordinates": [list(p) for p in path],
            "result_image_base64": result_b64,
            "segmentation_mask_base64": mask_b64,
            "cost_map_stats": cost_stats,
            "processing_time_ms": processing_ms,
        }

    except ValueError as ve:
        logger.error("Validation error in /manual-path: %s", ve)
        return {"status": "error", "message": str(ve)}

    except Exception as exc:
        logger.exception("Unexpected error in /manual-path")
        return {"status": "error", "message": f"Internal error: {exc}"}
