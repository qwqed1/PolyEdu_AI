import { HandLandmarker } from '@mediapipe/tasks-vision';
import {
  ArrowLeft,
  Atom,
  BatteryCharging,
  Clock3,
  Lightbulb,
  PencilLine,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useInteractiveHandScene } from '../../features/handTracking/useInteractiveHandScene';
import { useHandTrackingRuntime } from '../../features/handTracking/useHandTrackingRuntime';
import mathHandwritingService from '../../services/mathHandwritingService';

const ROUND_SECONDS = 180;
const BOARD_RECT = { x: 0.08, y: 0.14, w: 0.84, h: 0.72 };

const CHEMISTRY_SCENE = {
  objects: [
    {
      id: 'hydrogen-a',
      kind: 'hydrogen',
      symbol: 'H',
      position: { x: 0.08, y: 0.2 },
      size: { w: 0.1, h: 0.1 },
      accent: 'from-sky-400 to-cyan-500',
    },
    {
      id: 'oxygen-core',
      kind: 'oxygen',
      symbol: 'O',
      position: { x: 0.08, y: 0.43 },
      size: { w: 0.12, h: 0.12 },
      accent: 'from-rose-500 to-orange-500',
    },
    {
      id: 'hydrogen-b',
      kind: 'hydrogen',
      symbol: 'H',
      position: { x: 0.08, y: 0.68 },
      size: { w: 0.1, h: 0.1 },
      accent: 'from-sky-400 to-cyan-500',
    },
  ],
  snapZones: [
    { id: 'left-h', accepts: ['hydrogen'], x: 0.5, y: 0.38, w: 0.12, h: 0.12 },
    { id: 'center-o', accepts: ['oxygen'], x: 0.62, y: 0.34, w: 0.16, h: 0.16 },
    { id: 'right-h', accepts: ['hydrogen'], x: 0.78, y: 0.38, w: 0.12, h: 0.12 },
  ],
  isComplete(objects) {
    const zoneMap = objects.reduce((accumulator, object) => {
      if (object.snappedZoneId) {
        accumulator[object.snappedZoneId] = object.kind;
      }
      return accumulator;
    }, {});

    return zoneMap['center-o'] === 'oxygen' && zoneMap['left-h'] === 'hydrogen' && zoneMap['right-h'] === 'hydrogen';
  },
};

const PHYSICS_SCENE = {
  objects: [
    {
      id: 'battery',
      kind: 'battery',
      label: '9V',
      position: { x: 0.08, y: 0.2 },
      size: { w: 0.15, h: 0.12 },
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'lamp',
      kind: 'lamp',
      label: 'Bulb',
      position: { x: 0.08, y: 0.42 },
      size: { w: 0.15, h: 0.12 },
      accent: 'from-amber-400 to-orange-500',
    },
    {
      id: 'wire-top',
      kind: 'wire',
      label: 'Wire A',
      position: { x: 0.08, y: 0.64 },
      size: { w: 0.2, h: 0.1 },
      accent: 'from-sky-500 to-cyan-500',
    },
    {
      id: 'wire-bottom',
      kind: 'wire',
      label: 'Wire B',
      position: { x: 0.08, y: 0.79 },
      size: { w: 0.2, h: 0.1 },
      accent: 'from-indigo-500 to-violet-500',
    },
  ],
  snapZones: [
    { id: 'zone-battery', accepts: ['battery'], x: 0.5, y: 0.22, w: 0.17, h: 0.12 },
    { id: 'zone-wire-top', accepts: ['wire'], x: 0.68, y: 0.12, w: 0.19, h: 0.1 },
    { id: 'zone-lamp', accepts: ['lamp'], x: 0.77, y: 0.34, w: 0.14, h: 0.14 },
    { id: 'zone-wire-bottom', accepts: ['wire'], x: 0.64, y: 0.64, w: 0.22, h: 0.1 },
  ],
  isComplete(objects) {
    const battery = objects.find((object) => object.id === 'battery');
    const lamp = objects.find((object) => object.id === 'lamp');
    const topWire = objects.find((object) => object.id === 'wire-top');
    const bottomWire = objects.find((object) => object.id === 'wire-bottom');

    return (
      battery?.snappedZoneId === 'zone-battery' &&
      lamp?.snappedZoneId === 'zone-lamp' &&
      topWire?.snappedZoneId === 'zone-wire-top' &&
      bottomWire?.snappedZoneId === 'zone-wire-bottom'
    );
  },
};

