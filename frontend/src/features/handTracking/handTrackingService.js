import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import {
  HAND_TRACKING_CLOSE_PINCH_RATIO,
  HAND_TRACKING_MAX_HANDS,
  HAND_TRACKING_MODEL_ASSET_PATH,
  HAND_TRACKING_OPEN_PINCH_RATIO,
  HAND_TRACKING_SMOOTHING_ALPHA,
  HAND_TRACKING_WASM_ROOT,
} from './handTrackingConfig';

function distance(a, b) {
  if (!a || !b) {
    return 1;
  }

  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerp(start, end, alpha) {
  return start + (end - start) * alpha;
}

function smoothPoint(previousPoint, nextPoint) {
  if (!previousPoint) {
    return nextPoint;
  }

  return {
    x: lerp(previousPoint.x, nextPoint.x, HAND_TRACKING_SMOOTHING_ALPHA),
    y: lerp(previousPoint.y, nextPoint.y, HAND_TRACKING_SMOOTHING_ALPHA),
  };
}

function clampNormalizedPoint(point) {
  return {
    x: Math.min(Math.max(point.x, 0), 1),
    y: Math.min(Math.max(point.y, 0), 1),
  };
}

function getHandId(result, index) {
  const handedness = result.handednesses?.[index]?.[0]?.categoryName?.toLowerCase();
  if (handedness === 'left' || handedness === 'right') {
    return handedness;
  }

  return `hand-${index + 1}`;
}

function getPinchState(pinchingPreviously, pinchRatio) {
  if (pinchingPreviously) {
    return pinchRatio < HAND_TRACKING_OPEN_PINCH_RATIO ? 'pinching' : 'open';
  }

  return pinchRatio < HAND_TRACKING_CLOSE_PINCH_RATIO ? 'pinching' : 'open';
}

function normalizeLandmarkerHand(result, index, previousHands) {
  const landmarks = result.landmarks?.[index];
  if (!landmarks?.length) {
    return null;
  }

  const id = getHandId(result, index);
  const handednessMeta = result.handednesses?.[index]?.[0];
  const previous = previousHands[id];
  const cursor = clampNormalizedPoint(
    smoothPoint(previous?.cursor, landmarks[8] || landmarks[12] || landmarks[0]),
  );
  const pinchRatio =
    distance(landmarks[4], landmarks[8]) /
    Math.max(distance(landmarks[0], landmarks[9]), 0.0001);
  const pinchState = getPinchState(previous?.pinchState === 'pinching', pinchRatio);

  return {
    id,
    handedness: handednessMeta?.categoryName || `Hand ${index + 1}`,
    confidence: handednessMeta?.score || 0,
    cursor,
    pinchRatio,
    pinchState,
    landmarks,
  };
}

export async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(HAND_TRACKING_WASM_ROOT);

  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_TRACKING_MODEL_ASSET_PATH,
    },
    runningMode: 'VIDEO',
    numHands: HAND_TRACKING_MAX_HANDS,
    minHandDetectionConfidence: 0.55,
    minHandPresenceConfidence: 0.55,
    minTrackingConfidence: 0.55,
  });
}

export function detectHandsForVideo(landmarker, video, now) {
  if (!landmarker || !video || video.readyState < 2) {
    return null;
  }

  return landmarker.detectForVideo(video, now);
}

export function normalizeHandTrackingResult(result, previousHands = {}) {
  const hands = (result?.landmarks || [])
    .map((_, index) => normalizeLandmarkerHand(result, index, previousHands))
    .filter(Boolean);

  const nextHandMap = hands.reduce((accumulator, hand) => {
    accumulator[hand.id] = hand;
    return accumulator;
  }, {});

  return {
    hands,
    handsMap: nextHandMap,
    trackingStatus: hands.length ? 'tracking' : 'searching',
  };
}

export function closeHandLandmarker(landmarker) {
  landmarker?.close?.();
}

export function drawHandTrackingOverlay(canvasElement, hands) {
  if (!canvasElement) {
    return;
  }

  const context = canvasElement.getContext('2d');
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (!hands?.length) {
    return;
  }

  context.lineWidth = 3;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  hands.forEach((hand, handIndex) => {
    const stroke = handIndex === 0 ? 'rgba(56, 189, 248, 0.92)' : 'rgba(251, 146, 60, 0.92)';
    const fill = hand.pinchState === 'pinching'
      ? 'rgba(249, 115, 22, 0.95)'
      : 'rgba(16, 185, 129, 0.92)';

    context.strokeStyle = stroke;
    context.fillStyle = fill;

    HandLandmarker.HAND_CONNECTIONS.forEach(([startIndex, endIndex]) => {
      const startPoint = hand.landmarks[startIndex];
      const endPoint = hand.landmarks[endIndex];

      if (!startPoint || !endPoint) {
        return;
      }

      context.beginPath();
      context.moveTo(startPoint.x * canvasElement.width, startPoint.y * canvasElement.height);
      context.lineTo(endPoint.x * canvasElement.width, endPoint.y * canvasElement.height);
      context.stroke();
    });

    hand.landmarks.forEach((landmark, pointIndex) => {
      context.beginPath();
      context.arc(
        landmark.x * canvasElement.width,
        landmark.y * canvasElement.height,
        pointIndex === 8 ? 7 : 4,
        0,
        Math.PI * 2,
      );
      context.fill();
    });
  });
}
