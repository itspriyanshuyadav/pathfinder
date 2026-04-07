"""
A* Pathfinder
=============
Custom implementation of the A* search algorithm with:
- 8-directional movement (including diagonals)
- Euclidean distance heuristic
- heapq-based open set for efficiency
- Path reconstruction via parent dictionary
"""

import heapq
import logging
import math
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# 8-directional neighbours: (delta_row, delta_col)
_DIRECTIONS = [
    (-1, -1), (-1, 0), (-1, 1),
    (0, -1),           (0, 1),
    (1, -1),  (1, 0),  (1, 1),
]

_SQRT2 = math.sqrt(2)


def _heuristic(a: tuple[int, int], b: tuple[int, int]) -> float:
    """
    Euclidean distance heuristic between two (row, col) points.

    Args:
        a: Current node (row, col).
        b: Goal node (row, col).

    Returns:
        Euclidean distance as a float.
    """
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def astar(
    cost_map: np.ndarray,
    start: tuple[int, int],
    goal: tuple[int, int],
) -> list[tuple[int, int]]:
    """
    Find the optimal path from start to goal on a cost map using A*.

    Movement is 8-directional.  Diagonal moves incur an additional
    √2 multiplier on the traversal cost.

    Args:
        cost_map: 2-D float32 array where each cell is the traversal cost.
        start: Starting position as (row, col).
        goal: Goal position as (row, col).

    Returns:
        Ordered list of (row, col) tuples from start to goal (inclusive).
        Returns an empty list if no path exists.
    """
    rows, cols = cost_map.shape
    logger.info(
        "A* search — start=%s, goal=%s, grid=%dx%d", start, goal, rows, cols
    )

    # Validate bounds
    if not (0 <= start[0] < rows and 0 <= start[1] < cols):
        logger.error("Start %s is out of bounds.", start)
        return []
    if not (0 <= goal[0] < rows and 0 <= goal[1] < cols):
        logger.error("Goal %s is out of bounds.", goal)
        return []

    # Trivial case
    if start == goal:
        return [start]

    # Priority queue entries: (f_score, counter, (row, col))
    # counter breaks ties deterministically
    counter = 0
    open_set: list[tuple[float, int, tuple[int, int]]] = []
    heapq.heappush(open_set, (0.0 + _heuristic(start, goal), counter, start))

    # g_score: best known cost from start to each node
    g_score: dict[tuple[int, int], float] = {start: 0.0}

    # Parent map for path reconstruction
    parent: dict[tuple[int, int], tuple[int, int]] = {}

    # Closed set
    closed: set[tuple[int, int]] = set()

    while open_set:
        f_current, _, current = heapq.heappop(open_set)

        if current == goal:
            # Reconstruct path
            path = _reconstruct_path(parent, start, goal)
            logger.info(
                "Path found — %d steps, total cost=%.1f",
                len(path),
                g_score[goal],
            )
            return path

        if current in closed:
            continue
        closed.add(current)

        r, c = current
        for dr, dc in _DIRECTIONS:
            nr, nc = r + dr, c + dc

            # Bounds check
            if nr < 0 or nr >= rows or nc < 0 or nc >= cols:
                continue

            neighbour = (nr, nc)
            if neighbour in closed:
                continue

            # Movement cost: diagonal costs extra √2
            is_diagonal = abs(dr) + abs(dc) == 2
            move_cost = float(cost_map[nr, nc]) * (_SQRT2 if is_diagonal else 1.0)

            tentative_g = g_score[current] + move_cost

            if tentative_g < g_score.get(neighbour, float("inf")):
                g_score[neighbour] = tentative_g
                f_score = tentative_g + _heuristic(neighbour, goal)
                parent[neighbour] = current
                counter += 1
                heapq.heappush(open_set, (f_score, counter, neighbour))

    logger.warning("A* could not find a path from %s to %s.", start, goal)
    return []


def _reconstruct_path(
    parent: dict[tuple[int, int], tuple[int, int]],
    start: tuple[int, int],
    goal: tuple[int, int],
) -> list[tuple[int, int]]:
    """
    Walk backwards through the parent dictionary to reconstruct the path.

    Args:
        parent: Mapping from each node to its predecessor.
        start: Starting node.
        goal: Goal node.

    Returns:
        Ordered list of (row, col) from start to goal.
    """
    path = [goal]
    current = goal
    while current != start:
        current = parent[current]
        path.append(current)
    path.reverse()
    return path