function formatTime(value) {
  const safe = Math.max(value, 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

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
  context.strokeStyle = '#111827';
  context.lineCap = 'round';
  context.lineJoin = 'round';
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

function HandGhostLayer({ hands }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full pointer-events-none">
      {hands.map((hand, index) => (
        <g key={hand.id}>
          {HandLandmarker.HAND_CONNECTIONS.map(([start, end]) => {
            const startPoint = hand.landmarks[start];
            const endPoint = hand.landmarks[end];
            if (!startPoint || !endPoint) {
              return null;
            }

            return (
              <line
                key={`${hand.id}-${start}-${end}`}
                x1={startPoint.x * 100}
                y1={startPoint.y * 100}
                x2={endPoint.x * 100}
                y2={endPoint.y * 100}
                stroke={index === 0 ? '#67e8f9' : '#fda4af'}
                strokeWidth="0.45"
                strokeLinecap="round"
              />
            );
          })}

          {hand.landmarks.map((landmark, landmarkIndex) => (
            <circle
              key={`${hand.id}-${landmarkIndex}`}
              cx={landmark.x * 100}
              cy={landmark.y * 100}
              r={landmarkIndex === 8 ? '0.9' : '0.55'}
              fill={hand.pinchState === 'pinching' ? '#f59e0b' : index === 0 ? '#22d3ee' : '#fb7185'}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

function HandCursorLayer({ hands }) {
  return (
    <>
      {hands.map((hand, index) => (
        <div
          key={`${hand.id}-cursor`}
          className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${hand.cursor.x * 100}%`,
            top: `${hand.cursor.y * 100}%`,
          }}
        >
          <div
            className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-[0_0_26px_rgba(0,0,0,0.45)] ${
              hand.pinchState === 'pinching'
                ? 'border-amber-300 bg-amber-500/75'
                : index === 0
                  ? 'border-cyan-300 bg-cyan-500/65'
                  : 'border-pink-300 bg-pink-500/65'
            }`}
          >
            {index === 0 ? 'H1' : 'H2'}
            <span
              className={`absolute inset-0 rounded-full ${
                hand.pinchState === 'pinching'
                  ? 'animate-ping bg-amber-300/35'
                  : 'bg-transparent'
              }`}
            />
          </div>
        </div>
      ))}
    </>
  );
}

function getTrackingErrorText(language, errorKey) {
  const isKk = language === 'kk';
  const errorMap = {
    unsupportedBrowser: isKk
      ? 'Бұл браузерде камера/MediaPipe қолдауы жоқ. Chrome немесе Edge қолданыңыз.'
      : 'Этот браузер не поддерживает камеру/MediaPipe. Используйте Chrome или Edge.',
    cameraDenied: isKk
      ? 'Камера рұқсаты берілмеді. Браузерден камераға рұқсат беріп, қайта қосыңыз.'
      : 'Доступ к камере отклонён. Разрешите камеру в браузере и перезапустите.',
    cameraUnavailable: isKk
      ? 'Камераға қосылу мүмкін болмады. Басқа қолданба камераны ұстап тұрмауы керек.'
      : 'Не удалось подключиться к камере. Проверьте, что камера не занята другим приложением.',
    modelUnavailable: isKk
      ? 'Hand-tracking моделі жүктелмеді. Интернетті тексеріп, қайта іске қосыңыз.'
      : 'Не удалось загрузить модель hand-tracking. Проверьте интернет и нажмите повтор.',
  };

  return (
    errorMap[errorKey] ||
    (isKk ? 'Hand-tracking іске қосылмады. Қайталап көріңіз.' : 'Не удалось запустить hand-tracking. Попробуйте ещё раз.')
  );
}

function Zone({ zone, filled, label }) {
  return (
    <div
      className={`absolute rounded-[1.6rem] border border-dashed transition-all ${filled ? 'border-emerald-300 bg-emerald-400/20' : 'border-white/30 bg-white/5'}`}
      style={{
        left: `${zone.x * 100}%`,
        top: `${zone.y * 100}%`,
        width: `${zone.w * 100}%`,
        height: `${zone.h * 100}%`,
      }}
    >
      <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
        {label}
      </div>
    </div>
  );
}

function SceneObject({ object }) {
  return (
    <div
      className="absolute z-20 transition-transform duration-150"
      style={{
        left: `${object.position.x * 100}%`,
        top: `${object.position.y * 100}%`,
        width: `${object.size.w * 100}%`,
        height: `${object.size.h * 100}%`,
      }}
    >
      <div className={`flex h-full w-full items-center justify-center rounded-[1.4rem] border border-white/15 bg-gradient-to-br ${object.accent} px-3 text-sm font-bold text-white shadow-[0_16px_36px_rgba(2,6,23,0.45)]`}>
        {object.symbol || object.label}
      </div>
    </div>
  );
}

function getModeCopy(language, mode) {
  const isKk = language === 'kk';
  const byMode = {
    chemistry: {
      title: isKk ? 'Қолмен химия аренаcы' : 'Химия hand-арена',
      subtitle: isKk
        ? 'Камера тек қол нүктелерін ұстайды. Сіз көрінбейсіз, тек интерактив элементтері мен қол skeleton-ы көрінеді.'
        : 'Камера ловит только точки рук. Вас в кадре не видно, на сцене только фон, объекты и скелет рук.',
      objective: isKk ? 'H₂O молекуласын жинаңыз' : 'Соберите молекулу H₂O',
      bg: 'from-[#001b4a] via-[#00337a] to-[#0e7490]',
      surface: 'bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.26),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,116,144,0.34),_transparent_42%)]',
    },
    physics: {
      title: isKk ? 'Қолмен физика аренаcы' : 'Физика hand-арена',
      subtitle: isKk
        ? 'Қолмен элементтерді жылжытып, шам жанатын тұйық тізбек құрыңыз.'
        : 'Перемещайте элементы руками и соберите замкнутую цепь, чтобы загорелась лампа.',
      objective: isKk ? 'Электр тізбегін тұйықтаңыз' : 'Замкните электрическую цепь',
      bg: 'from-[#4a0000] via-[#7f1d1d] to-[#b45309]',
      surface: 'bg-[radial-gradient(circle_at_top_left,_rgba(252,165,165,0.2),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.24),_transparent_42%)]',
    },
    math: {
      title: isKk ? 'Қолмен математика аренаcы' : 'Математика hand-арена',
      subtitle: isKk
        ? 'Ауада жазыңыз: pinch арқылы виртуалды қаламды қосып, OCR арқылы формулаға аударыңыз.'
        : 'Пишите в воздухе: pinch включает виртуальную ручку, OCR переводит запись в формулу.',
      objective: isKk ? 'Тақтаға формула жазыңыз' : 'Напишите формулу на доске',
      bg: 'from-[#2b1055] via-[#4c1d95] to-[#7e22ce]',
      surface: 'bg-[radial-gradient(circle_at_top_left,_rgba(216,180,254,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.22),_transparent_42%)]',
    },
  };

  return byMode[mode];
}

export default function LabArenaPage() {
  const { mode } = useParams();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const runtime = useHandTrackingRuntime();
  const isModeValid = ['chemistry', 'physics', 'math'].includes(mode || '');
  const activeMode = isModeValid ? mode : 'chemistry';
  const copy = getModeCopy(language, activeMode);
  const subjectFromQuery = searchParams.get('subject');
  const subjectForBack = subjectFromQuery || (activeMode === 'math' ? 'mathematics' : activeMode);

  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [flashText, setFlashText] = useState('');
  const [strokes, setStrokes] = useState([]);
  const [recognition, setRecognition] = useState('');
  const [recognitionError, setRecognitionError] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const activeStrokeIdsRef = useRef({});
  const chemistryLockRef = useRef(false);
  const physicsLockRef = useRef(false);

  const chemistryState = useInteractiveHandScene({
    scene: CHEMISTRY_SCENE,
    hands: activeMode === 'chemistry' ? runtime.frame.hands : [],
  });
  const physicsState = useInteractiveHandScene({
    scene: PHYSICS_SCENE,
    hands: activeMode === 'physics' ? runtime.frame.hands : [],
  });
  const {
    objects: chemistryObjects,
    isComplete: chemistryComplete,
    resetScene: resetChemistryScene,
  } = chemistryState;
  const {
    objects: physicsObjects,
    isComplete: physicsComplete,
    resetScene: resetPhysicsScene,
  } = physicsState;
  const isInitializing = runtime.trackingState === 'initializing';
  const isTrackingError = runtime.trackingState === 'error';

  useEffect(() => {
    setTimeLeft(ROUND_SECONDS);
    setScore(0);
    setFlashText('');
    setStrokes([]);
    setRecognition('');
    setRecognitionError('');
    activeStrokeIdsRef.current = {};
    chemistryLockRef.current = false;
    physicsLockRef.current = false;
    resetChemistryScene();
    resetPhysicsScene();
  }, [activeMode, resetChemistryScene, resetPhysicsScene]);

  useEffect(() => {
    if (timeLeft <= 0) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [timeLeft]);

  useEffect(() => {
    if (activeMode !== 'chemistry') {
      return;
    }

    if (chemistryComplete && !chemistryLockRef.current) {
      chemistryLockRef.current = true;
      setScore((previous) => previous + 10);
      setFlashText(language === 'kk' ? '+10 ұпай: молекула жиналды' : '+10 очков: молекула собрана');
      const resetId = window.setTimeout(() => {
        resetChemistryScene();
        chemistryLockRef.current = false;
      }, 700);
      const flashId = window.setTimeout(() => setFlashText(''), 1400);
      return () => {
        window.clearTimeout(resetId);
        window.clearTimeout(flashId);
      };
    }
  }, [activeMode, chemistryComplete, language, resetChemistryScene]);

  useEffect(() => {
    if (activeMode !== 'physics') {
      return;
    }

    if (physicsComplete && !physicsLockRef.current) {
      physicsLockRef.current = true;
      setScore((previous) => previous + 10);
      setFlashText(language === 'kk' ? '+10 ұпай: тізбек жабылды' : '+10 очков: цепь замкнулась');
      const resetId = window.setTimeout(() => {
        resetPhysicsScene();
        physicsLockRef.current = false;
      }, 700);
      const flashId = window.setTimeout(() => setFlashText(''), 1400);
      return () => {
        window.clearTimeout(resetId);
        window.clearTimeout(flashId);
      };
    }
  }, [activeMode, language, physicsComplete, resetPhysicsScene]);

  useEffect(() => {
    if (activeMode !== 'math') {
      return;
    }

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
          nextStrokes.push({ id: strokeId, points: [hand.cursor] });
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
  }, [activeMode, runtime.frame.hands, runtime.frame.timestamp]);

  const boardPaths = useMemo(
    () =>
      strokes
        .filter((stroke) => stroke.points.length > 1)
        .map((stroke) => ({
          id: stroke.id,
          d: stroke.points
            .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x * 100} ${point.y * 100}`)
            .join(' '),
        })),
    [strokes],
  );

  const hasInk = boardPaths.length > 0;
  const chemistryFilled = useMemo(
    () => new Set(chemistryObjects.filter((object) => object.snappedZoneId).map((object) => object.snappedZoneId)),
    [chemistryObjects],
  );
  const physicsFilled = useMemo(
    () => new Set(physicsObjects.filter((object) => object.snappedZoneId).map((object) => object.snappedZoneId)),
    [physicsObjects],
  );

  const recognizeBoard = async () => {
    if (!hasInk || recognizing) {
      return;
    }

    setRecognizing(true);
    setRecognitionError('');

    try {
      const imageDataUrl = renderStrokesToImage(strokes);
      const response = await mathHandwritingService.recognize(imageDataUrl, language);
      const result = response?.latex || response?.text || '';
      setRecognition(result);
      if (result) {
        setScore((previous) => previous + 8);
        setFlashText(language === 'kk' ? '+8 ұпай: формула танылды' : '+8 очков: формула распознана');
        window.setTimeout(() => setFlashText(''), 1500);
      }
    } catch (error) {
      setRecognitionError(error.message);
    } finally {
      setRecognizing(false);
    }
  };

  const clearBoard = () => {
    activeStrokeIdsRef.current = {};
    setStrokes([]);
    setRecognition('');
    setRecognitionError('');
  };

  if (!isModeValid) {
    return <Navigate to="/lab-arena/chemistry?subject=chemistry" replace />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${copy.bg} text-white`}>
      <video ref={runtime.videoRef} muted playsInline className="absolute h-px w-px opacity-0 pointer-events-none" />
      <canvas ref={runtime.overlayRef} className="absolute h-px w-px opacity-0 pointer-events-none" />

      <header className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Link
            to={`/lab/${subjectForBack}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'kk' ? 'Лабораторияға оралу' : 'Назад в лабораторию'}
          </Link>
          <div className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 md:block">
            {copy.objective}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur">
          {[
            { modeId: 'chemistry', label: language === 'kk' ? 'Химия' : 'Химия' },
            { modeId: 'physics', label: language === 'kk' ? 'Физика' : 'Физика' },
            { modeId: 'math', label: language === 'kk' ? 'Математика' : 'Математика' },
          ].map((item) => (
            <Link
              key={item.modeId}
              to={`/lab-arena/${item.modeId}?subject=${item.modeId === 'math' ? 'mathematics' : item.modeId}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeMode === item.modeId ? 'bg-white text-slate-900' : 'text-white/80 hover:bg-white/10'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-6 pb-6">
        <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              <Sparkles className="h-3.5 w-3.5" />
              {activeMode === 'chemistry' ? 'Chemistry Arena' : activeMode === 'physics' ? 'Physics Arena' : 'Math Arena'}
            </div>
            <h1 className="mt-3 text-3xl font-black">{copy.title}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-white/80">{copy.subtitle}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                <Clock3 className="h-3.5 w-3.5" />
                {language === 'kk' ? 'Уақыт' : 'Время'}
              </div>
              <div className="mt-3 text-3xl font-black">{formatTime(timeLeft)}</div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                <Trophy className="h-3.5 w-3.5" />
                {language === 'kk' ? 'Ұпай' : 'Очки'}
              </div>
              <div className="mt-3 text-3xl font-black">{score}</div>
            </div>
          </div>
        </section>

        <section className="relative h-[calc(100vh-240px)] overflow-hidden rounded-[2.2rem] border border-white/20 bg-slate-950/35 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <div className={`absolute inset-0 ${copy.surface}`} />
          <HandGhostLayer hands={runtime.frame.hands} />
          <HandCursorLayer hands={runtime.frame.hands} />

          <div className="pointer-events-none absolute right-5 top-5 z-30 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur">
            {runtime.trackingState === 'tracking'
              ? (language === 'kk' ? `${runtime.frame.hands.length} қол анықталды` : `${runtime.frame.hands.length} рук в кадре`)
              : (language === 'kk' ? 'Қолды камераға көрсетіңіз' : 'Покажите руки камере')}
          </div>

          {isInitializing || isTrackingError ? (
            <div className="pointer-events-none absolute left-5 top-5 z-30 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
              {isInitializing
                ? (language === 'kk' ? 'Hand-tracking жүктелуде...' : 'Загрузка hand-tracking...')
                : (language === 'kk' ? 'Қате: трекинг іске қосылмады' : 'Ошибка: трекинг не запустился')}
            </div>
          ) : null}

          {activeMode === 'chemistry' ? (
            <>
              <div className="absolute inset-y-[22%] left-[38%] right-[8%] rounded-[2.5rem] border border-white/10 bg-white/5" />
              {CHEMISTRY_SCENE.snapZones.map((zone) => (
                <Zone
                  key={zone.id}
                  zone={zone}
                  filled={chemistryFilled.has(zone.id)}
                  label={zone.accepts[0] === 'oxygen' ? 'O' : 'H'}
                />
              ))}
              {chemistryObjects.map((object) => (
                <SceneObject key={object.id} object={object} />
              ))}
              <div className="absolute left-6 top-6 rounded-3xl border border-white/15 bg-black/30 px-5 py-4 backdrop-blur">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/80">
                  <Atom className="h-4 w-4" />
                  H2O
                </div>
                <p className="mt-2 text-sm text-white/80">
                  {language === 'kk' ? 'Сутек пен оттекті тиісті орынға қойыңыз.' : 'Поставьте водород и кислород в нужные зоны.'}
                </p>
              </div>
            </>
          ) : null}

          {activeMode === 'physics' ? (
            <>
              <div className="absolute inset-y-[12%] left-[40%] right-[8%] rounded-[2.7rem] border border-white/10 bg-white/5" />
              <div className="absolute left-[54%] top-[28%] h-[2px] w-[18%] bg-white/20" />
              <div className="absolute left-[76%] top-[40%] h-[18%] w-[2px] bg-white/20" />
              <div className="absolute left-[60%] top-[72%] h-[2px] w-[24%] bg-white/20" />
              <div className="absolute left-[54%] top-[34%] h-[40%] w-[2px] bg-white/20" />

              <Zone zone={PHYSICS_SCENE.snapZones[0]} filled={physicsFilled.has('zone-battery')} label="BAT" />
              <Zone zone={PHYSICS_SCENE.snapZones[1]} filled={physicsFilled.has('zone-wire-top')} label="WIRE A" />
              <Zone zone={PHYSICS_SCENE.snapZones[2]} filled={physicsFilled.has('zone-lamp')} label="LAMP" />
              <Zone zone={PHYSICS_SCENE.snapZones[3]} filled={physicsFilled.has('zone-wire-bottom')} label="WIRE B" />

              {physicsObjects.map((object) => (
                <SceneObject key={object.id} object={object} />
              ))}

              <div className="absolute left-6 top-6 rounded-3xl border border-white/15 bg-black/30 px-5 py-4 backdrop-blur">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                  <BatteryCharging className="h-4 w-4" />
                  Circuit
                </div>
                <p className="mt-2 text-sm text-white/80">
                  {language === 'kk' ? 'Тізбекті тұйықтаңыз: батарея, шам, екі сым.' : 'Замкните цепь: батарея, лампа, два провода.'}
                </p>
              </div>

              {physicsComplete ? (
                <div className="absolute left-[80%] top-[40%] z-30 flex h-16 w-16 items-center justify-center rounded-full bg-amber-300/85 shadow-[0_0_45px_rgba(252,211,77,0.75)]">
                  <Lightbulb className="h-8 w-8 text-amber-950" />
                </div>
              ) : null}
            </>
          ) : null}

          {activeMode === 'math' ? (
            <>
              <div
                className="absolute rounded-[2.4rem] border border-dashed border-white/30 bg-white/5"
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

              <div className="absolute left-6 top-6 rounded-3xl border border-white/15 bg-black/30 px-5 py-4 backdrop-blur">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-200/80">
                  <PencilLine className="h-4 w-4" />
                  Air board
                </div>
                <p className="mt-2 text-sm text-white/80">
                  {language === 'kk' ? 'Pinch арқылы жазып, кейін OCR арқылы таныңыз.' : 'Пишите pinch-жестом, затем распознавайте через OCR.'}
                </p>
              </div>

              <div className="absolute bottom-5 right-5 z-40 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={clearBoard}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <RefreshCw className="h-4 w-4" />
                  {language === 'kk' ? 'Тазарту' : 'Очистить'}
                </button>
                <button
                  type="button"
                  onClick={recognizeBoard}
                  disabled={!hasInk || recognizing}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-violet-300"
                >
                  <ScanSearch className="h-4 w-4" />
                  {recognizing
                    ? (language === 'kk' ? 'Танып жатыр...' : 'Распознаём...')
                    : (language === 'kk' ? 'Распознать' : 'Распознать')}
                </button>
              </div>
            </>
          ) : null}

          {isInitializing || isTrackingError ? (
            <div className="absolute inset-0 z-[45] flex items-center justify-center bg-slate-950/75 px-6 text-center backdrop-blur">
              <div className="max-w-xl space-y-4 rounded-[2rem] border border-white/20 bg-black/35 p-8">
                <h2 className="text-2xl font-black">
                  {isInitializing
                    ? (language === 'kk' ? 'Камера мен модельді іске қосу' : 'Запускаем камеру и модель')
                    : (language === 'kk' ? 'Hand-tracking іске қосылмады' : 'Hand-tracking не запустился')}
                </h2>
                <p className="text-sm leading-7 text-white/80">
                  {isInitializing
                    ? (language === 'kk'
                      ? 'Бірінші жүктеу кезінде 3-10 секунд қажет болуы мүмкін. Бетте сіздің видеоңыз көрсетілмейді.'
                      : 'Первый запуск может занять 3-10 секунд. Видео с камеры на этой странице не показывается.')
                    : getTrackingErrorText(language, runtime.errorKey)}
                </p>
                <button
                  type="button"
                  onClick={runtime.restart}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  {language === 'kk' ? 'Қайталау' : 'Повторить'}
                </button>
              </div>
            </div>
          ) : null}

          {timeLeft === 0 ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur">
              <div className="space-y-4 rounded-[2rem] border border-white/15 bg-white/10 p-8 text-center">
                <h2 className="text-3xl font-black">
                  {language === 'kk' ? 'Раунд аяқталды' : 'Раунд завершён'}
                </h2>
                <p className="text-sm text-white/80">
                  {language === 'kk' ? `Сіздің нәтижеңіз: ${score} ұпай` : `Ваш результат: ${score} очков`}
                </p>
                <Link
                  to={`/lab-arena/${activeMode}?subject=${subjectForBack}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  <RefreshCw className="h-4 w-4" />
                  {language === 'kk' ? 'Қайта ойнау' : 'Играть снова'}
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <Zap className="h-3.5 w-3.5" />
              {language === 'kk' ? 'Басқару' : 'Управление'}
            </div>
            <p className="mt-2 text-sm leading-6 text-white/80">
              {language === 'kk'
                ? 'Үлкен және сұқ саусақты қосу арқылы объектіні ұстаңыз. Қол нүктелері сахнада тікелей көрінеді, камера бейнесі көрсетілмейді.'
                : 'Сведите большой и указательный палец, чтобы взять объект. На сцене отображаются только точки/скелет рук, видео с камеры не показывается.'}
            </p>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              {language === 'kk' ? 'Соңғы нәтиже' : 'Последний результат'}
            </div>
            <div className="mt-2 min-h-12 text-sm text-white/85">
              {flashText || recognitionError || recognition || (language === 'kk' ? 'Әзірге нәтиже жоқ' : 'Пока нет результата')}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
