import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import {
  HAND_TRACKING_CLOSE_PINCH_RATIO,
  HAND_TRACKING_MAX_HANDS,
  HAND_TRACKING_MIN_DETECTION_CONFIDENCE,
  HAND_TRACKING_MIN_PRESENCE_CONFIDENCE,
  HAND_TRACKING_MIN_TRACKING_CONFIDENCE,
  HAND_TRACKING_MIRROR_X,
  HAND_TRACKING_MODEL_ASSET_PATH,
  HAND_TRACKING_OPEN_PINCH_RATIO,
  HAND_TRACKING_SMOOTHING_ALPHA,
  HAND_TRACKING_WASM_ROOT,
} from './handTrackingConfig';
import { HAND_CONNECTIONS } from './handLandmarkConstants';

function distance(a, b) {
  if (!a || !b) {
    return 1;
  }

  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerp(start, end, alpha) {
  return start + (end - start) * alpha;
}

function midpoint(a, b) {
  if (!a && !b) {
    return { x: 0.5, y: 0.5 };
  }

  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
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

function clampNormalizedBox(box) {
  return {
    x: Math.min(Math.max(box.x, 0), 1),
    y: Math.min(Math.max(box.y, 0), 1),
    width: Math.min(Math.max(box.width, 0), 1),
    height: Math.min(Math.max(box.height, 0), 1),
  };
}

function normalizePoint(point) {
  if (!point) {
    return { x: 0.5, y: 0.5 };
  }

  return clampNormalizedPoint({
    x: HAND_TRACKING_MIRROR_X ? 1 - point.x : point.x,
    y: point.y,
  });
}

function smoothLandmarks(previousLandmarks, landmarks) {
  return landmarks.map((landmark, landmarkIndex) =>
    normalizePoint(smoothPoint(previousLandmarks?.[landmarkIndex], landmark)),
  );
}

function getFallbackHandId(result, index) {
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

function findClosestPreviousHand(previousHands, cursor) {
  const entries = Object.values(previousHands || {});
  if (!entries.length) {
    return null;
  }

  let closest = null;
  let minDistance = Number.POSITIVE_INFINITY;

  entries.forEach((entry) => {
    const nextDistance = distance(entry.cursor, cursor);
    if (nextDistance < minDistance) {
      minDistance = nextDistance;
      closest = entry;
    }
  });

  return minDistance <= 0.24 ? closest : null;
}

function normalizeLandmarkerHand(result, index, previousHand) {
  const landmarks = result.landmarks?.[index];
  if (!landmarks?.length) {
    return null;
  }

  const handednessMeta = result.handednesses?.[index]?.[0];
  const nextLandmarks = smoothLandmarks(previousHand?.landmarks, landmarks);
  const pinchRatio =
    distance(nextLandmarks[4], nextLandmarks[8]) /
    Math.max(distance(nextLandmarks[0], nextLandmarks[9]), 0.0001);
  const pinchState = getPinchState(previousHand?.pinchState === 'pinching', pinchRatio);
  const hoverPoint = nextLandmarks[8] || nextLandmarks[12] || nextLandmarks[0];
  const pinchPoint = midpoint(nextLandmarks[4], nextLandmarks[8]);
  const targetCursor = pinchState === 'pinching' ? pinchPoint : hoverPoint;
  const cursor = clampNormalizedPoint(
    smoothPoint(previousHand?.cursor, targetCursor),
  );

  return {
    fallbackId: getFallbackHandId(result, index),
    handedness: handednessMeta?.categoryName || `Hand ${index + 1}`,
    confidence: handednessMeta?.score || 0,
    cursor,
    hoverPoint,
    pinchPoint,
    pinchRatio,
    pinchState,
    landmarks: nextLandmarks,
  };
}

function resolveStableHandIds(nextHands, previousHands) {
  const previousIds = Object.keys(previousHands || {});
  if (!nextHands.length) {
    return [];
  }

  const matches = [];
  nextHands.forEach((hand, handIndex) => {
    previousIds.forEach((previousId) => {
      const previousHand = previousHands[previousId];
      matches.push({
        handIndex,
        previousId,
        distance: distance(hand.cursor, previousHand?.cursor),
      });
    });
  });

  matches.sort((left, right) => left.distance - right.distance);

  const assignments = {};
  const usedHandIndexes = new Set();
  const usedPreviousIds = new Set();

  matches.forEach((match) => {
    if (match.distance > 0.24) {
      return;
    }

    if (usedHandIndexes.has(match.handIndex) || usedPreviousIds.has(match.previousId)) {
      return;
    }

    assignments[match.handIndex] = match.previousId;
    usedHandIndexes.add(match.handIndex);
    usedPreviousIds.add(match.previousId);
  });

  const usedIds = new Set(Object.values(assignments));
  nextHands.forEach((hand, handIndex) => {
    if (assignments[handIndex]) {
      return;
    }

    if (hand.fallbackId && !usedIds.has(hand.fallbackId)) {
      assignments[handIndex] = hand.fallbackId;
      usedIds.add(hand.fallbackId);
      return;
    }

    let index = 1;
    let id = `hand-${index}`;
    while (usedIds.has(id)) {
      index += 1;
      id = `hand-${index}`;
    }
    assignments[handIndex] = id;
    usedIds.add(id);
  });

  return nextHands.map((hand, handIndex) => ({
    ...hand,
    id: assignments[handIndex],
  }));
}

export async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(HAND_TRACKING_WASM_ROOT);

  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_TRACKING_MODEL_ASSET_PATH,
    },
    runningMode: 'VIDEO',
    numHands: HAND_TRACKING_MAX_HANDS,
    minHandDetectionConfidence: HAND_TRACKING_MIN_DETECTION_CONFIDENCE,
    minHandPresenceConfidence: HAND_TRACKING_MIN_PRESENCE_CONFIDENCE,
    minTrackingConfidence: HAND_TRACKING_MIN_TRACKING_CONFIDENCE,
  });
}

