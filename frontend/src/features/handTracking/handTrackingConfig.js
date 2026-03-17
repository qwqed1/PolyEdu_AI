const BASE_URL = import.meta.env.BASE_URL || '/';

function withBase(path) {
  return `${BASE_URL}${path}`.replace(/\/{2,}/g, '/');
}

export const HAND_TRACKING_WASM_ROOT = withBase('mediapipe');
export const HAND_TRACKING_MODEL_ASSET_PATH = withBase('models/hand_landmarker.task');

export const HAND_TRACKING_MAX_HANDS = 2;
export const HAND_TRACKING_CLOSE_PINCH_RATIO = 0.38;
export const HAND_TRACKING_OPEN_PINCH_RATIO = 0.5;
export const HAND_TRACKING_SMOOTHING_ALPHA = 0.35;
export const HAND_TRACKING_EMIT_INTERVAL_MS = 1000 / 24;
export const HAND_TRACKING_LOST_HAND_MS = 260;
export const HAND_TRACKING_MIRROR_X = true;
export const HAND_TRACKING_MIN_DETECTION_CONFIDENCE = 0.45;
export const HAND_TRACKING_MIN_PRESENCE_CONFIDENCE = 0.45;
export const HAND_TRACKING_MIN_TRACKING_CONFIDENCE = 0.45;
export const HAND_TRACKING_FACE_CHECK_INTERVAL_MS = 220;
