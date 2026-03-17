from __future__ import annotations

import json
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .tracker import VisionTracker


def _origin_allowed(origin: str | None) -> bool:
    if not settings.allowed_origins or settings.allowed_origins == ("*",):
        return True
    if not origin:
        return False
    return origin in settings.allowed_origins


app = FastAPI(title="ushi-it vision service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.allowed_origins == ("*",) else list(settings.allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "vision-service",
        "maxHands": settings.max_hands,
        "maxFps": settings.max_fps,
        "inputSize": {
            "width": settings.input_width,
            "height": settings.input_height,
        },
        "modelAssetPath": str(settings.model_asset_path),
    }


@app.websocket("/ws/hand-tracking")
async def hand_tracking_socket(websocket: WebSocket) -> None:
    origin = websocket.headers.get("origin")
    if not _origin_allowed(origin):
        await websocket.close(code=1008, reason="Origin is not allowed")
        return

    await websocket.accept()
    tracker = VisionTracker()

    try:
        hello_seen = False

        while True:
            message = await websocket.receive()
            message_type = message.get("type")

            if message_type == "websocket.disconnect":
                break

            text_payload = message.get("text")
            binary_payload = message.get("bytes")

            if text_payload is not None:
                payload = json.loads(text_payload)
                event_type = payload.get("type")

                if event_type == "hello":
                    hello_seen = True
                    await websocket.send_json(
                        {
                            "type": "ready",
                            "sessionId": payload.get("sessionId"),
                            "mode": payload.get("mode", "lab-arena"),
                            "maxHands": settings.max_hands,
                            "maxFps": settings.max_fps,
                        }
                    )
                    continue

                if event_type == "ping":
                    await websocket.send_json({"type": "pong"})
                    continue

                await websocket.send_json(
                    {
                        "type": "warning",
                        "message": "unsupported_message",
                    }
                )
                continue

            if binary_payload is not None:
                if not hello_seen:
                    await websocket.send_json(
                        {
                            "type": "warning",
                            "message": "hello_required",
                        }
                    )
                    continue

                frame = tracker.process_frame(binary_payload)
                await websocket.send_json(frame.as_payload())
    except WebSocketDisconnect:
        pass
    finally:
        tracker.close()
