"""
Segmentation Model Loader
=========================
Handles loading the U-Net segmentation model from segmentation_models_pytorch,
running inference, and providing a mock model fallback when no checkpoint exists.
"""

import logging
from pathlib import Path
from typing import Union

import numpy as np
import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


class MockSegmentationModel(nn.Module):
    """
    A mock segmentation model that produces structured random masks.

    Used when no real trained checkpoint is available, enabling full
    frontend development and pipeline testing without trained weights.
    The mock generates a semi-realistic mask with distinct regions for
    water, roads, buildings, and background.
    """

    def __init__(self, num_classes: int = 4) -> None:
        super().__init__()
        self.num_classes = num_classes
        logger.warning(
            "Using MockSegmentationModel — predictions are synthetic. "
            "Replace with a real checkpoint for production use."
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Generate a structured mock segmentation output.

        Args:
            x: Input tensor of shape [B, 3, H, W].

        Returns:
            Logits tensor of shape [B, num_classes, H, W] with synthetic
            class activations that produce a plausible-looking mask.
        """
        batch_size, _, h, w = x.shape
        logits = torch.zeros(batch_size, self.num_classes, h, w, device=x.device)

        # Create structured regions instead of pure noise
        # Background everywhere as a base
        logits[:, 0, :, :] = 1.0

        # Water — horizontal band in the middle (simulating a river/flood)
        water_start = int(h * 0.35)
        water_end = int(h * 0.55)
        logits[:, 1, water_start:water_end, :] = 5.0

        # Road — vertical strip on the left side
        road_left = int(w * 0.1)
        road_right = int(w * 0.18)
        logits[:, 2, :, road_left:road_right] = 5.0

        # Road — horizontal strip at the top
        logits[:, 2, int(h * 0.05):int(h * 0.12), :] = 5.0

        # Buildings — scattered clusters
        # Cluster 1: top-right
        logits[:, 3, int(h * 0.15):int(h * 0.30), int(w * 0.60):int(w * 0.80)] = 5.0
        # Cluster 2: bottom-left (near water — will be a rescue target)
        logits[:, 3, int(h * 0.50):int(h * 0.65), int(w * 0.25):int(w * 0.45)] = 5.0
        # Cluster 3: bottom-right
        logits[:, 3, int(h * 0.70):int(h * 0.85), int(w * 0.65):int(w * 0.85)] = 5.0

        # Add slight noise for realism
        noise = torch.randn_like(logits) * 0.3
        logits = logits + noise

        return logits


def load_model(
    path: Union[str, Path],
    num_classes: int = 4,
    encoder_name: str = "resnet34",
    device: str = "cpu",
) -> nn.Module:
    """
    Load a U-Net segmentation model from a checkpoint file.

    If the checkpoint file does not exist, falls back to MockSegmentationModel
    so the pipeline remains functional for development and testing.

    Args:
        path: Path to the .pth checkpoint file.
        num_classes: Number of segmentation classes.
        encoder_name: Encoder backbone name for smp.Unet.
        device: Target device ('cpu' or 'cuda').

    Returns:
        A PyTorch model in eval mode, moved to the specified device.
    """
    checkpoint_path = Path(path)

    if checkpoint_path.exists():
        try:
            import segmentation_models_pytorch as smp

            model = smp.Unet(
                encoder_name=encoder_name,
                encoder_weights=None,  # we load our own weights
                in_channels=3,
                classes=num_classes,
            )
            state_dict = torch.load(
                checkpoint_path, map_location=device, weights_only=True
            )
            model.load_state_dict(state_dict)
            model = model.to(device).eval()
            logger.info("Loaded trained model from %s", checkpoint_path)
            return model

        except Exception as e:
            logger.error(
                "Failed to load checkpoint from %s: %s. Falling back to mock model.",
                checkpoint_path,
                e,
            )

    logger.info(
        "Checkpoint not found at %s — initialising MockSegmentationModel.", checkpoint_path
    )
    mock = MockSegmentationModel(num_classes=num_classes)
    return mock.to(device).eval()


def run_inference(model: nn.Module, tensor: torch.Tensor) -> torch.Tensor:
    """
    Run forward pass on the segmentation model.

    Args:
        model: A loaded segmentation model (real or mock).
        tensor: Preprocessed input tensor of shape [1, 3, H, W].

    Returns:
        Raw logits tensor of shape [1, num_classes, H, W].
    """
    with torch.no_grad():
        logits = model(tensor)
    return logits
