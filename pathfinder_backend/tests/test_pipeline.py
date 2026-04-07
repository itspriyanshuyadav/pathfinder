"""
Pipeline Integration Tests
===========================
End-to-end tests for core PathFinder modules using synthetic data.
No real model loading or network required — all tests use randomly
generated masks and numpy arrays.

Run with:
    pytest tests/test_pipeline.py -v
"""

import numpy as np
import pytest
from PIL import Image

# ── Ensure the parent package is importable ────────────────────────────────
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


from config import COST_MAP, IMAGE_SIZE, NUM_CLASSES
from core.cost_map import generate_cost_map
from core.rescue_detector import detect_rescue_points
from core.pathfinder import astar
from core.visualizer import draw_output


# ── Fixtures ───────────────────────────────────────────────────────────────

@pytest.fixture
def synthetic_mask() -> np.ndarray:
    """
    Create a structured 512×512 mask with all four classes present.

    Layout:
        - Background everywhere
        - Water band in the middle rows
        - Road strip on the left
        - Building cluster in the bottom-left (overlapping water)
    """
    h, w = IMAGE_SIZE
    mask = np.zeros((h, w), dtype=np.uint8)  # all background (0)

    # Water — horizontal band
    mask[int(h * 0.35):int(h * 0.55), :] = 1

    # Road — vertical strip on the left
    mask[:, int(w * 0.08):int(w * 0.15)] = 2

    # Buildings — cluster near the water zone
    mask[int(h * 0.50):int(h * 0.65), int(w * 0.25):int(w * 0.45)] = 3

    return mask


@pytest.fixture
def original_image() -> Image.Image:
    """Create a random 512×512 RGB PIL image."""
    arr = np.random.randint(0, 256, (*IMAGE_SIZE, 3), dtype=np.uint8)
    return Image.fromarray(arr, "RGB")


# ── Test: Cost Map ─────────────────────────────────────────────────────────

class TestCostMap:
    """Tests for core.cost_map.generate_cost_map."""

    def test_shape_matches_mask(self, synthetic_mask: np.ndarray) -> None:
        """Cost map must have the same shape as the input mask."""
        cost = generate_cost_map(synthetic_mask)
        assert cost.shape == synthetic_mask.shape

    def test_dtype_is_float32(self, synthetic_mask: np.ndarray) -> None:
        """Cost map should be float32."""
        cost = generate_cost_map(synthetic_mask)
        assert cost.dtype == np.float32

    def test_values_match_config(self, synthetic_mask: np.ndarray) -> None:
        """Each class index should map to the correct cost value."""
        cost = generate_cost_map(synthetic_mask)
        for class_idx, expected_cost in COST_MAP.items():
            mask_pixels = synthetic_mask == class_idx
            if np.any(mask_pixels):
                assert np.all(cost[mask_pixels] == float(expected_cost)), (
                    f"Class {class_idx} has incorrect cost values"
                )

    def test_no_negative_costs(self, synthetic_mask: np.ndarray) -> None:
        """All cost values must be non-negative."""
        cost = generate_cost_map(synthetic_mask)
        assert np.all(cost >= 0)


# ── Test: Rescue Detector ──────────────────────────────────────────────────

class TestRescueDetector:
    """Tests for core.rescue_detector.detect_rescue_points."""

    def test_returns_start_and_goal(self, synthetic_mask: np.ndarray) -> None:
        """The detector must return both 'start' and 'goal' keys."""
        points = detect_rescue_points(synthetic_mask)
        assert "start" in points
        assert "goal" in points

    def test_points_are_integer_tuples(self, synthetic_mask: np.ndarray) -> None:
        """Start and goal must be (row, col) tuples of integers."""
        points = detect_rescue_points(synthetic_mask)
        for key in ("start", "goal"):
            pt = points[key]
            assert isinstance(pt, tuple), f"{key} should be a tuple"
            assert len(pt) == 2, f"{key} should have 2 elements"
            assert all(isinstance(v, int) for v in pt), f"{key} values should be ints"

    def test_points_within_bounds(self, synthetic_mask: np.ndarray) -> None:
        """Both points must be within the mask dimensions."""
        h, w = synthetic_mask.shape
        points = detect_rescue_points(synthetic_mask)
        for key in ("start", "goal"):
            r, c = points[key]
            assert 0 <= r < h, f"{key} row {r} out of bounds [0, {h})"
            assert 0 <= c < w, f"{key} col {c} out of bounds [0, {w})"

    def test_start_not_equal_goal(self, synthetic_mask: np.ndarray) -> None:
        """Start and goal should normally be different points."""
        points = detect_rescue_points(synthetic_mask)
        # In the structured mask they should differ
        assert points["start"] != points["goal"]


