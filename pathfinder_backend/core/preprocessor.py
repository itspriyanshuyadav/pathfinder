"""
Image Preprocessor
==================
Handles image resizing, normalisation, and conversion to PyTorch tensors
for model inference.  Also provides Base64 decoding utilities.
"""

import base64
import io
import logging
from typing import Optional

import numpy as np
import torch
from PIL import Image

from config import IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD, DEVICE

logger = logging.getLogger(__name__)


def preprocess_image(pil_image: Image.Image) -> torch.Tensor:
    """
    Convert a PIL Image to a normalised PyTorch tensor ready for model input.

    Steps:
        1. Validate minimum size (≥64px in both dimensions).
        2. Resize to IMAGE_SIZE (512×512).
        3. Convert to float32 [0, 1].
        4. Normalise with ImageNet mean/std.
        5. Transpose to [C, H, W] and add batch dimension → [1, 3, H, W].

    Args:
        pil_image: Input PIL Image in RGB mode.

    Returns:
        Normalised tensor of shape [1, 3, H, W] on the configured device.

    Raises:
        ValueError: If either image dimension is less than 64 pixels.
    """
    w, h = pil_image.size
    if w < 64 or h < 64:
        raise ValueError(
            f"Image too small ({w}×{h}). Minimum supported size is 64×64 pixels."
        )

    # Ensure RGB
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    # Resize to target dimensions
    pil_image = pil_image.resize((IMAGE_SIZE[1], IMAGE_SIZE[0]), Image.BILINEAR)
    logger.debug("Resized image to %s", IMAGE_SIZE)

    # Convert to numpy float32 [0, 1]
    img_array = np.array(pil_image, dtype=np.float32) / 255.0  # shape: (H, W, 3)

    # Normalise per-channel with ImageNet statistics
    mean = np.array(IMAGENET_MEAN, dtype=np.float32)
    std = np.array(IMAGENET_STD, dtype=np.float32)
    img_array = (img_array - mean) / std

    # HWC → CHW, then add batch dimension
    tensor = torch.from_numpy(img_array.transpose(2, 0, 1))  # [3, H, W]
    tensor = tensor.unsqueeze(0)  # [1, 3, H, W]
    tensor = tensor.to(DEVICE)

    logger.debug("Preprocessed tensor shape: %s, device: %s", tensor.shape, tensor.device)
    return tensor


def decode_base64_image(base64_str: str) -> Image.Image:
    """
    Decode a Base64-encoded string into a PIL Image (RGB).

    Handles optional ``data:image/...;base64,`` prefix automatically.

    Args:
        base64_str: Base64-encoded image string.

    Returns:
        PIL Image in RGB mode.

    Raises:
        ValueError: If the string cannot be decoded into a valid image.
    """
    try:
        # Strip optional data-URI prefix
        if "," in base64_str and base64_str.startswith("data:"):
            base64_str = base64_str.split(",", 1)[1]

        image_bytes = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        logger.debug("Decoded Base64 image: size=%s", image.size)
        return image

    except Exception as exc:
        raise ValueError(f"Failed to decode Base64 image: {exc}") from exc
