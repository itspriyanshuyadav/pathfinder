"""
Rescue Detector
===============
Automatically detects optimal rescue START and GOAL coordinates from
a segmentation mask using morphological analysis and distance transforms.

Goal (rescue target):
    Buildings near or overlapping with flood water.

Start (rescue base):
    Road pixel farthest from any water region.
"""

import logging
from typing import Optional

import cv2
import numpy as np

from config import WATER_DILATION_KERNEL, SAFE_DISTANCE_THRESHOLD, IMAGE_SIZE

logger = logging.getLogger(__name__)


def _largest_component_centroid(binary_mask: np.ndarray) -> Optional[tuple[int, int]]:
    """
    Find the centroid of the largest connected component in a binary mask.

    Args:
        binary_mask: 2-D uint8 array with non-zero pixels as foreground.

    Returns:
        (row, col) of the centroid, or None if no component found.
    """
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        binary_mask, connectivity=8
    )

    if num_labels <= 1:
        # Only background label (0)
        return None

    # Label 0 is background; find the largest non-background component
    # stats columns: [left, top, width, height, area]
    areas = stats[1:, cv2.CC_STAT_AREA]
    largest_idx = int(np.argmax(areas)) + 1  # offset by 1 for background

    cy, cx = centroids[largest_idx]  # connectedComponents returns (x, y)
    row, col = int(round(cx)), int(round(cy))

    # Clamp to mask bounds
    row = max(0, min(row, binary_mask.shape[0] - 1))
    col = max(0, min(col, binary_mask.shape[1] - 1))

    return (row, col)


def _detect_goal(mask: np.ndarray) -> tuple[int, int]:
    """
    Detect the rescue GOAL — the building area most affected by flooding.

    Strategy:
        1. Dilate the water mask to simulate the flood extent.
        2. Find overlap between dilated water and buildings.
        3. Return centroid of the largest overlap component.
        4. Fallback → centroid of the largest building cluster.
        5. Final fallback → image centre.

    Args:
        mask: Segmentation mask (H, W) with class indices.

    Returns:
        (row, col) tuple for the goal point.
    """
    h, w = mask.shape
    building_mask = (mask == 3).astype(np.uint8)
    water_mask = (mask == 1).astype(np.uint8)

    # Dilate water to approximate flood reach
    kernel = np.ones(
        (WATER_DILATION_KERNEL, WATER_DILATION_KERNEL), dtype=np.uint8
    )
    dilated_water = cv2.dilate(water_mask, kernel, iterations=1)

    # Overlap: buildings within the flood zone
    overlap = cv2.bitwise_and(building_mask, dilated_water)

    if np.any(overlap):
        centroid = _largest_component_centroid(overlap)
        if centroid is not None:
            logger.info("Goal detected from building-water overlap at %s", centroid)
            return centroid

    # Fallback: largest building cluster
    if np.any(building_mask):
        centroid = _largest_component_centroid(building_mask)
        if centroid is not None:
            logger.info("Goal fallback: largest building cluster at %s", centroid)
            return centroid

    # Final fallback: image centre
    centre = (h // 2, w // 2)
    logger.warning("No buildings found — goal defaulting to image centre %s", centre)
    return centre


def _detect_start(mask: np.ndarray) -> tuple[int, int]:
    """
    Detect the rescue START — the safest road point farthest from water.

    Strategy:
        1. Compute distance transform from the inverted water mask.
        2. Mask out non-road pixels.
        3. Select the road pixel with the maximum distance from water.
        4. Fallback → centroid of the largest non-water contiguous region.
        5. Final fallback → top-left corner (0, 0).

    Args:
        mask: Segmentation mask (H, W) with class indices.

    Returns:
        (row, col) tuple for the start point.
    """
    h, w = mask.shape
    road_mask = (mask == 2).astype(np.uint8)
    water_mask = (mask == 1).astype(np.uint8)

    # Distance from water: invert water so non-water pixels get distances
    inverted_water = 1 - water_mask  # foreground = everything that is NOT water
    dist_from_water = cv2.distanceTransform(
        inverted_water, cv2.DIST_L2, maskSize=5
    )

    # Restrict to road pixels only
    road_distances = dist_from_water * road_mask.astype(np.float32)

    if np.any(road_distances > 0):
        # Pick the road pixel farthest from water
        max_loc = np.unravel_index(np.argmax(road_distances), road_distances.shape)
        start = (int(max_loc[0]), int(max_loc[1]))
        logger.info(
            "Start detected: road pixel farthest from water at %s (dist=%.1f)",
            start,
            road_distances[start[0], start[1]],
        )
        return start

    # Fallback: centroid of the largest non-water region
    non_water = (mask != 1).astype(np.uint8)
    if np.any(non_water):
        centroid = _largest_component_centroid(non_water)
        if centroid is not None:
            logger.info("Start fallback: largest non-water region at %s", centroid)
            return centroid

    # Final fallback
    fallback = (0, 0)
    logger.warning("No suitable start found — defaulting to %s", fallback)
    return fallback


def detect_rescue_points(mask: np.ndarray) -> dict[str, tuple[int, int]]:
    """
    Automatically detect rescue START and GOAL points from a segmentation mask.

    Args:
        mask: 2-D numpy array of shape (H, W) with integer class indices:
              0=background, 1=water, 2=road, 3=building.

    Returns:
        Dictionary with keys ``"start"`` and ``"goal"``, each mapping to
        a ``(row, col)`` integer tuple within the mask bounds.
    """
    logger.info("Detecting rescue points from mask of shape %s", mask.shape)

    goal = _detect_goal(mask)
    start = _detect_start(mask)

    logger.info("Rescue points — START: %s, GOAL: %s", start, goal)
    return {"start": start, "goal": goal}
