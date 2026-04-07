"""
Cost Map Generator
==================
Translates a segmentation mask into a 2-D traversal cost grid
using the class-to-cost mapping defined in config.py.
"""

import logging

import numpy as np

from config import COST_MAP

logger = logging.getLogger(__name__)


def generate_cost_map(mask: np.ndarray) -> np.ndarray:
    """
    Convert a class-index segmentation mask into a float32 cost map.

    Each pixel's class label is replaced by its traversal cost from
    the ``COST_MAP`` dictionary (lower cost → easier traversal).

    Args:
        mask: 2-D numpy array of shape (H, W) with integer class indices.

    Returns:
        2-D numpy float32 array of the same shape containing per-pixel
        traversal costs.
    """
    logger.info("Generating cost map from mask of shape %s", mask.shape)

    cost_map = np.zeros(mask.shape, dtype=np.float32)

    for class_idx, cost_value in COST_MAP.items():
        cost_map[mask == class_idx] = float(cost_value)

    # Safety: any pixels with unknown class get a high default cost
    unknown = ~np.isin(mask, list(COST_MAP.keys()))
    if np.any(unknown):
        logger.warning(
            "Found %d pixels with unknown class labels — assigning cost 999.",
            int(np.sum(unknown)),
        )
        cost_map[unknown] = 999.0

    logger.info(
        "Cost map stats — min: %.1f, max: %.1f, mean: %.1f",
        float(cost_map.min()),
        float(cost_map.max()),
        float(cost_map.mean()),
    )

    return cost_map