# ── Test: A* Pathfinder ────────────────────────────────────────────────────

class TestAstarPathfinder:
    """Tests for core.pathfinder.astar."""

    def test_returns_non_empty_path(self, synthetic_mask: np.ndarray) -> None:
        """A* should find a non-empty path on a connected cost map."""
        cost = generate_cost_map(synthetic_mask)
        points = detect_rescue_points(synthetic_mask)
        path = astar(cost, points["start"], points["goal"])
        assert len(path) > 0, "Path should not be empty on a connected map"

    def test_path_starts_at_start(self, synthetic_mask: np.ndarray) -> None:
        """The first element of the path should be the start point."""
        cost = generate_cost_map(synthetic_mask)
        points = detect_rescue_points(synthetic_mask)
        path = astar(cost, points["start"], points["goal"])
        if path:
            assert path[0] == points["start"]

    def test_path_ends_at_goal(self, synthetic_mask: np.ndarray) -> None:
        """The last element of the path should be the goal point."""
        cost = generate_cost_map(synthetic_mask)
        points = detect_rescue_points(synthetic_mask)
        path = astar(cost, points["start"], points["goal"])
        if path:
            assert path[-1] == points["goal"]

    def test_all_path_points_within_bounds(self, synthetic_mask: np.ndarray) -> None:
        """Every point in the path must be within the grid bounds."""
        cost = generate_cost_map(synthetic_mask)
        h, w = cost.shape
        points = detect_rescue_points(synthetic_mask)
        path = astar(cost, points["start"], points["goal"])
        for r, c in path:
            assert 0 <= r < h
            assert 0 <= c < w

    def test_trivial_path(self) -> None:
        """If start == goal, path should have exactly one element."""
        cost = np.ones((10, 10), dtype=np.float32)
        path = astar(cost, (5, 5), (5, 5))
        assert path == [(5, 5)]

    def test_empty_path_on_disconnected_map(self) -> None:
        """A* returns empty list when goal is unreachable."""
        cost = np.ones((10, 10), dtype=np.float32)
        # Create a wall of infinite cost
        cost[5, :] = float("inf")
        path = astar(cost, (0, 0), (9, 9))
        assert path == [], "Should return empty path for disconnected map"


# ── Test: Visualizer ──────────────────────────────────────────────────────

class TestVisualizer:
    """Tests for core.visualizer.draw_output."""

    def test_returns_pil_image(
        self, original_image: Image.Image, synthetic_mask: np.ndarray
    ) -> None:
        """draw_output should return a PIL Image."""
        path = [(0, 0), (1, 1), (2, 2)]
        result = draw_output(original_image, synthetic_mask, path, (0, 0), (2, 2))
        assert isinstance(result, Image.Image)

    def test_output_size_matches_mask(
        self, original_image: Image.Image, synthetic_mask: np.ndarray
    ) -> None:
        """Output image dimensions should match the mask dimensions."""
        h, w = synthetic_mask.shape
        path = [(0, 0), (1, 1)]
        result = draw_output(original_image, synthetic_mask, path, (0, 0), (1, 1))
        assert result.size == (w, h)  # PIL size is (width, height)

    def test_handles_empty_path(
        self, original_image: Image.Image, synthetic_mask: np.ndarray
    ) -> None:
        """Visualizer should gracefully handle an empty path."""
        result = draw_output(
            original_image, synthetic_mask, [], (0, 0), (10, 10)
        )
        assert isinstance(result, Image.Image)
