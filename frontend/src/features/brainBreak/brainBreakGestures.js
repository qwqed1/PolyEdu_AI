export const BRAIN_BREAK_DURATION_SECONDS = 5 * 60;
export const BRAIN_BREAK_SEQUENCE_LENGTH = 12;
export const BRAIN_BREAK_COUNTDOWN_SECONDS = 3;
export const BRAIN_BREAK_WASM_ROOT =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm';
export const BRAIN_BREAK_MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

export const BRAIN_BREAK_GESTURES = [
  {
    id: 'open-palm',
    gesture: 'Open_Palm',
    icon: '🖐️',
    accentClass: 'from-sky-500 to-cyan-500',
  },
  {
    id: 'closed-fist',
    gesture: 'Closed_Fist',
    icon: '✊',
    accentClass: 'from-amber-500 to-orange-500',
  },
  {
    id: 'pointing-up',
    gesture: 'Pointing_Up',
    icon: '☝️',
    accentClass: 'from-violet-500 to-purple-500',
  },
  {
    id: 'thumb-up',
    gesture: 'Thumb_Up',
    icon: '👍',
    accentClass: 'from-emerald-500 to-green-500',
  },
  {
    id: 'thumb-down',
    gesture: 'Thumb_Down',
    icon: '👎',
    accentClass: 'from-rose-500 to-red-500',
  },
  {
    id: 'victory',
    gesture: 'Victory',
    icon: '✌️',
    accentClass: 'from-fuchsia-500 to-pink-500',
  },
];

export const BRAIN_BREAK_GESTURE_ALLOWLIST = BRAIN_BREAK_GESTURES.map(
  (gesture) => gesture.gesture,
);

export function buildBrainBreakSequence(length = BRAIN_BREAK_SEQUENCE_LENGTH) {
  const sequence = [];
  let previousId = null;

  while (sequence.length < length) {
    const availableGestures = BRAIN_BREAK_GESTURES.filter(
      (gesture) => gesture.id !== previousId,
    );
    const nextGesture =
      availableGestures[Math.floor(Math.random() * availableGestures.length)];

    sequence.push(nextGesture);
    previousId = nextGesture.id;
  }

  return sequence;
}

export function getGestureByCategoryName(categoryName) {
  return BRAIN_BREAK_GESTURES.find((gesture) => gesture.gesture === categoryName) || null;
}
