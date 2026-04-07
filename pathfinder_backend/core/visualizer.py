"""
Visualizer
==========
Creates an annotated output image by blending a colour-coded segmentation
overlay with the original image, drawing the A* path, marking start/goal
points, and rendering a colour legend.
"""

import logging
from typing import Optional

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from config import CLASS_COLORS, CLASS_LABELS

logger = logging.getLogger(__name__)


def _create_color_overlay(mask: np.ndarray) -> np.ndarray:
    """
    Convert a class-index mask into an RGB colour overlay.

    Args:
        mask: 2-D array of shape (H, W) with integer class indices.

    Returns:
        3-D uint8 array of shape (H, W, 3) in RGB colour space.
    """
    h, w = mask.shape
    overlay = np.zeros((h, w, 3), dtype=np.uint8)

    for class_idx, colour in CLASS_COLORS.items():
        overlay[mask == class_idx] = colour

    return overlay


def _draw_legend(
    draw: ImageDraw.ImageDraw,
    width: int,
    height: int,
) -> None:
    """
    Draw a colour legend in the bottom-left corner of the image.

    Args:
        draw: PIL ImageDraw object.
        width: Image width.
        height: Image height.
    """
    box_size = 14
    padding = 10
    line_height = 20
    x_start = padding
    y_start = height - padding - (len(CLASS_LABELS) * line_height)

    # Semi-transparent background for the legend area
    legend_w = 140
    legend_h = len(CLASS_LABELS) * line_height + padding
    draw.rectangle(
        [x_start - 4, y_start - 4, x_start + legend_w, y_start + legend_h],
        fill=(0, 0, 0, 160),
    )

    for idx, (class_idx, label) in enumerate(CLASS_LABELS.items()):
        y = y_start + idx * line_height
        colour = CLASS_COLORS.get(class_idx, (200, 200, 200))

        # Colour box
        draw.rectangle(
            [x_start, y, x_start + box_size, y + box_size],
            fill=colour,
            outline=(255, 255, 255),
        )
        # Label text
        draw.text(
            (x_start + box_size + 6, y - 1),
            label.capitalize(),
            fill=(255, 255, 255),
        )


def draw_output(
    original_pil: Image.Image,
    mask: np.ndarray,
    path: list[tuple[int, int]],
    start: tuple[int, int],
    goal: tuple[int, int],
) -> Image.Image:
    """
    Produce a fully annotated output image.

    Steps:
        1. Create a colour overlay from the segmentation mask.
        2. Blend overlay with the original image at 40 % opacity.
        3. Draw the A* path as a bright line.
        4. Mark the start point with a green circle.
        5. Mark the goal point with a red circle.
        6. Render a legend in the bottom-left corner.

    Args:
        original_pil: The original input image (PIL RGB).
        mask: Segmentation mask array (H, W) of class indices.
        path: List of (row, col) tuples forming the optimal path.
        start: (row, col) of the rescue start point.
        goal: (row, col) of the rescue goal point.

    Returns:
        Annotated PIL Image in RGBA mode (can be saved as PNG).
    """
    logger.info("Drawing visualisation overlay")

    # Ensure original is the same size as the mask
    h, w = mask.shape
    original_resized = original_pil.resize((w, h), Image.BILINEAR)
    original_array = np.array(original_resized, dtype=np.uint8)

    # Step 1 — colour overlay
    overlay = _create_color_overlay(mask)

    # Step 2 — alpha blend (40 % overlay, 60 % original)
    blended = cv2.addWeighted(original_array, 0.6, overlay, 0.4, 0)

    # Convert to PIL for drawing
    result = Image.fromarray(blended, "RGB").convert("RGBA")
    draw = ImageDraw.Draw(result)

    # Step 3 — draw path
    if len(path) >= 2:
        for i in range(len(path) - 1):
            r1, c1 = path[i]
            r2, c2 = path[i + 1]
            # Alternate red/yellow for visibility
            colour = (255, 60, 60, 255) if i % 2 == 0 else (255, 220, 50, 255)
            draw.line([(c1, r1), (c2, r2)], fill=colour, width=2)
        logger.info("Drew path with %d segments", len(path) - 1)
    else:
        logger.warning("No path to draw (path length=%d)", len(path))

    # Step 4 — start marker (green filled circle)
    sr, sc = start
    radius = 8
    draw.ellipse(
        [sc - radius, sr - radius, sc + radius, sr + radius],
        fill=(0, 220, 0, 255),
        outline=(255, 255, 255, 255),
        width=2,
    )

    # Step 5 — goal marker (red filled circle)
    gr, gc = goal
    draw.ellipse(
        [gc - radius, gr - radius, gc + radius, gr + radius],
        fill=(220, 0, 0, 255),
        outline=(255, 255, 255, 255),
        width=2,
    )

    # Step 6 — legend
    _draw_legend(draw, w, h)

    logger.info("Visualisation complete — output size: %s", result.size)
    return result
