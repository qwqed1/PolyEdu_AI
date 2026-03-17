import { Eraser, PenTool, ScanSearch, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import HandTrackingStage from '../../../features/handTracking/HandTrackingStage';
import { useHandTrackingRuntime } from '../../../features/handTracking/useHandTrackingRuntime';
import mathHandwritingService from '../../../services/mathHandwritingService';

const BOARD_RECT = { x: 0.06, y: 0.12, w: 0.88, h: 0.76 };

function isPointInsideBoard(point) {
  return (
    point.x >= BOARD_RECT.x &&
    point.x <= BOARD_RECT.x + BOARD_RECT.w &&
    point.y >= BOARD_RECT.y &&
    point.y <= BOARD_RECT.y + BOARD_RECT.h
  );
}

function renderStrokesToImage(strokes) {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 900;
  const context = canvas.getContext('2d');

  if (!context) {
    return '';
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = '#111827';
  context.lineWidth = 12;

  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) {
      return;
    }

    context.beginPath();
    stroke.points.forEach((point, index) => {
      const localX = (point.x - BOARD_RECT.x) / BOARD_RECT.w;
      const localY = (point.y - BOARD_RECT.y) / BOARD_RECT.h;
      const canvasX = 120 + localX * (canvas.width - 240);
      const canvasY = 120 + localY * (canvas.height - 240);

      if (index === 0) {
        context.moveTo(canvasX, canvasY);
      } else {
        context.lineTo(canvasX, canvasY);
      }
    });
    context.stroke();
  });

  return canvas.toDataURL('image/png');
}

