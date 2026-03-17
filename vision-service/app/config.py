from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)


def _split_csv(value: str) -> list[str]:
    return [entry.strip() for entry in value.split(",") if entry.strip()]


@dataclass(frozen=True)
class Settings:
    host: str = os.getenv("VISION_HOST", "0.0.0.0")
    port: int = int(os.getenv("VISION_PORT", "8001"))
    allowed_origins: tuple[str, ...] = tuple(_split_csv(os.getenv("VISION_ALLOWED_ORIGINS", "*")))
    max_hands: int = int(os.getenv("VISION_MAX_HANDS", "2"))
    max_fps: int = int(os.getenv("VISION_MAX_FPS", "15"))
    input_width: int = int(os.getenv("VISION_INPUT_WIDTH", "640"))
    input_height: int = int(os.getenv("VISION_INPUT_HEIGHT", "360"))
    pinch_enter_frames: int = int(os.getenv("VISION_PINCH_ENTER_FRAMES", "3"))
    pinch_release_frames: int = int(os.getenv("VISION_PINCH_RELEASE_FRAMES", "2"))
    hand_loss_grace_ms: int = int(os.getenv("VISION_HAND_LOSS_GRACE_MS", "220"))
    model_asset_path: Path = Path(
        os.getenv(
            "VISION_HAND_MODEL_PATH",
            str(BASE_DIR / "models" / "hand_landmarker.task"),
        )
    )
    model_asset_url: str = os.getenv("VISION_HAND_MODEL_URL", DEFAULT_MODEL_URL)


settings = Settings()
