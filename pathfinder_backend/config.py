"""
PathFinder Configuration
========================
Central configuration file containing all constants, model paths,
class definitions, and cost mappings used throughout the backend.
"""

import torch
from pathlib import Path

# ---------------------------------------------------------------------------
# Image settings
# ---------------------------------------------------------------------------
IMAGE_SIZE: tuple[int, int] = (512, 512)  # (height, width) for model input

# ---------------------------------------------------------------------------
# Segmentation class definitions
# ---------------------------------------------------------------------------
NUM_CLASSES: int = 4

CLASS_LABELS: dict[int, str] = {
    0: "background",
    1: "water",
    2: "road",
    3: "building",
}

# Traversal cost per class — lower means easier to cross
COST_MAP: dict[int, int] = {
    0: 50,   # background  — moderate difficulty
    1: 100,  # water       — very hard / dangerous
    2: 1,    # road        — easiest
    3: 10,   # building    — some difficulty
}

# ---------------------------------------------------------------------------
# Colour palette for mask visualisation (BGR → converted to RGB where needed)
# ---------------------------------------------------------------------------
CLASS_COLORS: dict[int, tuple[int, int, int]] = {
    0: (34, 139, 34),    # background — forest green
    1: (0, 100, 255),    # water      — blue
    2: (150, 150, 150),  # road       — gray
    3: (255, 165, 0),    # building   — orange
}

# ---------------------------------------------------------------------------
# Rescue detector parameters
# ---------------------------------------------------------------------------
WATER_DILATION_KERNEL: int = 15  # kernel size (px) to expand flood zones
SAFE_DISTANCE_THRESHOLD: float = 30.0  # min pixel distance from water for safe start

# ---------------------------------------------------------------------------
# Model / encoder settings
# ---------------------------------------------------------------------------
MODEL_PATH: Path = Path("checkpoints/unet_resnet34.pth")
ENCODER: str = "resnet34"
ENCODER_WEIGHTS: str = "imagenet"  # used only when downloading fresh weights

# ---------------------------------------------------------------------------
# Device selection
# ---------------------------------------------------------------------------
DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"

# ---------------------------------------------------------------------------
# Normalisation values (ImageNet statistics)
# ---------------------------------------------------------------------------
IMAGENET_MEAN: list[float] = [0.485, 0.456, 0.406]
IMAGENET_STD: list[float] = [0.229, 0.224, 0.225]

# ---------------------------------------------------------------------------
# API settings
# ---------------------------------------------------------------------------
API_HOST: str = "0.0.0.0"
API_PORT: int = 8000
