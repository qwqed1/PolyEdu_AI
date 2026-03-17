# Vision Service

Python hand-tracking service for `LabArena`.

## Stack

- `FastAPI`
- `MediaPipe Hand Landmarker`
- `OpenCV`

## Run locally

```bash
cd vision-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Environment variables

- `VISION_HOST`
- `VISION_PORT`
- `VISION_ALLOWED_ORIGINS`
- `VISION_MAX_HANDS`
- `VISION_MAX_FPS`
- `VISION_INPUT_WIDTH`
- `VISION_INPUT_HEIGHT`
- `VISION_HAND_MODEL_PATH`
- `VISION_HAND_MODEL_URL`

## Healthcheck

`GET /health`

## WebSocket

`GET /ws/hand-tracking`

Client flow:

1. Open websocket
2. Send `{"type":"hello","sessionId":"...","mode":"lab-arena","width":640,"height":360,"fpsTarget":12}`
3. Send binary JPEG frames
4. Receive `vision_frame` JSON payloads