export function detectHandsForVideo(landmarker, video, now) {
  if (!landmarker || !video || video.readyState < 2) {
    return null;
  }

  return landmarker.detectForVideo(video, now);
}

export function normalizeHandTrackingResult(result, previousHands = {}) {
  const hands = (result?.landmarks || []).map((_, index) => {
    const landmarks = result?.landmarks?.[index];
    const cursor = normalizePoint(landmarks?.[8] || landmarks?.[12] || landmarks?.[0] || { x: 0.5, y: 0.5 });
    const closestPrevious = findClosestPreviousHand(previousHands, cursor);
    return normalizeLandmarkerHand(result, index, closestPrevious);
  }).filter(Boolean);

  const stableHands = resolveStableHandIds(hands, previousHands);

  const nextHandMap = stableHands.reduce((accumulator, hand) => {
    accumulator[hand.id] = hand;
    return accumulator;
  }, {});

  return {
    hands: stableHands,
    handsMap: nextHandMap,
    trackingStatus: stableHands.length ? 'tracking' : 'searching',
  };
}

export function closeHandLandmarker(landmarker) {
  landmarker?.close?.();
}

export function normalizeFaceBoxes(faces, videoElement) {
  if (!faces?.length || !videoElement?.videoWidth || !videoElement?.videoHeight) {
    return [];
  }

  return faces.map((face, index) => {
    const box = face?.boundingBox;
    if (!box) {
      return null;
    }

    const normalizedWidth = box.width / videoElement.videoWidth;
    const normalizedHeight = box.height / videoElement.videoHeight;
    const normalizedX = box.x / videoElement.videoWidth;
    const normalizedY = box.y / videoElement.videoHeight;

    return {
      id: `face-${index + 1}`,
      ...clampNormalizedBox({
        x: HAND_TRACKING_MIRROR_X ? 1 - normalizedX - normalizedWidth : normalizedX,
        y: normalizedY,
        width: normalizedWidth,
        height: normalizedHeight,
      }),
    };
  }).filter(Boolean);
}

export function drawHandTrackingOverlay(canvasElement, hands, faceBoxes = []) {
  if (!canvasElement) {
    return;
  }

  const context = canvasElement.getContext('2d');
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvasElement.width, canvasElement.height);

  faceBoxes.forEach((faceBox) => {
    context.strokeStyle = 'rgba(250, 204, 21, 0.95)';
    context.lineWidth = 3;
    context.setLineDash([8, 6]);
    context.strokeRect(
      faceBox.x * canvasElement.width,
      faceBox.y * canvasElement.height,
      faceBox.width * canvasElement.width,
      faceBox.height * canvasElement.height,
    );
    context.setLineDash([]);
  });

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

    HAND_CONNECTIONS.forEach((connection) => {
      const startPoint = hand.landmarks[connection.start];
      const endPoint = hand.landmarks[connection.end];

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
