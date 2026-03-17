import {
  BRAIN_BREAK_COUNTDOWN_SECONDS,
  BRAIN_BREAK_DURATION_SECONDS,
  buildBrainBreakSequence,
} from './brainBreakGestures';

export const BRAIN_BREAK_SESSION_STATUS = {
  idle: 'idle',
  permission: 'permission',
  countdown: 'countdown',
  running: 'running',
  paused: 'paused',
  completed: 'completed',
  aborted: 'aborted',
  error: 'error',
};

export const BRAIN_BREAK_MATCH_STATE = {
  waiting: 'waiting',
  tracking: 'tracking',
  matched: 'matched',
  missing: 'missing',
  misaligned: 'misaligned',
};

export const MIN_GESTURE_CONFIDENCE = 0.7;
export const REQUIRED_CONSECUTIVE_MATCHES = 5;
export const LOW_LIGHT_THRESHOLD_MS = 5000;

export function createInitialBrainBreakSession(sequence = buildBrainBreakSequence()) {
  return {
    status: BRAIN_BREAK_SESSION_STATUS.idle,
    timeLeft: BRAIN_BREAK_DURATION_SECONDS,
    countdownLeft: BRAIN_BREAK_COUNTDOWN_SECONDS,
    gestureSequence: sequence,
    currentGestureIndex: 0,
    completedCount: 0,
    matchState: BRAIN_BREAK_MATCH_STATE.waiting,
    lastDetection: null,
    hintKey: 'ready',
    errorKey: '',
  };
}

export function normalizeDetectionResult(result) {
  const landmarks = result?.landmarks?.[0] ?? [];
  const primaryGesture = result?.gestures?.[0]?.[0] ?? null;
  const handedness = result?.handedness?.[0]?.[0]?.displayName ?? '';
  const hasHand = landmarks.length > 0;

  if (!hasHand) {
    return {
      detectedGesture: null,
      confidence: 0,
      handedness,
      hasHand: false,
      landmarks: [],
      isCentered: false,
      bounds: null,
    };
  }

  const bounds = landmarks.reduce(
    (accumulator, landmark) => ({
      minX: Math.min(accumulator.minX, landmark.x),
      maxX: Math.max(accumulator.maxX, landmark.x),
      minY: Math.min(accumulator.minY, landmark.y),
      maxY: Math.max(accumulator.maxY, landmark.y),
    }),
    { minX: 1, maxX: 0, minY: 1, maxY: 0 },
  );

  const isCentered =
    bounds.minX > 0.02 &&
    bounds.maxX < 0.98 &&
    bounds.minY > 0.02 &&
    bounds.maxY < 0.98;

  return {
    detectedGesture: primaryGesture?.categoryName ?? null,
    confidence: primaryGesture?.score ?? 0,
    handedness,
    hasHand,
    landmarks,
    isCentered,
    bounds,
  };
}

export function evaluateGestureMatch({ detection, targetGesture, streak, now, lastHandSeenAt }) {
  if (!detection?.hasHand) {
    const noHandFor = lastHandSeenAt ? now - lastHandSeenAt : 0;

    return {
      matchState: BRAIN_BREAK_MATCH_STATE.missing,
      streak: 0,
      confirmed: false,
      hintKey: noHandFor >= LOW_LIGHT_THRESHOLD_MS ? 'lowLight' : 'showHand',
    };
  }

  if (!detection.isCentered) {
    return {
      matchState: BRAIN_BREAK_MATCH_STATE.misaligned,
      streak: 0,
      confirmed: false,
      hintKey: 'centerHand',
    };
  }

  if (detection.detectedGesture !== targetGesture) {
    return {
      matchState: BRAIN_BREAK_MATCH_STATE.tracking,
      streak: 0,
      confirmed: false,
      hintKey: 'copyGesture',
    };
  }

  if (detection.confidence < MIN_GESTURE_CONFIDENCE) {
    return {
      matchState: BRAIN_BREAK_MATCH_STATE.tracking,
      streak: Math.max(streak - 1, 0),
      confirmed: false,
      hintKey: 'holdSteady',
    };
  }

  const nextStreak = streak + 1;
  const confirmed = nextStreak >= REQUIRED_CONSECUTIVE_MATCHES;

  return {
    matchState: BRAIN_BREAK_MATCH_STATE.matched,
    streak: nextStreak,
    confirmed,
    hintKey: confirmed ? 'greatJob' : 'holdSteady',
  };
}

export function formatBrainBreakTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.max(totalSeconds % 60, 0)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}
