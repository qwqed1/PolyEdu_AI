import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  RefreshCcw,
  Shuffle,
  Users,
  Video,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  closeFaceDetector,
  createFaceDetector,
  detectFacesForVideo,
  normalizeFaceDetections,
} from '../../features/randomStudent/faceDetectionService';
import {
  createRandomStudentSession,
  getAvailableSelectionSlots,
  getEffectiveParticipantCount,
  getSelectedSlots,
  getSelectionPoolSlots,
  isPickHighlightActive,
  pickRandomStudentSlot,
  resetRandomStudentLesson,
  syncSlotsWithDetections,
  updateManualCountOverride,
} from '../../features/randomStudent/randomStudentSession';
import { RANDOM_STUDENT_DETECTION_INTERVAL_MS } from '../../features/randomStudent/randomStudentConfig';
import { useSelectableCamera } from '../../features/randomStudent/useSelectableCamera';

const pageCopy = {
  ru: {
    navLabel: 'Случайный ученик',
    title: 'Случайный ученик',
    subtitle:
      'Включайте камеру, отслеживайте лица в классе и выбирайте одного ученика без повторов до сброса урока.',
    back: 'Назад к кабинету',
    cameraFeed: 'Камера класса',
    cameraHelp: 'Рамки на видео показывают стабильные анонимные слоты учеников.',
    cameraReady: 'Камера готова',
    cameraIdle: 'Камера не активна',
    detectorReady: 'Детектор активен',
    detectorIdle: 'Детектор не запущен',
    detectedCount: 'Найдено: {n}',
    poolCount: 'В выборе: {n}',
    availableCount: 'Доступно: {n}',
    controls: 'Управление',
    cameraSelect: 'Камера',
    noCameras: 'Камеры не найдены',
    cameraOption: 'Камера {n}',
    refreshDevices: 'Обновить устройства',
    manualCount: 'Вручную задать число учеников',
    manualCountPlaceholder: 'Оставьте пустым для автоподсчёта',
    detectedHint: 'Камера сейчас видит {n} стабильных слотов.',
    detectedLabel: 'Камера',
    effectiveLabel: 'Пул',
    selectedLabel: 'Выбрано',
    enableCamera: 'Включить камеру',
    pickStudent: 'Выбрать ученика',
    nextPick: 'Следующий',
    resetLesson: 'Сбросить урок',
    currentWinner: 'Текущий выбор',
    currentWinnerHint: 'Последний выпавший слот ученика.',
    lastPicked: 'Последний выбор',
    placeholderWinner: 'Выбран placeholder-слот из ручного пула.',
    visibleWinner: 'Слот найден на камере и подсвечен на видео.',
    noWinner: 'Пока ни один ученик не выбран.',
    selectedStudents: 'Уже выбраны',
    selectedStudentsHint: 'Эти слоты больше не участвуют в рандоме до сброса.',
    detectedSlot: 'Слот виден на камере',
    placeholderSlot: 'Ручной placeholder-слот',
    noSelectedStudents: 'Пока никто не выпадал.',
    poolTitle: 'Пул выбора',
    poolHint: 'В пул попадают стабильные слоты и placeholder-ученики по ручному лимиту.',
    emptyPool: 'Пул пока пуст. Включите камеру или задайте число вручную.',
    slotLabel: 'Ученик {n}',
    cameraOverlayTitle: 'Готовы к выбору?',
    cameraOverlayBody: 'Включите камеру, чтобы система начала считать анонимные слоты учеников.',
    cameraErrorTitle: 'Камере нужна помощь',
    errors: {
      unsupportedBrowser:
        'Браузер не поддерживает нужные media API для работы с камерой.',
      cameraDenied:
        'Доступ к камере запрещён. Разрешите его в браузере и попробуйте снова.',
      cameraMissing:
        'Не удалось найти выбранную камеру. Обновите список устройств.',
      cameraUnavailable:
        'Не удалось подключить камеру. Проверьте устройство и повторите попытку.',
      modelUnavailable:
        'Модель определения лиц не загрузилась. Обновите страницу и попробуйте ещё раз.',
    },
  },
  kk: {
    navLabel: 'Кездейсоқ оқушы',
    title: 'Кездейсоқ оқушы',
    subtitle:
      'Камераны қосып, сыныптағы беттерді бақылап, сабақ аяқталғанша бір оқушыны қайталамай таңдаңыз.',
    back: 'Кабинетке оралу',
    cameraFeed: 'Сынып камерасы',
    cameraHelp: 'Видеодағы шектер тұрақты оқушы слоттарын көрсетеді.',
    cameraReady: 'Камера дайын',
    cameraIdle: 'Камера белсенді емес',
    detectorReady: 'Детектор белсенді',
    detectorIdle: 'Детектор іске қосылмаған',
    detectedCount: 'Анықталды: {n}',
    poolCount: 'Таңдауда: {n}',
    availableCount: 'Қалды: {n}',
    controls: 'Басқару',
    cameraSelect: 'Камера',
    noCameras: 'Камералар табылмады',
    cameraOption: 'Камера {n}',
    refreshDevices: 'Құрылғыларды жаңарту',
    manualCount: 'Оқушы санын қолмен енгізу',
    manualCountPlaceholder: 'Автоесеп үшін бос қалдырыңыз',
    detectedHint: 'Камера қазір {n} тұрақты слотты көріп тұр.',
    detectedLabel: 'Камера',
    effectiveLabel: 'Пул',
    selectedLabel: 'Таңдалды',
    enableCamera: 'Камераны қосу',
    pickStudent: 'Оқушыны таңдау',
    nextPick: 'Келесі',
    resetLesson: 'Сабақты қайта бастау',
    currentWinner: 'Ағымдағы таңдау',
    currentWinnerHint: 'Соңғы таңдалған оқушы слоты.',
    lastPicked: 'Соңғы таңдау',
    placeholderWinner: 'Таңдау қолмен берілген placeholder-слоттан жасалды.',
    visibleWinner: 'Слот камерадан табылып, видеода белгіленді.',
    noWinner: 'Әлі ешкім таңдалған жоқ.',
    selectedStudents: 'Бұрын таңдалғандар',
    selectedStudentsHint: 'Бұл слоттар сабақ қайта басталғанша рандомға қатыспайды.',
    detectedSlot: 'Слот камерада көрінеді',
    placeholderSlot: 'Қолмен берілген placeholder-слот',
    noSelectedStudents: 'Әзірге ешкім таңдалмады.',
    poolTitle: 'Таңдау пулы',
    poolHint: 'Мұнда тұрақты слоттар мен қолмен берілген placeholder-оқушылар кіреді.',
    emptyPool: 'Пул әзірге бос. Камераны қосыңыз немесе санды қолмен енгізіңіз.',
    slotLabel: 'Оқушы {n}',
    cameraOverlayTitle: 'Таңдауға дайынсыз ба?',
    cameraOverlayBody: 'Жүйе анонимді оқушы слоттарын санауы үшін камераны қосыңыз.',
    cameraErrorTitle: 'Камераға көмек керек',
    errors: {
      unsupportedBrowser:
        'Браузер камерамен жұмыс істеуге қажет media API-ларды қолдамайды.',
      cameraDenied:
        'Камераға рұқсат берілмеді. Браузерден рұқсатты қосып, қайта көріңіз.',
      cameraMissing:
        'Таңдалған камера табылмады. Құрылғылар тізімін жаңартыңыз.',
      cameraUnavailable:
        'Камераны қосу мүмкін болмады. Құрылғыны және басқа қолданбаларды тексеріңіз.',
      modelUnavailable:
        'Бет анықтайтын модель жүктелмеді. Бетті жаңартып, қайта көріңіз.',
    },
  },
};