export default function AirBoardPanel({ formulaValue, setFormulaValue, language }) {
  const { t } = useLanguage();
  const runtime = useHandTrackingRuntime();
  const stageRef = useRef(null);
  const activeStrokeIdsRef = useRef({});
  const [strokes, setStrokes] = useState([]);
  const [recognition, setRecognition] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionError, setRecognitionError] = useState('');
  const copy = t.handLab.common;
  const mathCopy = t.handLab.math;

  useEffect(() => {
    setStrokes((previousStrokes) => {
      let didChange = false;
      let nextStrokes = previousStrokes;

      Object.keys(activeStrokeIdsRef.current).forEach((handId) => {
        const hand = runtime.frame.hands.find((entry) => entry.id === handId);
        if (!hand || hand.pinchState !== 'pinching') {
          delete activeStrokeIdsRef.current[handId];
        }
      });

      runtime.frame.hands.forEach((hand) => {
        if (hand.pinchState !== 'pinching' || !isPointInsideBoard(hand.cursor)) {
          delete activeStrokeIdsRef.current[hand.id];
          return;
        }

        if (!activeStrokeIdsRef.current[hand.id]) {
          if (!didChange) {
            nextStrokes = previousStrokes.map((stroke) => ({ ...stroke, points: [...stroke.points] }));
            didChange = true;
          }

          const strokeId = `${hand.id}-${runtime.frame.timestamp}`;
          activeStrokeIdsRef.current[hand.id] = strokeId;
          nextStrokes.push({
            id: strokeId,
            handId: hand.id,
            points: [hand.cursor],
          });
          return;
        }

        if (!didChange) {
          nextStrokes = previousStrokes.map((stroke) => ({ ...stroke, points: [...stroke.points] }));
          didChange = true;
        }

        const strokeIndex = nextStrokes.findIndex((stroke) => stroke.id === activeStrokeIdsRef.current[hand.id]);
        if (strokeIndex >= 0) {
          const stroke = nextStrokes[strokeIndex];
          const lastPoint = stroke.points[stroke.points.length - 1];
          if (!lastPoint || Math.hypot(lastPoint.x - hand.cursor.x, lastPoint.y - hand.cursor.y) > 0.002) {
            nextStrokes[strokeIndex] = {
              ...stroke,
              points: [...stroke.points, hand.cursor],
            };
          }
        }
      });

      return didChange ? nextStrokes : previousStrokes;
    });
  }, [runtime.frame.hands, runtime.frame.timestamp]);

  const hasInk = strokes.some((stroke) => stroke.points.length > 1);
  const recognizedValue = recognition?.latex || recognition?.text || '';

  const boardPaths = useMemo(
    () =>
      strokes
        .filter((stroke) => stroke.points.length > 1)
        .map((stroke) => ({
          id: stroke.id,
          d: stroke.points
            .map((point, index) => {
              const x = point.x * 100;
              const y = point.y * 100;
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' '),
        })),
    [strokes],
  );

  const clearBoard = () => {
    activeStrokeIdsRef.current = {};
    setStrokes([]);
    setRecognition(null);
    setRecognitionError('');
  };

  const recognizeBoard = async () => {
    if (!hasInk) {
      return;
    }

    setRecognizing(true);
    setRecognitionError('');

    try {
      const imageDataUrl = renderStrokesToImage(strokes);
      const response = await mathHandwritingService.recognize(imageDataUrl, language);
      setRecognition(response);
    } catch (error) {
      setRecognitionError(error.message);
    } finally {
      setRecognizing(false);
    }
  };

  const insertIntoFormula = () => {
    if (!recognizedValue) {
      return;
    }

    setFormulaValue((previous) => (previous ? `${previous} ${recognizedValue}` : recognizedValue));
  };

  return (
    <HandTrackingStage
      title={mathCopy.title}
      description={mathCopy.description}
      badge={mathCopy.badge}
      accentClass="from-slate-950 via-violet-950 to-fuchsia-950"
      videoRef={runtime.videoRef}
      overlayRef={runtime.overlayRef}
      cameraState={runtime.cameraState}
      modelState={runtime.modelState}
      trackingState={runtime.trackingState}
      errorKey={runtime.errorKey}
      onRetry={runtime.restart}
      hands={runtime.frame.hands}
      frame={runtime.frame}
      copy={copy}
      instructions={mathCopy.instructions}
      stageRef={stageRef}
      footer={(
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearBoard}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Eraser className="h-4 w-4" />
              {mathCopy.clear}
            </button>
            <button
              type="button"
              onClick={recognizeBoard}
              disabled={!hasInk || recognizing}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
            >
              <ScanSearch className="h-4 w-4" />
              {recognizing ? mathCopy.recognizing : mathCopy.recognize}
            </button>
            <button
              type="button"
              onClick={insertIntoFormula}
              disabled={!recognizedValue}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              <Sparkles className="h-4 w-4" />
              {mathCopy.insert}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-neutral-200 bg-white p-4 dark:border-dark-border dark:bg-dark-surface">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-300">
                <PenTool className="h-4 w-4" />
                {mathCopy.recognitionTitle}
              </div>
              <div className="mt-3 min-h-20 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:bg-dark-bg dark:text-neutral-200">
                {recognitionError || recognizedValue || mathCopy.emptyRecognition}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-4 dark:border-dark-border dark:bg-dark-surface">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-300">
                <Sparkles className="h-4 w-4" />
                {mathCopy.formulaTitle}
              </div>
              <div className="mt-3 min-h-20 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:bg-dark-bg dark:text-neutral-200">
                {formulaValue || mathCopy.emptyFormula}
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.2),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.16),_transparent_28%)]" />

      <div className="absolute left-6 top-6 z-10 max-w-xs rounded-3xl border border-white/10 bg-black/30 px-5 py-4 text-white backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-200/80">
          {mathCopy.stageLabel}
        </div>
        <div className="mt-2 text-2xl font-bold">{mathCopy.stageTitle}</div>
        <p className="mt-2 text-sm leading-6 text-white/75">{mathCopy.stageHint}</p>
      </div>

      <div
        className="absolute rounded-[2.5rem] border border-dashed border-white/30 bg-white/5"
        style={{
          left: `${BOARD_RECT.x * 100}%`,
          top: `${BOARD_RECT.y * 100}%`,
          width: `${BOARD_RECT.w * 100}%`,
          height: `${BOARD_RECT.h * 100}%`,
        }}
      />

      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        {boardPaths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            fill="none"
            stroke="#f8fafc"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="0.65"
          />
        ))}
      </svg>
    </HandTrackingStage>
  );
}
