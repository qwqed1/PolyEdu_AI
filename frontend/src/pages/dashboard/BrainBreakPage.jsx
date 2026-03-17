import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GestureRecognizer } from '@mediapipe/tasks-vision';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BRAIN_BREAK_MATCH_STATE,
  BRAIN_BREAK_SESSION_STATUS,
  createInitialBrainBreakSession,
  evaluateGestureMatch,
  formatBrainBreakTime,
  normalizeDetectionResult,
} from '../../features/brainBreak/brainBreakSession';
import {
  buildBrainBreakSequence,
  getGestureByCategoryName,
} from '../../features/brainBreak/brainBreakGestures';
import {
  closeBrainBreakRecognizer,
  createBrainBreakGestureRecognizer,
  drawGestureLandmarks,
  recognizeGestureFrame,
} from '../../features/brainBreak/gestureRecognizerService';
import { useBrainBreakCamera } from '../../features/brainBreak/useBrainBreakCamera';

function StatusChip({ label, tone = 'neutral' }) {
  const toneClassMap = {
    success: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/30',
    warning: 'bg-amber-500/15 text-amber-100 ring-amber-400/30',
    danger: 'bg-rose-500/15 text-rose-100 ring-rose-400/30',
    neutral: 'bg-white/10 text-white/80 ring-white/10',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 backdrop-blur ${toneClassMap[tone]}`}
    >
      {label}
    </span>
  );
}

function getToneForMatchState(matchState) {
  if (matchState === BRAIN_BREAK_MATCH_STATE.matched) {
    return 'success';
  }

  if (
    matchState === BRAIN_BREAK_MATCH_STATE.missing ||
    matchState === BRAIN_BREAK_MATCH_STATE.misaligned
  ) {
    return 'warning';
  }

  return 'neutral';
}

export default function BrainBreakPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognizerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streakRef = useRef(0);
  const lastHandSeenAtRef = useRef(null);
  const sessionRef = useRef(null);
  const {
    cameraState,
    cameraErrorKey,
    requestCamera,
    stopCamera,
  } = useBrainBreakCamera(videoRef);
  const [session, setSession] = useState(() => createInitialBrainBreakSession());
  const [recognizerState, setRecognizerState] = useState('idle');

  const currentGesture =
    session.gestureSequence[session.currentGestureIndex] ??
    session.gestureSequence[session.gestureSequence.length - 1];
  const detectedGesture = getGestureByCategoryName(session.lastDetection?.detectedGesture);

  const progressPercent = session.gestureSequence.length
    ? Math.round((session.completedCount / session.gestureSequence.length) * 100)
    : 0;

  const resolvedErrorKey =
    session.errorKey || cameraErrorKey || (recognizerState === 'error' ? 'modelUnavailable' : '');

  const gestureCopy = currentGesture
    ? t.brainBreak.gestures[currentGesture.id]
    : t.brainBreak.gestures['open-palm'];
  const detectedGestureCopy = detectedGesture
    ? t.brainBreak.gestures[detectedGesture.id]
    : null;
  const overlayTitle = useMemo(() => {
    const statusTitles = {
      [BRAIN_BREAK_SESSION_STATUS.idle]: t.brainBreak.overlays.idleTitle,
      [BRAIN_BREAK_SESSION_STATUS.permission]: t.brainBreak.overlays.permissionTitle,
      [BRAIN_BREAK_SESSION_STATUS.countdown]: t.brainBreak.overlays.countdownTitle,
      [BRAIN_BREAK_SESSION_STATUS.paused]: t.brainBreak.overlays.pausedTitle,
      [BRAIN_BREAK_SESSION_STATUS.completed]: t.brainBreak.overlays.completedTitle,
      [BRAIN_BREAK_SESSION_STATUS.aborted]: t.brainBreak.overlays.abortedTitle,
      [BRAIN_BREAK_SESSION_STATUS.error]: t.brainBreak.overlays.errorTitle,
    };

    return statusTitles[session.status] ?? '';
  }, [session.status, t]);

  const overlayBody = useMemo(() => {
    if (session.status === BRAIN_BREAK_SESSION_STATUS.completed) {
      return t.brainBreak.overlays.completedBody(
        session.completedCount,
        session.gestureSequence.length,
      );
    }

    if (session.status === BRAIN_BREAK_SESSION_STATUS.countdown) {
      return t.brainBreak.overlays.countdownBody;
    }

    if (session.status === BRAIN_BREAK_SESSION_STATUS.error && resolvedErrorKey) {
      return t.brainBreak.errors[resolvedErrorKey] || t.brainBreak.errors.cameraUnavailable;
    }

    return t.brainBreak.overlays[`${session.status}Body`] || '';
  }, [resolvedErrorKey, session, t]);

  const stopDetectionLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const canvasElement = canvasRef.current;
    if (canvasElement) {
      drawGestureLandmarks(canvasElement, null, []);
    }
  }, []);

  const resetSession = useCallback(() => {
    streakRef.current = 0;
    lastHandSeenAtRef.current = null;
    stopDetectionLoop();

    const nextSession = createInitialBrainBreakSession(buildBrainBreakSequence());
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, [stopDetectionLoop]);

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

  const ensureRecognizer = useCallback(async () => {
    if (recognizerRef.current) {
      return true;
    }

    setRecognizerState('loading');

    try {
      recognizerRef.current = await createBrainBreakGestureRecognizer();
      setRecognizerState('ready');
      return true;
    } catch (error) {
      console.error('Failed to initialize gesture recognizer', error);
      setRecognizerState('error');
      setSession((previous) => ({
        ...previous,
        status: BRAIN_BREAK_SESSION_STATUS.error,
        errorKey: 'modelUnavailable',
        hintKey: 'modelUnavailable',
      }));
      return false;
    }
  }, []);

  const startDetectionLoop = useCallback(() => {
    if (animationFrameRef.current || !recognizerRef.current) {
      return;
    }

    const detectFrame = () => {
      const currentSession = sessionRef.current;
      if (!currentSession || currentSession.status !== BRAIN_BREAK_SESSION_STATUS.running) {
        animationFrameRef.current = null;
        return;
      }

      const videoElement = videoRef.current;
      syncCanvasSize();

      const now = performance.now();
      const result = recognizeGestureFrame(recognizerRef.current, videoElement, now);
      const detection = normalizeDetectionResult(result);

      if (detection.hasHand) {
        lastHandSeenAtRef.current = now;
      }

      drawGestureLandmarks(
        canvasRef.current,
        detection.landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
      );

      const evaluation = evaluateGestureMatch({
        detection,
        targetGesture: currentSession.gestureSequence[currentSession.currentGestureIndex]?.gesture,
        streak: streakRef.current,
        now,
        lastHandSeenAt: lastHandSeenAtRef.current,
      });

      streakRef.current = evaluation.confirmed ? 0 : evaluation.streak;

      setSession((previous) => {
        if (previous.status !== BRAIN_BREAK_SESSION_STATUS.running) {
          return previous;
        }

        const baseState = {
          ...previous,
          lastDetection: detection,
          matchState: evaluation.matchState,
          hintKey: evaluation.hintKey,
          errorKey: '',
        };

        if (!evaluation.confirmed) {
          return baseState;
        }

        const nextCompletedCount = previous.completedCount + 1;
        const nextGestureIndex = previous.currentGestureIndex + 1;

        if (nextGestureIndex >= previous.gestureSequence.length) {
          return {
            ...baseState,
            completedCount: nextCompletedCount,
            status: BRAIN_BREAK_SESSION_STATUS.completed,
            hintKey: 'sessionComplete',
          };
        }

        return {
          ...baseState,
          completedCount: nextCompletedCount,
          currentGestureIndex: nextGestureIndex,
          matchState: BRAIN_BREAK_MATCH_STATE.waiting,
          hintKey: 'nextGesture',
        };
      });

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    animationFrameRef.current = requestAnimationFrame(detectFrame);
  }, [syncCanvasSize]);

  const handleStart = useCallback(async () => {
    if (
      sessionRef.current?.status === BRAIN_BREAK_SESSION_STATUS.completed ||
      sessionRef.current?.status === BRAIN_BREAK_SESSION_STATUS.aborted ||
      sessionRef.current?.status === BRAIN_BREAK_SESSION_STATUS.error
    ) {
      resetSession();
    }

    setSession((previous) => ({
      ...previous,
      status: BRAIN_BREAK_SESSION_STATUS.permission,
      hintKey: 'requestPermission',
      errorKey: '',
    }));

    const cameraRequest =
      cameraState === 'ready'
        ? { ok: true, errorKey: '' }
        : await requestCamera();
    if (!cameraRequest.ok) {
      setSession((previous) => ({
        ...previous,
        status: BRAIN_BREAK_SESSION_STATUS.error,
        errorKey: cameraRequest.errorKey || 'cameraUnavailable',
        hintKey: cameraRequest.errorKey || 'cameraUnavailable',
      }));
      return;
    }

    const recognizerReady = await ensureRecognizer();
    if (!recognizerReady) {
      return;
    }

    streakRef.current = 0;
    setSession((previous) => ({
      ...previous,
      status: BRAIN_BREAK_SESSION_STATUS.countdown,
      countdownLeft: 3,
      hintKey: 'countdown',
      errorKey: '',
    }));
  }, [cameraState, ensureRecognizer, requestCamera, resetSession]);

  const handlePause = useCallback(() => {
    setSession((previous) => ({
      ...previous,
      status: BRAIN_BREAK_SESSION_STATUS.paused,
      hintKey: 'paused',
    }));
  }, []);

  const handleResume = useCallback(() => {
    setSession((previous) => ({
      ...previous,
      status: BRAIN_BREAK_SESSION_STATUS.running,
      hintKey: 'copyGesture',
    }));
  }, []);

  const handleFinish = useCallback(() => {
    stopDetectionLoop();
    stopCamera();
    streakRef.current = 0;
    lastHandSeenAtRef.current = null;

    setSession((previous) => ({
      ...previous,
      status: BRAIN_BREAK_SESSION_STATUS.aborted,
      hintKey: 'aborted',
    }));
  }, [stopCamera, stopDetectionLoop]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (session.status !== BRAIN_BREAK_SESSION_STATUS.countdown) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSession((previous) => {
        if (previous.status !== BRAIN_BREAK_SESSION_STATUS.countdown) {
          return previous;
        }

        if (previous.countdownLeft <= 1) {
          return {
            ...previous,
            status: BRAIN_BREAK_SESSION_STATUS.running,
            countdownLeft: 0,
            hintKey: 'copyGesture',
          };
        }

        return {
          ...previous,
          countdownLeft: previous.countdownLeft - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [session.status]);

  useEffect(() => {
    if (session.status !== BRAIN_BREAK_SESSION_STATUS.running) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSession((previous) => {
        if (previous.status !== BRAIN_BREAK_SESSION_STATUS.running) {
          return previous;
        }

        if (previous.timeLeft <= 1) {
          return {
            ...previous,
            timeLeft: 0,
            status: BRAIN_BREAK_SESSION_STATUS.completed,
            hintKey: 'timeComplete',
          };
        }

        return {
          ...previous,
          timeLeft: previous.timeLeft - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [session.status]);

  useEffect(() => {
    if (session.status === BRAIN_BREAK_SESSION_STATUS.running) {
      startDetectionLoop();
      return () => stopDetectionLoop();
    }

    stopDetectionLoop();
    return undefined;
  }, [session.status, startDetectionLoop, stopDetectionLoop]);

  useEffect(() => {
    return () => {
      stopDetectionLoop();
      stopCamera();
      closeBrainBreakRecognizer(recognizerRef.current);
    };
  }, [stopCamera, stopDetectionLoop]);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(135deg,_#020617,_#0f172a_50%,_#111827)] text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12rem] top-[-8rem] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-10rem] h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/80 transition hover:bg-white/15 hover:text-white"
              aria-label={t.brainBreak.back}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200 ring-1 ring-emerald-300/20">
                <Sparkles className="h-3.5 w-3.5" />
                {t.nav.brainBreak}
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                {t.brainBreak.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65 sm:text-base">
                {t.brainBreak.subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusChip
              label={
                cameraState === 'ready'
                  ? t.brainBreak.chips.cameraReady
                  : cameraState === 'requesting'
                    ? t.brainBreak.chips.cameraLoading
                    : t.brainBreak.chips.cameraIdle
              }
              tone={cameraState === 'ready' ? 'success' : cameraState === 'error' ? 'danger' : 'neutral'}
            />
            <StatusChip
              label={
                recognizerState === 'ready'
                  ? t.brainBreak.chips.modelReady
                  : recognizerState === 'loading'
                    ? t.brainBreak.chips.modelLoading
                    : t.brainBreak.chips.modelIdle
              }
              tone={recognizerState === 'ready' ? 'success' : recognizerState === 'error' ? 'danger' : 'neutral'}
            />
            <StatusChip
              label={t.brainBreak.matchStates[session.matchState]}
              tone={getToneForMatchState(session.matchState)}
            />
          </div>
        </div>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_390px]">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-md">
            <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
              <StatusChip label={`${t.brainBreak.timeLeft}: ${formatBrainBreakTime(session.timeLeft)}`} />
              <StatusChip
                label={`${t.brainBreak.progressLabel}: ${session.completedCount}/${session.gestureSequence.length}`}
              />
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-20 rounded-3xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                    {t.brainBreak.detectedGesture}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {detectedGestureCopy?.title || t.brainBreak.noneDetected}
                  </p>
                </div>
                <div className="text-right text-sm text-white/65">
                  <div>{session.lastDetection?.handedness || t.brainBreak.handednessUnknown}</div>
                  <div>
                    {session.lastDetection?.confidence
                      ? `${Math.round(session.lastDetection.confidence * 100)}% ${t.brainBreak.confidence}`
                      : t.brainBreak.waitingSignal}
                  </div>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="relative flex h-full min-h-[460px] items-center justify-center bg-slate-950/80">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover -scale-x-100"
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover"
              />

              {session.status !== BRAIN_BREAK_SESSION_STATUS.running && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/65 px-6 text-center backdrop-blur-sm">
                  <div className="max-w-md">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white/90">
                      {session.status === BRAIN_BREAK_SESSION_STATUS.error ? (
                        <AlertCircle className="h-8 w-8" />
                      ) : session.status === BRAIN_BREAK_SESSION_STATUS.countdown ? (
                        <Clock3 className="h-8 w-8" />
                      ) : session.status === BRAIN_BREAK_SESSION_STATUS.completed ? (
                        <CheckCircle className="h-8 w-8" />
                      ) : (
                        <Camera className="h-8 w-8" />
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{overlayTitle}</h2>
                    <p className="mt-3 text-sm leading-6 text-white/70">{overlayBody}</p>
                    {session.status === BRAIN_BREAK_SESSION_STATUS.countdown && (
                      <div className="mt-6 text-6xl font-black text-white">
                        {session.countdownLeft}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-xl shadow-black/20 backdrop-blur-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/85">
                    {t.brainBreak.currentGesture}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">{gestureCopy.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/65">{gestureCopy.description}</p>
                </div>
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br ${currentGesture?.accentClass || 'from-sky-500 to-cyan-500'} text-4xl shadow-lg shadow-black/20`}
                >
                  <span>{currentGesture?.icon}</span>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <div className="flex items-center justify-between text-sm text-white/75">
                  <span>{t.brainBreak.hintTitle}</span>
                  <span>{t.brainBreak.matchStates[session.matchState]}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/85">
                  {t.brainBreak.hints[session.hintKey]}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-4 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  {t.brainBreak.timeLeft}
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {formatBrainBreakTime(session.timeLeft)}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-4 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  {t.brainBreak.progressLabel}
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {session.completedCount}/{session.gestureSequence.length}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur-md">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                {t.brainBreak.controls}
              </p>
              <div className="flex flex-wrap gap-3">
                {session.status === BRAIN_BREAK_SESSION_STATUS.running ? (
                  <button
                    onClick={handlePause}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-400"
                  >
                    <Pause className="h-4 w-4" />
                    {t.brainBreak.pause}
                  </button>
                ) : session.status === BRAIN_BREAK_SESSION_STATUS.paused ? (
                  <button
                    onClick={handleResume}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400"
                  >
                    <Play className="h-4 w-4" />
                    {t.brainBreak.resume}
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400"
                  >
                    <Play className="h-4 w-4" />
                    {session.status === BRAIN_BREAK_SESSION_STATUS.completed ||
                    session.status === BRAIN_BREAK_SESSION_STATUS.aborted ||
                    session.status === BRAIN_BREAK_SESSION_STATUS.error
                      ? t.brainBreak.restart
                      : t.brainBreak.start}
                  </button>
                )}

                <button
                  onClick={resetSession}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t.brainBreak.reset}
                </button>

                <button
                  onClick={handleFinish}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/90 px-5 py-3 font-semibold text-white transition hover:bg-rose-400"
                >
                  <Square className="h-4 w-4" />
                  {t.brainBreak.finish}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur-md">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
                {t.brainBreak.checklistTitle}
              </p>
              <ul className="space-y-3 text-sm leading-6 text-white/75">
                <li>{t.brainBreak.checklist.one}</li>
                <li>{t.brainBreak.checklist.two}</li>
                <li>{t.brainBreak.checklist.three}</li>
              </ul>
            </div>

            {resolvedErrorKey && session.status === BRAIN_BREAK_SESSION_STATUS.error && (
              <div className="rounded-[2rem] border border-rose-300/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{t.brainBreak.errors[resolvedErrorKey]}</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