function formatSlotLabel(labelTemplate, labelNumber) {
  return labelTemplate.replace('{n}', String(labelNumber));
}

function interpolate(template, value) {
  return template.replace('{n}', String(value));
}

function StatusBadge({ tone = 'neutral', children }) {
  const tones = {
    neutral:
      'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200',
    success:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
    warning:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
    danger:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function drawOverlay(canvasElement, slots, currentPickId, labelTemplate) {
  if (!canvasElement) {
    return;
  }

  const context = canvasElement.getContext('2d');
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvasElement.width, canvasElement.height);
  context.font = '600 13px Assistant, sans-serif';
  context.textBaseline = 'middle';

  slots.forEach((slot) => {
    if (!slot.bbox) {
      return;
    }

    const x = slot.bbox.x * canvasElement.width;
    const y = slot.bbox.y * canvasElement.height;
    const width = slot.bbox.width * canvasElement.width;
    const height = slot.bbox.height * canvasElement.height;
    const label = formatSlotLabel(labelTemplate, slot.labelNumber);
    const isCurrentPick = slot.id === currentPickId;
    const isSelected = slot.status === 'selected';

    context.lineWidth = isCurrentPick ? 5 : 3;
    context.strokeStyle = isCurrentPick
      ? 'rgba(251, 191, 36, 0.98)'
      : isSelected
        ? 'rgba(16, 185, 129, 0.96)'
        : 'rgba(56, 189, 248, 0.94)';
    context.setLineDash(isSelected && !isCurrentPick ? [8, 5] : []);
    context.strokeRect(x, y, width, height);
    context.setLineDash([]);

    const textWidth = Math.max(96, context.measureText(label).width + 26);
    const labelX = x;
    const labelY = Math.max(14, y - 18);

    context.fillStyle = isCurrentPick
      ? 'rgba(245, 158, 11, 0.96)'
      : isSelected
        ? 'rgba(5, 150, 105, 0.94)'
        : 'rgba(15, 23, 42, 0.84)';
    context.fillRect(labelX, labelY, textWidth, 28);

    context.fillStyle = '#ffffff';
    context.fillText(label, labelX + 12, labelY + 14);
  });
}

export default function RandomStudentPickerPage() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const copy = pageCopy[language] || pageCopy.ru;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastDetectionAtRef = useRef(0);

  const {
    availableCameras,
    selectedDeviceId,
    setSelectedDeviceId,
    cameraState,
    cameraErrorKey,
    requestCamera,
    refreshCameras,
    stopCamera,
  } = useSelectableCamera(videoRef);

  const [session, setSession] = useState(() => createRandomStudentSession());
  const [detectorState, setDetectorState] = useState('idle');
  const [manualCountInput, setManualCountInput] = useState('');
  const [detectorErrorKey, setDetectorErrorKey] = useState('');

  const now = Date.now();
  const effectiveCount = getEffectiveParticipantCount(session);
  const selectedSlots = getSelectedSlots(session);
  const availableSlots = getAvailableSelectionSlots(session, now);
  const selectionPool = getSelectionPoolSlots(session, now);
  const currentWinner = session.slots.find((slot) => slot.id === session.currentPickId) || null;
  const highlightActive = isPickHighlightActive(session, now);

  const resolvedErrorKey = detectorErrorKey || cameraErrorKey;
  const visibleTrackedSlots = useMemo(
    () => session.slots.filter((slot) => !slot.isPlaceholder && slot.bbox),
    [session.slots],
  );

  const syncCanvasSize = useCallback(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement || !videoElement.videoWidth || !videoElement.videoHeight) {
      return;
    }

    if (
      canvasElement.width !== videoElement.videoWidth ||
      canvasElement.height !== videoElement.videoHeight
    ) {
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;
    }
  }, []);

  const stopDetectionLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }

    const context = canvasElement.getContext('2d');
    context?.clearRect(0, 0, canvasElement.width, canvasElement.height);
  }, []);

  const ensureDetector = useCallback(async () => {
    if (detectorRef.current) {
      return true;
    }

    setDetectorState('loading');
    setDetectorErrorKey('');

    try {
      detectorRef.current = await createFaceDetector();
      setDetectorState('ready');
      return true;
    } catch (error) {
      console.error('Failed to initialize face detector', error);
      setDetectorState('error');
      setDetectorErrorKey('modelUnavailable');
      return false;
    }
  }, []);

  const startDetectionLoop = useCallback(() => {
    if (animationFrameRef.current || !detectorRef.current) {
      return;
    }

    const tick = (frameNow) => {
      if (cameraState !== 'ready' || !detectorRef.current) {
        animationFrameRef.current = null;
        return;
      }

      if (frameNow - lastDetectionAtRef.current >= RANDOM_STUDENT_DETECTION_INTERVAL_MS) {
        lastDetectionAtRef.current = frameNow;
        syncCanvasSize();

        const detectionResult = detectFacesForVideo(detectorRef.current, videoRef.current, frameNow);
        const detections = normalizeFaceDetections(detectionResult, videoRef.current);

        startTransition(() => {
          setSession((previous) => syncSlotsWithDetections(previous, detections, Date.now()));
        });
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [cameraState, syncCanvasSize]);

  const handleEnableCamera = useCallback(async () => {
    const detectorReady = await ensureDetector();
    if (!detectorReady) {
      return;
    }

    const result = await requestCamera(selectedDeviceId);
    if (!result.ok) {
      return;
    }

    setDetectorErrorKey('');
  }, [ensureDetector, requestCamera, selectedDeviceId]);

  const handlePickStudent = useCallback(() => {
    startTransition(() => {
      setSession((previous) => pickRandomStudentSlot(previous, Date.now()));
    });
  }, []);

  const handleResetLesson = useCallback(() => {
    startTransition(() => {
      setSession((previous) => resetRandomStudentLesson(previous));
    });
  }, []);

  const handleManualCountChange = useCallback((event) => {
    const rawValue = event.target.value.replace(/[^\d]/g, '');
    setManualCountInput(rawValue);

    const manualCount = rawValue ? Number(rawValue) : null;
    startTransition(() => {
      setSession((previous) => updateManualCountOverride(previous, manualCount, Date.now()));
    });
  }, []);

  useEffect(() => {
    drawOverlay(
      canvasRef.current,
      visibleTrackedSlots,
      highlightActive ? session.currentPickId : '',
      copy.slotLabel,
    );
  }, [copy.slotLabel, highlightActive, session.currentPickId, visibleTrackedSlots]);

  useEffect(() => {
    if (cameraState === 'ready' && detectorState === 'ready') {
      startDetectionLoop();
      return () => stopDetectionLoop();
    }

    stopDetectionLoop();
    return undefined;
  }, [cameraState, detectorState, startDetectionLoop, stopDetectionLoop]);

  useEffect(() => {
    return () => {
      stopDetectionLoop();
      stopCamera();
      closeFaceDetector(detectorRef.current);
    };
  }, [stopCamera, stopDetectionLoop]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 transition hover:border-primary-500 hover:text-primary-600 dark:border-dark-border dark:bg-dark-surface dark:text-neutral-200 dark:hover:border-primary-500 dark:hover:text-primary-400"
              aria-label={copy.back}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:bg-primary-900/30 dark:text-primary-200">
                <Camera className="h-3.5 w-3.5" />
                {t.nav.randomStudent || copy.navLabel}
              </div>
              <h1 className="mt-3 text-3xl font-black text-neutral-900 dark:text-white">
                {copy.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {copy.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge
              tone={cameraState === 'ready' ? 'success' : cameraState === 'error' ? 'danger' : 'neutral'}
            >
              {cameraState === 'ready' ? copy.cameraReady : copy.cameraIdle}
            </StatusBadge>
            <StatusBadge
              tone={detectorState === 'ready' ? 'success' : detectorState === 'error' ? 'danger' : 'neutral'}
            >
              {detectorState === 'ready' ? copy.detectorReady : copy.detectorIdle}
            </StatusBadge>
            <StatusBadge tone={availableSlots.length ? 'warning' : 'neutral'}>
              {interpolate(copy.availableCount, availableSlots.length)}
            </StatusBadge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
          <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-dark-border">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {copy.cameraFeed}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {copy.cameraHelp}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge>{interpolate(copy.detectedCount, session.detectedCount)}</StatusBadge>
                <StatusBadge>{interpolate(copy.poolCount, effectiveCount)}</StatusBadge>
              </div>
            </div>

            <div className="relative aspect-[16/10] bg-neutral-950">
              <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-cover" />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />

              {cameraState !== 'ready' && (
                <div className="absolute inset-0 flex items-center justify-center px-6">
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white">
                      {resolvedErrorKey ? (
                        <AlertCircle className="h-8 w-8" />
                      ) : (
                        <Video className="h-8 w-8" />
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {resolvedErrorKey ? copy.cameraErrorTitle : copy.cameraOverlayTitle}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-white/75">
                      {resolvedErrorKey
                        ? copy.errors[resolvedErrorKey]
                        : copy.cameraOverlayBody}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                {copy.controls}
              </h2>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {copy.cameraSelect}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedDeviceId}
                      onChange={(event) => setSelectedDeviceId(event.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white"
                    >
                      {!availableCameras.length && <option value="">{copy.noCameras}</option>}
                      {availableCameras.map((camera, index) => (
                        <option
                          key={camera.deviceId || `camera-${index + 1}`}
                          value={camera.deviceId}
                        >
                          {camera.label || interpolate(copy.cameraOption, index + 1)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => refreshCameras(selectedDeviceId)}
                      className="inline-flex h-[50px] w-[50px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 transition hover:border-primary-500 hover:text-primary-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200 dark:hover:border-primary-500 dark:hover:text-primary-400"
                      aria-label={copy.refreshDevices}
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {copy.manualCount}
                  </label>
                  <input
                    inputMode="numeric"
                    min="0"
                    value={manualCountInput}
                    onChange={handleManualCountChange}
                    placeholder={copy.manualCountPlaceholder}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-white"
                  />
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {interpolate(copy.detectedHint, session.detectedCount)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-900/50">
                    <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                      {copy.detectedLabel}
                    </p>
                    <p className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">
                      {session.detectedCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-900/50">
                    <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                      {copy.effectiveLabel}
                    </p>
                    <p className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">
                      {effectiveCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-900/50">
                    <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                      {copy.selectedLabel}
                    </p>
                    <p className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">
                      {selectedSlots.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleEnableCamera}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 font-semibold text-white transition hover:bg-primary-700"
                >
                  <Camera className="h-4 w-4" />
                  {copy.enableCamera}
                </button>
                <button
                  onClick={handlePickStudent}
                  disabled={!availableSlots.length}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
                >
                  <Shuffle className="h-4 w-4" />
                  {selectedSlots.length ? copy.nextPick : copy.pickStudent}
                </button>
              </div>

              <button
                onClick={handleResetLesson}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-3 font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200 dark:hover:border-primary-500 dark:hover:text-primary-400"
              >
                <RefreshCcw className="h-4 w-4" />
                {copy.resetLesson}
              </button>
            </div>

            <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {copy.currentWinner}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {copy.currentWinnerHint}
                  </p>
                </div>
                {currentWinner ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : (
                  <Users className="h-6 w-6 text-neutral-400" />
                )}
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/50">
                {currentWinner ? (
                  <>
                    <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">
                      {copy.lastPicked}
                    </p>
                    <p className="mt-2 text-2xl font-black text-neutral-900 dark:text-white">
                      {formatSlotLabel(copy.slotLabel, currentWinner.labelNumber)}
                    </p>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      {currentWinner.isPlaceholder ? copy.placeholderWinner : copy.visibleWinner}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {copy.noWinner}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {copy.selectedStudents}
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {copy.selectedStudentsHint}
              </p>

              {selectedSlots.length ? (
                <div className="mt-4 space-y-2">
                  {selectedSlots.map((slot, index) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 dark:bg-neutral-900/50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {formatSlotLabel(copy.slotLabel, slot.labelNumber)}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {index + 1}. {slot.bbox ? copy.detectedSlot : copy.placeholderSlot}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {copy.noSelectedStudents}
                </p>
              )}
            </div>

            <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {copy.poolTitle}
              </h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {copy.poolHint}
              </p>

              {selectionPool.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectionPool.map((slot) => (
                    <StatusBadge
                      key={slot.id}
                      tone={session.selectedSlotIds.includes(slot.id) ? 'success' : 'neutral'}
                    >
                      {formatSlotLabel(copy.slotLabel, slot.labelNumber)}
                    </StatusBadge>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  {copy.emptyPool}
                </p>
              )}
            </div>

            {resolvedErrorKey && (
              <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{copy.errors[resolvedErrorKey]}</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
