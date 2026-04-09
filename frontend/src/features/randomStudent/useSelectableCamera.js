import { useCallback, useEffect, useState } from 'react';
import {
  RANDOM_STUDENT_CAPTURE_HEIGHT,
  RANDOM_STUDENT_CAPTURE_WIDTH,
} from './randomStudentConfig';

async function enumerateVideoDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === 'videoinput');
}

export function useSelectableCamera(videoRef) {
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
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

  const refreshCameras = useCallback(async (preferredDeviceId = '') => {
    try {
      const cameras = await enumerateVideoDevices();
      setAvailableCameras(cameras);

      if (!cameras.length) {
        setSelectedDeviceId('');
        return cameras;
      }

      const hasPreferredCamera =
        preferredDeviceId && cameras.some((camera) => camera.deviceId === preferredDeviceId);
      const hasCurrentCamera =
        selectedDeviceId && cameras.some((camera) => camera.deviceId === selectedDeviceId);

      if (hasPreferredCamera) {
        setSelectedDeviceId(preferredDeviceId);
      } else if (!hasCurrentCamera) {
        setSelectedDeviceId(cameras[0].deviceId);
      }

      return cameras;
    } catch (error) {
      console.error('Failed to enumerate video devices', error);
      return [];
    }
  }, [selectedDeviceId]);

  const requestCamera = useCallback(async (requestedDeviceId = '') => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraErrorKey('unsupportedBrowser');
      setCameraState('error');
      return { ok: false, errorKey: 'unsupportedBrowser' };
    }

    try {
      stopCamera();
      setCameraState('requesting');
      setCameraErrorKey('');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...(requestedDeviceId ? { deviceId: { exact: requestedDeviceId } } : {}),
          width: { ideal: RANDOM_STUDENT_CAPTURE_WIDTH },
          height: { ideal: RANDOM_STUDENT_CAPTURE_HEIGHT },
        },
        audio: false,
      });

      const videoElement = videoRef.current;
      if (!videoElement) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error('Video element is not available');
      }

      videoElement.srcObject = stream;
      await videoElement.play();

      const actualDeviceId =
        stream.getVideoTracks()[0]?.getSettings?.().deviceId || requestedDeviceId;
      await refreshCameras(actualDeviceId);

      if (actualDeviceId) {
        setSelectedDeviceId(actualDeviceId);
      }

      setCameraState('ready');
      return { ok: true, errorKey: '' };
    } catch (error) {
      const permissionDenied =
        error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      const unavailable =
        error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError';
      const errorKey = permissionDenied
        ? 'cameraDenied'
        : unavailable
          ? 'cameraMissing'
          : 'cameraUnavailable';

      setCameraErrorKey(errorKey);
      setCameraState('error');
      return { ok: false, errorKey };
    }
  }, [refreshCameras, stopCamera, videoRef]);

  useEffect(() => {
    refreshCameras();

    if (!navigator.mediaDevices?.addEventListener) {
      return undefined;
    }

    const handleDeviceChange = () => {
      refreshCameras();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
  }, [refreshCameras]);

  useEffect(() => stopCamera, [stopCamera]);

  return {
    availableCameras,
    selectedDeviceId,
    setSelectedDeviceId,
    cameraState,
    cameraErrorKey,
    requestCamera,
    refreshCameras,
    stopCamera,
  };
}
