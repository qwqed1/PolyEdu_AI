import { useEffect, useMemo, useRef, useState } from 'react';

function withTimestamp(frame, now, previousTimestamp) {
  const fps = previousTimestamp ? Math.round(1000 / Math.max(now - previousTimestamp, 1)) : 0;
  return {
    ...frame,
    fps,
    timestamp: now,
  };
}

export function useVisionRealtimeLoop({
  autoStart = true,
  videoRef: externalVideoRef,
  overlayRef: externalOverlayRef,
  initialFrame,
  emitIntervalMs,
  requestCamera,
  stopCamera,
  cameraState,
  cameraErrorKey,
  createProcessor,
  closeProcessor,
  detectFrame,
  drawFrame,
}) {
  const localVideoRef = useRef(null);
  const localOverlayRef = useRef(null);
  const videoRef = externalVideoRef || localVideoRef;
  const overlayRef = externalOverlayRef || localOverlayRef;
  const processorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const runningRef = useRef(false);
  const lastEmitRef = useRef(0);
  const lastFrameTimestampRef = useRef(0);
  const startRef = useRef(() => Promise.resolve(false));
  const stopRef = useRef(() => {});
  const [modelState, setModelState] = useState('idle');
  const [error, setError] = useState('');
  const [frame, setFrame] = useState(() => initialFrame());

  function clearOverlay() {
    const overlayElement = overlayRef.current;
    if (!overlayElement) {
      return;
    }

    const context = overlayElement.getContext('2d');
    if (!context) {
      return;
    }

    context.clearRect(0, 0, overlayElement.width, overlayElement.height);
  }

  function syncOverlaySize() {
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
  }

  function stopLoop() {
    runningRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    clearOverlay();
  }

  async function ensureProcessor() {
    if (processorRef.current) {
      return true;
    }

    setModelState('loading');

    try {
      processorRef.current = await createProcessor();
      setModelState('ready');
      return true;
    } catch (processorError) {
      console.error('Failed to initialize processor', processorError);
      setModelState('error');
      setError('modelUnavailable');
      return false;
    }
  }

  function startLoop() {
    if (animationFrameRef.current || runningRef.current || !processorRef.current) {
      return;
    }

    runningRef.current = true;

    const tick = () => {
      if (!runningRef.current) {
        animationFrameRef.current = null;
        return;
      }

      const now = performance.now();
      const videoElement = videoRef.current;

      if (!videoElement || videoElement.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      syncOverlaySize();

      let nextFrame;
      try {
        nextFrame = detectFrame({
          processor: processorRef.current,
          videoElement,
          now,
        });
      } catch (frameError) {
        console.error('Vision frame failed', frameError);
        setError('modelUnavailable');
        setModelState('error');
        stopLoop();
        return;
      }

      drawFrame({
        overlayElement: overlayRef.current,
        frame: nextFrame,
      });

      if (now - lastEmitRef.current >= emitIntervalMs) {
        setFrame(withTimestamp(nextFrame, now, lastFrameTimestampRef.current));
        lastEmitRef.current = now;
        lastFrameTimestampRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }

  function stop() {
    stopLoop();
    stopCamera();
    lastEmitRef.current = 0;
    lastFrameTimestampRef.current = 0;
    setError('');
    setFrame(initialFrame());
  }

  async function start() {
    setError('');

    const camera = await requestCamera();
    if (!camera.ok) {
      setError(camera.errorKey || 'cameraUnavailable');
      return false;
    }

    const videoElement = videoRef.current;
    if (!videoElement || videoElement.readyState < 2) {
      setError('cameraUnavailable');
      return false;
    }

    const ready = await ensureProcessor();
    if (!ready) {
      return false;
    }

    startLoop();
    return true;
  }

  async function restart() {
    stop();
    return start();
  }

  useEffect(() => {
    startRef.current = start;
    stopRef.current = stop;
  });

  useEffect(() => {
    if (!autoStart) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      startRef.current();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
      stopRef.current();
      closeProcessor(processorRef.current);
      processorRef.current = null;
    };
  }, [autoStart, closeProcessor]);

  const state = useMemo(() => {
    if (error || cameraErrorKey || modelState === 'error') {
      return 'error';
    }

    if (cameraState === 'requesting' || modelState === 'loading') {
      return 'initializing';
    }

    return frame.trackingStatus || 'idle';
  }, [cameraErrorKey, cameraState, error, frame.trackingStatus, modelState]);

  return {
    videoRef,
    overlayRef,
    frame,
    cameraState,
    modelState,
    state,
    error: error || cameraErrorKey,
    start,
    stop,
    restart,
  };
}
