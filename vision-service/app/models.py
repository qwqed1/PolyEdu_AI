from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class HandMemory:
    id: str
    handedness: str
    confidence: float
    landmarks: list[dict[str, float]]
    cursor: dict[str, float]
    pinch_state: str = "open"
    grab_state: str = "idle"
    pinch_frames: int = 0
    release_frames: int = 0
    last_seen_ms: int = 0

    def as_payload(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "handedness": self.handedness,
            "confidence": round(self.confidence, 4),
            "landmarks": self.landmarks,
            "cursor": self.cursor,
            "pinchState": self.pinch_state,
            "grabState": self.grab_state,
        }


@dataclass
class VisionFrame:
    hands: list[dict[str, Any]] = field(default_factory=list)
    tracking_status: str = "idle"
    warnings: list[str] = field(default_factory=list)
    primary_cursor: dict[str, float] | None = None
    secondary_cursor: dict[str, float] | None = None
    server_fps: int = 0
    timestamp: int = 0

    def as_payload(self) -> dict[str, Any]:
        return {
            "type": "vision_frame",
            "hands": self.hands,
            "trackingStatus": self.tracking_status,
            "warnings": self.warnings,
            "primaryCursor": self.primary_cursor,
            "secondaryCursor": self.secondary_cursor,
            "serverFps": self.server_fps,
            "timestamp": self.timestamp,
        }
