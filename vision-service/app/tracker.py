from __future__ import annotations

import time
import urllib.request
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

from .config import settings
from .models import HandMemory, VisionFrame


def _distance(point_a: dict[str, float], point_b: dict[str, float]) -> float:
    return float(((point_a["x"] - point_b["x"]) ** 2 + (point_a["y"] - point_b["y"]) ** 2) ** 0.5)


def _normalized_landmarks(landmarks: list) -> list[dict[str, float]]:
    normalized = []
    for landmark in landmarks:
        normalized.append(
            {
                "x": min(max(float(landmark.x), 0.0), 1.0),
                "y": min(max(float(landmark.y), 0.0), 1.0),
                "z": float(landmark.z),
            }
        )
    return normalized


def _cursor_from_landmarks(landmarks: list[dict[str, float]]) -> dict[str, float]:
    fingertip = landmarks[8] if len(landmarks) > 8 else landmarks[0]
    return {"x": fingertip["x"], "y": fingertip["y"]}


def ensure_model_asset(model_path: Path, model_url: str) -> Path:
    model_path.parent.mkdir(parents=True, exist_ok=True)
    if model_path.exists():
        return model_path

    urllib.request.urlretrieve(model_url, model_path)
    return model_path


class VisionTracker:
    def __init__(self) -> None:
        model_path = ensure_model_asset(settings.model_asset_path, settings.model_asset_url)
        base_options = python.BaseOptions(model_asset_path=str(model_path))
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_hands=settings.max_hands,
            min_hand_detection_confidence=0.35,
            min_hand_presence_confidence=0.35,
            min_tracking_confidence=0.35,
        )
        self.landmarker = vision.HandLandmarker.create_from_options(options)
        self.hand_memory: dict[str, HandMemory] = {}
        self.last_frame_at_ms = 0

    def close(self) -> None:
        self.landmarker.close()

    def process_frame(self, jpeg_bytes: bytes) -> VisionFrame:
        now_ms = int(time.perf_counter() * 1000)
        np_frame = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        decoded_frame = cv2.imdecode(np_frame, cv2.IMREAD_COLOR)

        if decoded_frame is None:
            return VisionFrame(
                tracking_status="error",
                warnings=["frame_decode_failed"],
                server_fps=self._server_fps(now_ms),
                timestamp=now_ms,
            )

        rgb_frame = cv2.cvtColor(decoded_frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        result = self.landmarker.detect_for_video(mp_image, now_ms)

        hands: list[dict[str, object]] = []
        warnings: list[str] = []
        seen_ids: set[str] = set()
        handedness_counts: dict[str, int] = {}

        hand_landmarks = result.hand_landmarks or []
        handedness_list = result.handedness or []

        for index, landmarks in enumerate(hand_landmarks):
            normalized_landmarks = _normalized_landmarks(landmarks)
            handedness_meta = handedness_list[index][0] if index < len(handedness_list) and handedness_list[index] else None
            handedness = (getattr(handedness_meta, "category_name", None) or f"Hand {index + 1}").lower()
            handedness_counts[handedness] = handedness_counts.get(handedness, 0) + 1
            hand_id = handedness if handedness_counts[handedness] == 1 else f"{handedness}-{handedness_counts[handedness]}"
            confidence = float(getattr(handedness_meta, "score", 0.0) or 0.0)
            cursor = _cursor_from_landmarks(normalized_landmarks)

            thumb_tip = normalized_landmarks[4]
            index_tip = normalized_landmarks[8]
            palm_anchor = normalized_landmarks[0]
            palm_mid = normalized_landmarks[9]
            pinch_ratio = _distance(thumb_tip, index_tip) / max(_distance(palm_anchor, palm_mid), 0.0001)
            raw_pinching = pinch_ratio <= 0.42

            previous = self.hand_memory.get(hand_id)
            if raw_pinching:
                pinch_frames = (previous.pinch_frames if previous else 0) + 1
                release_frames = 0
            else:
                pinch_frames = 0
                release_frames = (previous.release_frames if previous else 0) + 1

            pinch_state = previous.pinch_state if previous else "open"
            if raw_pinching and pinch_frames >= settings.pinch_enter_frames:
                pinch_state = "pinching"
            elif (not raw_pinching) and release_frames >= settings.pinch_release_frames:
                pinch_state = "open"

            if raw_pinching and pinch_state != "pinching":
                grab_state = "candidate"
            elif pinch_state == "pinching":
                grab_state = "grabbed"
            else:
                grab_state = "idle"

            memory = HandMemory(
                id=hand_id,
                handedness=handedness,
                confidence=confidence,
                landmarks=normalized_landmarks,
                cursor=cursor,
                pinch_state=pinch_state,
                grab_state=grab_state,
                pinch_frames=pinch_frames,
                release_frames=release_frames,
                last_seen_ms=now_ms,
            )
            self.hand_memory[hand_id] = memory
            hands.append(memory.as_payload())
            seen_ids.add(hand_id)

        for hand_id, memory in list(self.hand_memory.items()):
            if hand_id in seen_ids:
                continue

            if now_ms - memory.last_seen_ms <= settings.hand_loss_grace_ms:
                hands.append(memory.as_payload())
                warnings.append("hand_reacquiring")
                continue

            self.hand_memory.pop(hand_id, None)

        tracking_status = "tracking" if hands else "searching"
        if not hands:
            warnings.append("no_hand_detected")

        ordered_hands = sorted(hands, key=lambda hand: hand["id"])
        primary_cursor = ordered_hands[0]["cursor"] if ordered_hands else None
        secondary_cursor = ordered_hands[1]["cursor"] if len(ordered_hands) > 1 else None

        return VisionFrame(
            hands=ordered_hands,
            tracking_status=tracking_status,
            warnings=warnings,
            primary_cursor=primary_cursor,
            secondary_cursor=secondary_cursor,
            server_fps=self._server_fps(now_ms),
            timestamp=now_ms,
        )

    def _server_fps(self, now_ms: int) -> int:
        fps = 0
        if self.last_frame_at_ms:
            fps = round(1000 / max(now_ms - self.last_frame_at_ms, 1))
        self.last_frame_at_ms = now_ms
        return fps
