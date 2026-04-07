# PathFinder Backend

**AI-Driven Disaster Response and Automatic Rescue Pathfinding System**

PathFinder takes satellite or drone imagery, runs semantic segmentation using a U-Net model, automatically detects rescue targets and safe start points, generates a traversal cost map, runs A* pathfinding, and returns a JSON response with the path, annotated image, and metadata.

---

## Quick Start

### 1. Install Dependencies

```bash
cd pathfinder_backend
pip install -r requirements.txt
```

> **Note:** PyTorch installation may require a platform-specific command.  
> Visit [pytorch.org/get-started](https://pytorch.org/get-started/locally/) for the correct `pip install torch torchvision` command for your system.

### 2. Run the Server

```bash
# From the pathfinder_backend directory
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

- **Interactive docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. Run Tests

```bash
pytest tests/test_pipeline.py -v
```

---

## API Endpoints

### `GET /api/health`

Health check — returns model status.

```bash
curl http://localhost:8000/api/health
```

Response:
```json
{
  "status": "ok",
  "model_loaded": true
}
```

### `POST /api/analyze`

Full analysis pipeline: segmentation → rescue detection → A* pathfinding → visualisation.

```bash
# Encode an image to Base64 and send it
# PowerShell example:
$imageBytes = [System.IO.File]::ReadAllBytes("path/to/image.png")
$base64 = [Convert]::ToBase64String($imageBytes)
$body = @{ image_base64 = $base64 } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/analyze -Method POST -Body $body -ContentType "application/json"

# Linux / macOS curl example:
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\": \"$(base64 -w0 path/to/image.png)\"}"
```

Response:
```json
{
  "status": "success",
  "start_point": [row, col],
  "goal_point": [row, col],
  "path_length": 142,
  "path_coordinates": [[r, c], ...],
  "result_image_base64": "<base64 annotated image>",
  "segmentation_mask_base64": "<base64 colourised mask>",
  "cost_map_stats": {
    "min_cost": 1.0,
    "max_cost": 100.0,
    "avg_path_cost": 23.5
  },
  "processing_time_ms": 350.12
}
```

### `POST /api/segment-only`

Segmentation only — useful for frontend previews.

```bash
curl -X POST http://localhost:8000/api/segment-only \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\": \"$(base64 -w0 path/to/image.png)\"}"
```

Response:
```json
{
  "status": "success",
  "mask_base64": "<base64 colourised mask>",
  "class_distribution": {
    "background": 45.2,
    "water": 20.1,
    "road": 12.5,
    "building": 22.2
  }
}
```

---

## Mock Model (Development Mode)

When no checkpoint file is found at `checkpoints/unet_resnet34.pth`, the backend automatically uses a **MockSegmentationModel** that generates structured synthetic masks. This lets you develop and test the entire frontend without needing a trained model.

The mock produces a plausible-looking mask with:
- A horizontal **water band** (simulating a flood)
- **Road strips** along the edges
- **Building clusters** scattered around the image

---

## Swapping in a Real Trained Model

1. Train a U-Net model using `segmentation_models_pytorch` with:
   - Encoder: `resnet34`
   - Input channels: `3`
   - Output classes: `4`

2. Save the model's `state_dict`:
   ```python
   torch.save(model.state_dict(), "checkpoints/unet_resnet34.pth")
   ```

3. Place the `.pth` file at:
   ```
   pathfinder_backend/checkpoints/unet_resnet34.pth
   ```

4. Restart the server — it will automatically load the real model.

---

## Project Structure

```
pathfinder_backend/
├── main.py                    # FastAPI entry point
├── config.py                  # All constants and configuration
├── requirements.txt
├── README.md
├── models/
│   └── segmentation.py        # U-Net model loader + mock fallback
├── core/
│   ├── preprocessor.py        # Image resizing, normalisation
│   ├── segmentation_runner.py # Model inference orchestration
│   ├── rescue_detector.py     # Auto-detect start + goal points
│   ├── cost_map.py            # Mask → traversal cost grid
│   ├── pathfinder.py          # A* algorithm implementation
│   └── visualizer.py          # Annotated output image generation
├── api/
│   └── routes.py              # REST API endpoints
├── utils/
│   ├── image_utils.py         # Base64 encode/decode helpers
│   └── mask_utils.py          # Morphological operations
└── tests/
    └── test_pipeline.py       # Integration tests (no model needed)
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | Python 3.10+ |
| Web Framework | FastAPI |
| Deep Learning | PyTorch + segmentation_models_pytorch |
| Image Processing | OpenCV, NumPy, Pillow |
| Pathfinding | Custom A* (no external lib) |
| API Format | REST (JSON + Base64 images) |
