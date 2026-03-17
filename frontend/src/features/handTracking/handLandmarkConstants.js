export const HAND_CONNECTIONS = [
  { start: 0, end: 1 },
  { start: 1, end: 2 },
  { start: 2, end: 3 },
  { start: 3, end: 4 },
  { start: 0, end: 5 },
  { start: 5, end: 6 },
  { start: 6, end: 7 },
  { start: 7, end: 8 },
  { start: 5, end: 9 },
  { start: 9, end: 10 },
  { start: 10, end: 11 },
  { start: 11, end: 12 },
  { start: 9, end: 13 },
  { start: 13, end: 14 },
  { start: 14, end: 15 },
  { start: 15, end: 16 },
  { start: 13, end: 17 },
  { start: 17, end: 18 },
  { start: 18, end: 19 },
  { start: 19, end: 20 },
  { start: 0, end: 17 },
];

export function drawVisionOverlay(canvasElement, hands = []) {
  if (!canvasElement) {
    return;
  }

  const context = canvasElement.getContext('2d');
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvasElement.width, canvasElement.height);

  hands.forEach((hand, handIndex) => {
    const stroke = handIndex === 0 ? 'rgba(34, 211, 238, 0.95)' : 'rgba(251, 113, 133, 0.95)';
    const fill = hand.pinchState === 'pinching'
      ? 'rgba(245, 158, 11, 0.96)'
      : handIndex === 0
        ? 'rgba(34, 211, 238, 0.94)'
        : 'rgba(251, 113, 133, 0.94)';

    context.strokeStyle = stroke;
    context.fillStyle = fill;
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    HAND_CONNECTIONS.forEach((connection) => {
      const startPoint = hand.landmarks?.[connection.start];
      const endPoint = hand.landmarks?.[connection.end];

      if (!startPoint || !endPoint) {
        return;
      }

      context.beginPath();
      context.moveTo(startPoint.x * canvasElement.width, startPoint.y * canvasElement.height);
      context.lineTo(endPoint.x * canvasElement.width, endPoint.y * canvasElement.height);
      context.stroke();
    });

    hand.landmarks?.forEach((landmark, landmarkIndex) => {
      context.beginPath();
      context.arc(
        landmark.x * canvasElement.width,
        landmark.y * canvasElement.height,
        landmarkIndex === 8 ? 7 : 4,
        0,
        Math.PI * 2,
      );
      context.fill();
    });
  });
}
