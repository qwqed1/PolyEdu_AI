import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';
import {
  RANDOM_STUDENT_FACE_MODEL_ASSET_PATH,
  RANDOM_STUDENT_MIN_DETECTION_CONFIDENCE,
  RANDOM_STUDENT_MIN_SUPPRESSION_THRESHOLD,
  RANDOM_STUDENT_WASM_ROOT,
} from './randomStudentConfig';

function clampNormalizedValue(value) {
  return Math.min(Math.max(value, 0), 1);
}

export async function createFaceDetector() {
  const vision = await FilesetResolver.forVisionTasks(RANDOM_STUDENT_WASM_ROOT);

  return FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: RANDOM_STUDENT_FACE_MODEL_ASSET_PATH,
    },
    runningMode: 'VIDEO',
    minDetectionConfidence: RANDOM_STUDENT_MIN_DETECTION_CONFIDENCE,
    minSuppressionThreshold: RANDOM_STUDENT_MIN_SUPPRESSION_THRESHOLD,
  });
}

export function detectFacesForVideo(detector, videoElement, now) {
  if (!detector || !videoElement || videoElement.readyState < 2) {
    return null;
  }

  return detector.detectForVideo(videoElement, now);
}

export function normalizeFaceDetections(result, videoElement) {
  if (!videoElement?.videoWidth || !videoElement?.videoHeight) {
    return [];
  }

  return (result?.detections || []).map((detection, index) => {
    const box = detection?.boundingBox;
    if (!box || !box.width || !box.height) {
      return null;
    }

    const normalizedBox = {
      x: clampNormalizedValue(box.originX / videoElement.videoWidth),
      y: clampNormalizedValue(box.originY / videoElement.videoHeight),
      width: clampNormalizedValue(box.width / videoElement.videoWidth),
      height: clampNormalizedValue(box.height / videoElement.videoHeight),
    };

    if (normalizedBox.width < 0.04 || normalizedBox.height < 0.04) {
      return null;
    }

    const score = detection?.categories?.[0]?.score || 0;

    return {
      id: `detection-${index + 1}`,
      score,
      bbox: normalizedBox,
      centroid: {
        x: normalizedBox.x + normalizedBox.width / 2,
        y: normalizedBox.y + normalizedBox.height / 2,
      },
      area: normalizedBox.width * normalizedBox.height,
    };
  }).filter(Boolean);
}

export function closeFaceDetector(detector) {
  detector?.close?.();
}
