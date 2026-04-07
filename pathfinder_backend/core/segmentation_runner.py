"""
Segmentation Runner
===================
Orchestrates the full segmentation pipeline: preprocess → infer → argmax.
Returns a 2-D numpy array of integer class indices.
"""

import logging

import numpy as np
import torch
import torch.nn as nn
from PIL import Image

from core.preprocessor import preprocess_image
from models.segmentation import run_inference

logger = logging.getLogger(__name__)


def get_segmentation_mask(model: nn.Module, pil_image: Image.Image) -> np.ndarray:
    """
    Run the full segmentation pipeline on a single image.

    Steps:
        1. Preprocess the PIL image into a normalised tensor.
        2. Run model inference to obtain raw logits.
        3. Apply argmax across the class dimension.
        4. Squeeze to a 2-D array of shape (H, W).

    Args:
        model: Loaded segmentation model (real or mock), in eval mode.
        pil_image: Input PIL Image in RGB mode.

    Returns:
        np.ndarray of shape (H, W) with integer class indices (0–3).
    """
    logger.info("Starting segmentation pipeline")

    # Step 1 — preprocess
    tensor = preprocess_image(pil_image)
    logger.debug("Input tensor shape: %s", tensor.shape)

    # Step 2 — inference
    logits: torch.Tensor = run_inference(model, tensor)
    logger.debug("Logits shape: %s", logits.shape)

    # Step 3 — argmax over class dimension (dim=1)
    predicted = torch.argmax(logits, dim=1)  # [1, H, W]

    # Step 4 — squeeze to 2-D numpy
    mask = predicted.squeeze(0).cpu().numpy().astype(np.uint8)  # (H, W)
    logger.info(
        "Segmentation complete — mask shape: %s, unique classes: %s",
        mask.shape,
        np.unique(mask).tolist(),
    )

    return mask
