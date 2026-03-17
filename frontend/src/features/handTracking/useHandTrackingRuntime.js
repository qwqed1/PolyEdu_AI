import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HAND_TRACKING_EMIT_INTERVAL_MS, HAND_TRACKING_LOST_HAND_MS } from './handTrackingConfig';
import {
  closeHandLandmarker,
  createHandLandmarker,
  detectHandsForVideo,
  drawHandTrackingOverlay,
  normalizeHandTrackingResult,
} from './handTrackingService';
import { useHandTrackingCamera } from './useHandTrackingCamera';

function buildInitialFrame() {
  return {
    hands: [],
    trackingStatus: 'idle',
    fps: 0,
    timestamp: 0,
  };
}

export function useHandTrackingRuntime({ autoStart = true } = {}) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const previousHandsRef = useRef({});
  const lastEmitRef = useRef(0);
  const lastFrameTimestampRef = useRef(0);
  const lastSeenAtRef = useRef({});
  const {
    cameraState,
    cameraErrorKey,
    requestCamera,
    stopCamera,
  } = useHandTrackingCamera(videoRef);
  const [modelState, setModelState] = useState('idle');
  const [frame, setFrame] = useState(() => buildInitialFrame());
  const [errorKey, setErrorKey] = useState('');

  const stopLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    drawHandTrackingOverlay(overlayRef.current, []);
  }, []);

  const stop = useCallback(() => {
    stopLoop();
    stopCamera();
    setFrame(buildInitialFrame());
    setErrorKey('');
  }, [stopCamera, stopLoop]);

  const ensureLandmarker = useCallback(async () => {
    if (landmarkerRef.current) {
      return true;
    }

    setModelState('loading');

    try {
      landmarkerRef.current = await createHandLandmarker();
      setModelState('ready');
      return true;
    } catch (error) {
      console.error('Failed to initialize hand tracking model', error);
      setModelState('error');
      setErrorKey('modelUnavailable');
      return false;
    }
  }, []);

  const syncOverlaySize = useCallback(() => {
    const videoElement = videoRef.current;
    const overlayElement = overlayRef.current;

    if (!videoElement || !overlayElement || !videoElement.videoWidth || !videoElement.videoHeight) {
      return;
    }

    if (
      overlayElement.width !== videoElement.videoWidth ||
      overlayElement.height !== videoElement.videoHeight
    ) {
      overlayElement.width = videoElement.videoWidth;
      overlayElement.height = videoElement.videoHeight;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (animationFrameRef.current || !landmarkerRef.current) {
      return;
    }

    const tick = () => {
      const now = performance.now();
      const videoElement = videoRef.current;
      syncOverlaySize();

      const result = detectHandsForVideo(landmarkerRef.current, videoElement, now);
      const normalized = normalizeHandTrackingResult(result, previousHandsRef.current);
      const trackedIds = new Set(normalized.hands.map((hand) => hand.id));

      normalized.hands.forEach((hand) => {
        lastSeenAtRef.current[hand.id] = now;
      });

      Object.keys(previousHandsRef.current).forEach((handId) => {
        if (!trackedIds.has(handId) && now - (lastSeenAtRef.current[handId] || 0) < HAND_TRACKING_LOST_HAND_MS) {
          normalized.hands.push(previousHandsRef.current[handId]);
        }
      });

      const handsMap = normalized.hands.reduce((accumulator, hand) => {
        accumulator[hand.id] = hand;
        return accumulator;
      }, {});

      previousHandsRef.current = handsMap;
      drawHandTrackingOverlay(overlayRef.current, normalized.hands);

      if (now - lastEmitRef.current >= HAND_TRACKING_EMIT_INTERVAL_MS) {
        const fps = lastFrameTimestampRef.current
          ? Math.round(1000 / Math.max(now - lastFrameTimestampRef.current, 1))
          : 0;

        setFrame({
          hands: normalized.hands,
          trackingStatus: normalized.hands.length ? 'tracking' : 'searching',
          fps,
          timestamp: now,
        });

        lastEmitRef.current = now;
        lastFrameTimestampRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [syncOverlaySize]);

  const restart = useCallback(async () => {
    stopLoop();
    stopCamera();
    setErrorKey('');
    setFrame(buildInitialFrame());

    const camera = await requestCamera();
    if (!camera.ok) {
      setErrorKey(camera.errorKey);
      return false;
    }

    const modelReady = await ensureLandmarker();
    if (!modelReady) {
      return false;
    }

    startLoop();
    return true;
  }, [ensureLandmarker, requestCamera, startLoop, stopCamera, stopLoop]);

  useEffect(() => {
    if (!autoStart) {
      return undefined;
    }

    const startId = window.setTimeout(() => {
      restart();
    }, 0);

    return () => {
      window.clearTimeout(startId);
      stopLoop();
      stopCamera();
      closeHandLandmarker(landmarkerRef.current);
      landmarkerRef.current = null;
    };
  }, [autoStart, restart, stopCamera, stopLoop]);

  const trackingState = useMemo(() => {
    if (errorKey || cameraErrorKey || modelState === 'error') {
      return 'error';
    }

    if (cameraState === 'requesting' || modelState === 'loading') {
      return 'initializing';
    }

    return frame.trackingStatus;
  }, [cameraErrorKey, cameraState, errorKey, frame.trackingStatus, modelState]);

  return {
    videoRef,
    overlayRef,
    frame,
    cameraState,
    modelState,
    trackingState,
    errorKey: errorKey || cameraErrorKey,
    restart,
    stop,
  };
}
