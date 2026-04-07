"""
Image Utilities
===============
Helper functions for Base64 encoding/decoding of PIL Images
and converting numpy masks to colourised PIL Images.
"""

import base64
import io
import logging

import numpy as np
from PIL import Image

from config import CLASS_COLORS

logger = logging.getLogger(__name__)


def encode_pil_to_base64(pil_image: Image.Image, fmt: str = "PNG") -> str:
    """
    Encode a PIL Image to a Base64 string.

    Args:
        pil_image: PIL Image to encode.
        fmt: Image format — 'PNG' or 'JPEG'.

    Returns:
        Base64-encoded string (no data-URI prefix).
    """
    buffer = io.BytesIO()
    # Convert RGBA → RGB if saving as JPEG
    if fmt.upper() == "JPEG" and pil_image.mode == "RGBA":
        pil_image = pil_image.convert("RGB")
    pil_image.save(buffer, format=fmt)
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    logger.debug("Encoded PIL image to Base64 (%s, %d chars)", fmt, len(encoded))
    return encoded


def decode_base64_to_pil(base64_str: str) -> Image.Image:
    """
    Decode a Base64 string into a PIL Image (RGB).

    Handles optional ``data:image/...;base64,`` prefix.

    Args:
        base64_str: Base64-encoded image string.

    Returns:
        PIL Image in RGB mode.

    Raises:
        ValueError: If the string cannot be decoded.
    """
    try:
        if "," in base64_str and base64_str.startswith("data:"):
            base64_str = base64_str.split(",", 1)[1]

        image_bytes = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        logger.debug("Decoded Base64 to PIL image: size=%s", image.size)
        return image
    except Exception as exc:
        raise ValueError(f"Failed to decode Base64 image: {exc}") from exc


def numpy_mask_to_colorized_pil(mask: np.ndarray) -> Image.Image:
    """
    Convert a class-index numpy mask to a colourised RGB PIL Image.

    Each class index is mapped to its colour from ``CLASS_COLORS``.

    Args:
        mask: 2-D numpy array (H, W) of integer class indices.

    Returns:
        PIL Image (RGB) with each pixel coloured by its class.
    """
    h, w = mask.shape
    colour_img = np.zeros((h, w, 3), dtype=np.uint8)

    for class_idx, colour in CLASS_COLORS.items():
        colour_img[mask == class_idx] = colour

    pil_img = Image.fromarray(colour_img, "RGB")
    logger.debug("Colourised mask to PIL image: size=%s", pil_img.size)
    return pil_img
