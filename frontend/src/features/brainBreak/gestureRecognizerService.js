import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import {
  BRAIN_BREAK_GESTURE_ALLOWLIST,
  BRAIN_BREAK_MODEL_ASSET_PATH,
  BRAIN_BREAK_WASM_ROOT,
} from './brainBreakGestures';

export async function createBrainBreakGestureRecognizer() {
  const vision = await FilesetResolver.forVisionTasks(BRAIN_BREAK_WASM_ROOT);

  return GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: BRAIN_BREAK_MODEL_ASSET_PATH,
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.6,
    cannedGesturesClassifierOptions: {
      scoreThreshold: 0.65,
      categoryAllowlist: BRAIN_BREAK_GESTURE_ALLOWLIST,
    },
  });
}

export function recognizeGestureFrame(recognizer, video, now) {
  if (!recognizer || !video || video.readyState < 2) {
    return null;
  }

  return recognizer.recognizeForVideo(video, now);
}

export function closeBrainBreakRecognizer(recognizer) {
  recognizer?.close?.();
}

export function drawGestureLandmarks(canvasElement, landmarks, connections) {
  if (!canvasElement) {
    return;
  }

  const context = canvasElement.getContext('2d');
  if (!context) {
    return;
  }

  const { width, height } = canvasElement;
  context.clearRect(0, 0, width, height);

  if (!landmarks?.length) {
    return;
  }

  context.strokeStyle = 'rgba(255,255,255,0.85)';
  context.lineWidth = 4;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  connections.forEach(({ start, end }) => {
    const startLandmark = landmarks[start];
    const endLandmark = landmarks[end];

    if (!startLandmark || !endLandmark) {
      return;
    }

    context.beginPath();
    context.moveTo(startLandmark.x * width, startLandmark.y * height);
    context.lineTo(endLandmark.x * width, endLandmark.y * height);
    context.stroke();
  });

  context.fillStyle = 'rgba(56, 189, 248, 0.95)';
  landmarks.forEach((landmark) => {
    context.beginPath();
    context.arc(landmark.x * width, landmark.y * height, 6, 0, Math.PI * 2);
    context.fill();
  });
}
