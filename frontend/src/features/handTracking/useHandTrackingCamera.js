import { useCallback, useEffect, useState } from 'react';

export function useHandTrackingCamera(videoRef) {
  const [cameraState, setCameraState] = useState('idle');
  const [cameraErrorKey, setCameraErrorKey] = useState('');

  const stopCamera = useCallback(() => {
    const videoElement = videoRef.current;
    const activeStream = videoElement?.srcObject;

    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
    }

    if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
    }

    setCameraState('idle');
    setCameraErrorKey('');
  }, [videoRef]);

  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error');
      setCameraErrorKey('unsupportedBrowser');
      return { ok: false, errorKey: 'unsupportedBrowser' };
    }

    setCameraState('requesting');
    setCameraErrorKey('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      const videoElement = videoRef.current;
      if (!videoElement) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('Video element is unavailable');
      }

      videoElement.srcObject = stream;
      await videoElement.play();
      setCameraState('ready');
      return { ok: true, errorKey: '' };
    } catch (error) {
      const permissionDenied =
        error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      const errorKey = permissionDenied ? 'cameraDenied' : 'cameraUnavailable';
      setCameraState('error');
      setCameraErrorKey(errorKey);
      return { ok: false, errorKey };
    }
  }, [videoRef]);

  useEffect(() => stopCamera, [stopCamera]);

  return {
    cameraState,
    cameraErrorKey,
    requestCamera,
    stopCamera,
  };
}
