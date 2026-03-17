import { useCallback, useMemo, useRef } from 'react';
import {
  HAND_TRACKING_FACE_CHECK_INTERVAL_MS,
  HAND_TRACKING_EMIT_INTERVAL_MS,
  HAND_TRACKING_LOST_HAND_MS,
} from './handTrackingConfig';
import {
  closeHandLandmarker,
  createHandLandmarker,
  detectHandsForVideo,
  drawHandTrackingOverlay,
  normalizeFaceBoxes,
  normalizeHandTrackingResult,
} from './handTrackingService';
import { useHandTrackingCamera } from './useHandTrackingCamera';
import { useVisionRealtimeLoop } from './useVisionRealtimeLoop';

function buildInitialFrame() {
  return {
    hands: [],
    faceBoxes: [],
    trackingStatus: 'idle',
    faces: 0,
    faceTrackingStatus: 'idle',
    fps: 0,
    timestamp: 0,
    debug: {
      faces: 0,
      cameraState: 'idle',
      modelState: 'idle',
    },
  };
}

export function useBrowserHandTrackingRuntime({ autoStart = true } = {}) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const previousHandsRef = useRef({});
  const lastSeenAtRef = useRef({});
  const faceDetectorRef = useRef(undefined);
  const faceCheckInFlightRef = useRef(false);
  const lastFaceCheckRef = useRef(0);
  const faceSnapshotRef = useRef({
    faces: 0,
    faceBoxes: [],
    faceTrackingStatus: 'idle',
  });
  const {
    cameraState,
    cameraErrorKey,
    requestCamera,
    stopCamera,
  } = useHandTrackingCamera(videoRef);

  const clearRuntimeRefs = useCallback(() => {
    previousHandsRef.current = {};
    lastSeenAtRef.current = {};
    lastFaceCheckRef.current = 0;
    faceCheckInFlightRef.current = false;
    faceSnapshotRef.current = {
      faces: 0,
      faceBoxes: [],
      faceTrackingStatus: 'idle',
    };
  }, []);

  const ensureFaceDetector = useCallback(() => {
    if (faceDetectorRef.current !== undefined) {
      return faceDetectorRef.current;
    }

    if (typeof window === 'undefined' || !('FaceDetector' in window)) {
      faceDetectorRef.current = null;
      return faceDetectorRef.current;
    }

    try {
      faceDetectorRef.current = new window.FaceDetector({
        fastMode: true,
        maxDetectedFaces: 1,
      });
    } catch (error) {
      console.warn('Face detector is unavailable in this browser', error);
      faceDetectorRef.current = null;
    }

    return faceDetectorRef.current;
  }, []);

  const detectFrame = useCallback(({ processor, videoElement, now }) => {
    const faceDetector = ensureFaceDetector();
    if (
      faceDetector &&
      !faceCheckInFlightRef.current &&
      now - lastFaceCheckRef.current >= HAND_TRACKING_FACE_CHECK_INTERVAL_MS
    ) {
      faceCheckInFlightRef.current = true;
      lastFaceCheckRef.current = now;

      faceDetector.detect(videoElement)
        .then((faces) => {
          faceSnapshotRef.current = {
            faces: faces.length,
            faceBoxes: normalizeFaceBoxes(faces, videoElement),
            faceTrackingStatus: faces.length ? 'tracking' : 'searching',
          };
        })
        .catch((error) => {
          console.warn('Face detection failed', error);
          faceSnapshotRef.current = {
            faces: 0,
            faceBoxes: [],
            faceTrackingStatus: 'error',
          };
        })
        .finally(() => {
          faceCheckInFlightRef.current = false;
        });
    } else if (!faceDetector) {
      faceSnapshotRef.current = {
        faces: 0,
        faceBoxes: [],
        faceTrackingStatus: 'unsupported',
      };
    }

    const result = detectHandsForVideo(processor, videoElement, now);
    const normalized = normalizeHandTrackingResult(result, previousHandsRef.current);
    const trackedIds = new Set(normalized.hands.map((hand) => hand.id));

    normalized.hands.forEach((hand) => {
      lastSeenAtRef.current[hand.id] = now;
    });

    Object.keys(previousHandsRef.current).forEach((handId) => {
      const recentlySeen = now - (lastSeenAtRef.current[handId] || 0) < HAND_TRACKING_LOST_HAND_MS;
      if (!trackedIds.has(handId) && recentlySeen) {
        normalized.hands.push(previousHandsRef.current[handId]);
      }
    });

    previousHandsRef.current = normalized.hands.reduce((accumulator, hand) => {
      accumulator[hand.id] = hand;
      return accumulator;
    }, {});

    return {
      hands: normalized.hands,
      faceBoxes: faceSnapshotRef.current.faceBoxes,
      trackingStatus: normalized.hands.length ? 'tracking' : 'searching',
      faces: faceSnapshotRef.current.faces,
      faceTrackingStatus: faceSnapshotRef.current.faceTrackingStatus,
    };
  }, [ensureFaceDetector]);

  const drawFrame = useCallback(({ overlayElement, frame }) => {
    drawHandTrackingOverlay(overlayElement, frame.hands, frame.faceBoxes);
  }, []);

  const realtime = useVisionRealtimeLoop({
    autoStart,
    videoRef,
    overlayRef,
    initialFrame: buildInitialFrame,
    emitIntervalMs: HAND_TRACKING_EMIT_INTERVAL_MS,
    requestCamera,
    stopCamera,
    cameraState,
    cameraErrorKey,
    createProcessor: createHandLandmarker,
    closeProcessor: closeHandLandmarker,
    detectFrame,
    drawFrame,
  });

  const stop = useCallback(() => {
    clearRuntimeRefs();
    realtime.stop();
  }, [clearRuntimeRefs, realtime]);

  const start = useCallback(async () => {
    clearRuntimeRefs();
    return realtime.start();
  }, [clearRuntimeRefs, realtime]);

  const restart = useCallback(async () => {
    clearRuntimeRefs();
    return realtime.restart();
  }, [clearRuntimeRefs, realtime]);

  const frame = useMemo(() => ({
    ...realtime.frame,
    debug: {
      faces: realtime.frame.faces,
      cameraState: realtime.cameraState,
      modelState: realtime.modelState,
    },
  }), [realtime.cameraState, realtime.frame, realtime.modelState]);

  return {
    videoRef,
    overlayRef,
    frame,
    cameraState: realtime.cameraState,
    modelState: realtime.modelState,
    wsState: 'browser',
    pythonState: 'browser',
    trackingState: realtime.state,
    state: realtime.state,
    errorKey: realtime.error,
    error: realtime.error,
    start,
    restart,
    stop,
  };
}
