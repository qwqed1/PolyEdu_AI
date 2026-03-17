import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  HAND_TRACKING_CAPTURE_HEIGHT,
  HAND_TRACKING_CAPTURE_QUALITY,
  HAND_TRACKING_CAPTURE_WIDTH,
  HAND_TRACKING_MAX_BUFFERED_BYTES,
  HAND_TRACKING_TARGET_FPS,
  HAND_TRACKING_WS_READY_TIMEOUT_MS,
  getVisionWsUrl,
} from './handTrackingConfig';
import { drawVisionOverlay } from './handLandmarkConstants';
import { useHandTrackingCamera } from './useHandTrackingCamera';

function createInitialFrame() {
  return {
    hands: [],
    primaryCursor: null,
    secondaryCursor: null,
    trackingStatus: 'idle',
    faces: 0,
    faceTrackingStatus: 'idle',
    warnings: [],
    serverFps: 0,
    timestamp: 0,
    fps: 0,
  };
}

function toFrameWithFps(frame, now, previousTimestamp) {
  const fps = previousTimestamp ? Math.round(1000 / Math.max(now - previousTimestamp, 1)) : 0;
  return {
    ...frame,
    fps,
    timestamp: frame.timestamp || now,
  };
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `vision-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read captured frame'));
    reader.readAsArrayBuffer(blob);
  });
}

function canvasToJpegBuffer(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to encode JPEG frame'));
        return;
      }

      try {
        const buffer = await blobToArrayBuffer(blob);
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    }, 'image/jpeg', quality);
  });
}

export function useHandTrackingRuntime({ autoStart = true } = {}) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const websocketRef = useRef(null);
  const animationFrameRef = useRef(null);
  const readyTimeoutRef = useRef(null);
  const sendingRef = useRef(false);
  const runningRef = useRef(false);
  const pythonReadyRef = useRef(false);
  const sessionIdRef = useRef(createSessionId());
  const lastSentAtRef = useRef(0);
  const lastEmitRef = useRef(0);
  const lastRenderTimestampRef = useRef(0);
  const manualStopRef = useRef(false);
  const {
    cameraState,
    cameraErrorKey,
    requestCamera,
    stopCamera,
  } = useHandTrackingCamera(videoRef);
  const [frame, setFrame] = useState(() => createInitialFrame());
  const [wsState, setWsState] = useState('idle');
  const [modelState, setModelState] = useState('idle');
  const [pythonState, setPythonState] = useState('idle');
  const [error, setError] = useState('');

  const syncOverlaySize = useCallback(() => {
    const overlayElement = overlayRef.current;
    const videoElement = videoRef.current;

    if (!overlayElement || !videoElement?.videoWidth || !videoElement?.videoHeight) {
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

  const clearOverlay = useCallback(() => {
    const overlayElement = overlayRef.current;
    const context = overlayElement?.getContext('2d');
    if (!overlayElement || !context) {
      return;
    }

    context.clearRect(0, 0, overlayElement.width, overlayElement.height);
  }, []);

  const stopLoop = useCallback(() => {
    runningRef.current = false;
    sendingRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    pythonReadyRef.current = false;
    lastSentAtRef.current = 0;
    lastEmitRef.current = 0;
    lastRenderTimestampRef.current = 0;
    setPythonState('idle');
    setFrame(createInitialFrame());
    clearOverlay();
  }, [clearOverlay]);

  const cleanupSocket = useCallback((options = {}) => {
    const { suppressCloseError = true } = options;
    const socket = websocketRef.current;
    websocketRef.current = null;

    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }

    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    }

    if (!suppressCloseError && !manualStopRef.current && !error) {
      setError('wsDisconnected');
    }
  }, [error]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    stopLoop();
    cleanupSocket();
    stopCamera();
    setWsState('idle');
    setModelState('idle');
    setError('');
    resetState();
  }, [cleanupSocket, resetState, stopCamera, stopLoop]);

  const handleVisionFrame = useCallback((payload) => {
    const nextFrame = {
      hands: payload.hands || [],
      primaryCursor: payload.primaryCursor || null,
      secondaryCursor: payload.secondaryCursor || null,
      trackingStatus: payload.trackingStatus || ((payload.hands || []).length ? 'tracking' : 'searching'),
      faces: 0,
      faceTrackingStatus: 'idle',
      warnings: payload.warnings || [],
      serverFps: payload.serverFps || 0,
      timestamp: payload.timestamp || Date.now(),
    };

    const now = performance.now();
    setFrame(toFrameWithFps(nextFrame, now, lastRenderTimestampRef.current));
    lastEmitRef.current = now;
    lastRenderTimestampRef.current = now;
    sendingRef.current = false;

    syncOverlaySize();
    drawVisionOverlay(overlayRef.current, nextFrame.hands);
  }, [syncOverlaySize]);

  const connectVisionSocket = useCallback(() => new Promise((resolve, reject) => {
    const wsUrl = getVisionWsUrl();
    if (!wsUrl) {
      reject(new Error('Vision WebSocket URL is not configured'));
      return;
    }

    setWsState('connecting');
    setModelState('loading');
    setPythonState('loading');

    let settled = false;
    const socket = new WebSocket(wsUrl);
    socket.binaryType = 'arraybuffer';
    websocketRef.current = socket;

    const fail = (reason) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanupSocket();
      reject(reason);
    };

    readyTimeoutRef.current = setTimeout(() => {
      fail(new Error('Vision service did not become ready in time'));
    }, HAND_TRACKING_WS_READY_TIMEOUT_MS);

    socket.onopen = () => {
      setWsState('connected');

      const videoElement = videoRef.current;
      socket.send(JSON.stringify({
        type: 'hello',
        sessionId: sessionIdRef.current,
        mode: 'lab-arena',
        width: videoElement?.videoWidth || HAND_TRACKING_CAPTURE_WIDTH,
        height: videoElement?.videoHeight || HAND_TRACKING_CAPTURE_HEIGHT,
        fpsTarget: HAND_TRACKING_TARGET_FPS,
      }));
    };

    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'ready') {
          pythonReadyRef.current = true;
          setModelState('ready');
          setPythonState('ready');
          if (readyTimeoutRef.current) {
            clearTimeout(readyTimeoutRef.current);
            readyTimeoutRef.current = null;
          }
          if (!settled) {
            settled = true;
            resolve(socket);
          }
          return;
        }

        if (payload.type === 'vision_frame') {
          handleVisionFrame(payload);
        }
      } catch (parseError) {
        console.error('Failed to parse vision payload', parseError);
      }
    };

    socket.onerror = () => {
      fail(new Error('Vision service connection failed'));
    };

    socket.onclose = () => {
      if (!settled) {
        fail(new Error('Vision service connection closed before ready'));
        return;
      }

      cleanupSocket({ suppressCloseError: false });
      if (!manualStopRef.current) {
        setWsState('disconnected');
        setModelState('error');
        setPythonState('error');
        setError('wsDisconnected');
        stopLoop();
      }
    };
  }), [cleanupSocket, handleVisionFrame, stopLoop]);

  const sendNextFrame = useCallback(async () => {
    const socket = websocketRef.current;
    const videoElement = videoRef.current;

    if (
      !runningRef.current ||
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      !pythonReadyRef.current ||
      !videoElement ||
      videoElement.readyState < 2
    ) {
      return;
    }

    const now = performance.now();
    const minInterval = 1000 / HAND_TRACKING_TARGET_FPS;
    if (now - lastSentAtRef.current < minInterval) {
      return;
    }

    if (sendingRef.current || socket.bufferedAmount > HAND_TRACKING_MAX_BUFFERED_BYTES) {
      return;
    }

    const captureCanvas = captureCanvasRef.current || document.createElement('canvas');
    captureCanvasRef.current = captureCanvas;
    captureCanvas.width = HAND_TRACKING_CAPTURE_WIDTH;
    captureCanvas.height = HAND_TRACKING_CAPTURE_HEIGHT;

    const context = captureCanvas.getContext('2d', { willReadFrequently: false });
    if (!context) {
      setError('pythonUnavailable');
      setModelState('error');
      stopLoop();
      return;
    }

    context.drawImage(videoElement, 0, 0, captureCanvas.width, captureCanvas.height);
    sendingRef.current = true;
    lastSentAtRef.current = now;

    try {
      const frameBuffer = await canvasToJpegBuffer(captureCanvas, HAND_TRACKING_CAPTURE_QUALITY);
      if (!runningRef.current || socket.readyState !== WebSocket.OPEN) {
        sendingRef.current = false;
        return;
      }

      socket.send(frameBuffer);
    } catch (frameError) {
      console.error('Failed to capture vision frame', frameError);
      sendingRef.current = false;
      setError('pythonUnavailable');
      setModelState('error');
      stopLoop();
    }
  }, [stopLoop]);

  const startLoop = useCallback(() => {
    if (runningRef.current) {
      return;
    }

    runningRef.current = true;

    const tick = async () => {
      if (!runningRef.current) {
        animationFrameRef.current = null;
        return;
      }

      await sendNextFrame();
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [sendNextFrame]);

  const start = useCallback(async () => {
    manualStopRef.current = false;
    setError('');
    resetState();

    const camera = await requestCamera();
    if (!camera.ok) {
      setError(camera.errorKey || 'cameraUnavailable');
      return false;
    }

    try {
      await connectVisionSocket();
      startLoop();
      return true;
    } catch (connectionError) {
      console.error('Vision runtime failed to start', connectionError);
      setWsState('error');
      setModelState('error');
      setPythonState('error');
      setError('pythonUnavailable');
      stopCamera();
      return false;
    }
  }, [connectVisionSocket, requestCamera, resetState, startLoop, stopCamera]);

  const restart = useCallback(async () => {
    stop();
    return start();
  }, [start, stop]);

  useEffect(() => {
    if (!autoStart) {
      return undefined;
    }

    const timerId = setTimeout(() => {
      start();
    }, 0);

    return () => {
      clearTimeout(timerId);
      stop();
    };
  }, [autoStart, start, stop]);

  const state = useMemo(() => {
    if (error || cameraErrorKey || wsState === 'error' || modelState === 'error') {
      return 'error';
    }

    if (
      cameraState === 'requesting' ||
      wsState === 'connecting' ||
      modelState === 'loading'
    ) {
      return 'initializing';
    }

    return frame.trackingStatus || 'idle';
  }, [cameraErrorKey, cameraState, error, frame.trackingStatus, modelState, wsState]);

  return {
    videoRef,
    overlayRef,
    frame,
    cameraState,
    modelState,
    wsState,
    pythonState,
    trackingState: state,
    state,
    errorKey: error || cameraErrorKey,
    error: error || cameraErrorKey,
    start,
    stop,
    restart,
  };
}
