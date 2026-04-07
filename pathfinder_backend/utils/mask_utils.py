"""
Mask Utilities
==============
Morphological operations and analysis helpers for binary masks,
using OpenCV under the hood.
"""

import logging
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)


def dilate_mask(binary_mask: np.ndarray, kernel_size: int) -> np.ndarray:
    """
    Apply morphological dilation to a binary mask.

    Args:
        binary_mask: 2-D uint8 array (0 or 1 / 0 or 255).
        kernel_size: Size of the square structuring element.

    Returns:
        Dilated binary mask of the same shape and dtype.
    """
    kernel = np.ones((kernel_size, kernel_size), dtype=np.uint8)
    dilated = cv2.dilate(binary_mask, kernel, iterations=1)
    logger.debug(
        "Dilated mask with kernel %dx%d — non-zero before: %d, after: %d",
        kernel_size,
        kernel_size,
        int(np.count_nonzero(binary_mask)),
        int(np.count_nonzero(dilated)),
    )
    return dilated


def get_connected_components(
    binary_mask: np.ndarray,
) -> list[dict[str, int]]:
    """
    Find connected components and their statistics in a binary mask.

    Args:
        binary_mask: 2-D uint8 array.

    Returns:
        List of dicts, one per component (excluding background), each with:
        ``label``, ``left``, ``top``, ``width``, ``height``, ``area``,
        ``centroid_x``, ``centroid_y``.
    """
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        binary_mask, connectivity=8
    )

    components = []
    for i in range(1, num_labels):  # skip background label 0
        cx, cy = centroids[i]
        components.append(
            {
                "label": i,
                "left": int(stats[i, cv2.CC_STAT_LEFT]),
                "top": int(stats[i, cv2.CC_STAT_TOP]),
                "width": int(stats[i, cv2.CC_STAT_WIDTH]),
                "height": int(stats[i, cv2.CC_STAT_HEIGHT]),
                "area": int(stats[i, cv2.CC_STAT_AREA]),
                "centroid_x": int(round(cx)),
                "centroid_y": int(round(cy)),
            }
        )

    logger.debug("Found %d connected components", len(components))
    return components


def get_centroid(binary_mask: np.ndarray) -> Optional[tuple[int, int]]:
    """
    Compute the centroid of the largest connected component.

    Args:
        binary_mask: 2-D uint8 array.

    Returns:
        (row, col) tuple of the centroid, or None if mask is empty.
    """
    components = get_connected_components(binary_mask)
    if not components:
        return None

    largest = max(components, key=lambda c: c["area"])
    # connectedComponentsWithStats returns centroids as (x, y) i.e. (col, row)
    row = largest["centroid_y"]
    col = largest["centroid_x"]

    # Clamp to bounds
    h, w = binary_mask.shape
    row = max(0, min(row, h - 1))
    col = max(0, min(col, w - 1))

    return (row, col)


def distance_from_region(binary_mask: np.ndarray) -> np.ndarray:
    """
    Compute the Euclidean distance of every pixel from the nearest foreground pixel.

    Uses the inverted mask so that distance is measured FROM the region
    (i.e., non-region pixels get their distance to the nearest region pixel).

    Args:
        binary_mask: 2-D uint8 array where foreground = non-zero.

    Returns:
        Float32 array of the same shape with per-pixel distances.
        Pixels inside the region have distance 0.
    """
    # Invert: foreground → background so distanceTransform gives distance
    # from the region boundary outward.
    inverted = (binary_mask == 0).astype(np.uint8)
    dist = cv2.distanceTransform(inverted, cv2.DIST_L2, maskSize=5)
    logger.debug(
        "Distance transform — min: %.1f, max: %.1f",
        float(dist.min()),
        float(dist.max()),
    )
    return dist
