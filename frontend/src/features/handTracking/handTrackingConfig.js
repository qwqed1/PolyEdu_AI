export const HAND_TRACKING_WASM_ROOT =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm';
export const HAND_TRACKING_MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export const HAND_TRACKING_MAX_HANDS = 2;
export const HAND_TRACKING_CLOSE_PINCH_RATIO = 0.38;
export const HAND_TRACKING_OPEN_PINCH_RATIO = 0.5;
export const HAND_TRACKING_SMOOTHING_ALPHA = 0.35;
export const HAND_TRACKING_EMIT_INTERVAL_MS = 1000 / 24;
export const HAND_TRACKING_LOST_HAND_MS = 260;
export const HAND_TRACKING_MIRROR_X = true;
export const HAND_TRACKING_MIN_DETECTION_CONFIDENCE = 0.3;
export const HAND_TRACKING_MIN_PRESENCE_CONFIDENCE = 0.3;
export const HAND_TRACKING_MIN_TRACKING_CONFIDENCE = 0.3;
export const HAND_TRACKING_FACE_CHECK_INTERVAL_MS = 220;

export const HAND_TRACKING_CAPTURE_WIDTH = 640;
export const HAND_TRACKING_CAPTURE_HEIGHT = 360;
export const HAND_TRACKING_CAPTURE_QUALITY = 0.62;
export const HAND_TRACKING_TARGET_FPS = 12;
export const HAND_TRACKING_MAX_BUFFERED_BYTES = 900000;
export const HAND_TRACKING_WS_READY_TIMEOUT_MS = 8000;

export function getVisionWsUrl() {
  const configuredUrl = String(import.meta.env.VITE_VISION_WS_URL || '').trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const { hostname, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//localhost:8001/ws/hand-tracking`;
  }

  return '';
}
