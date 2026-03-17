import { AlertCircle, Camera, Hand, Loader2, RefreshCw, ScanSearch } from 'lucide-react';

function StatusPill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-white/10 text-white/85 ring-white/10',
    success: 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/20',
    warning: 'bg-amber-500/15 text-amber-100 ring-amber-400/20',
    danger: 'bg-rose-500/15 text-rose-100 ring-rose-400/20',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function getTrackingTone(trackingState) {
  if (trackingState === 'tracking') {
    return 'success';
  }

  if (trackingState === 'error') {
    return 'danger';
  }

  return 'warning';
}

export default function HandTrackingStage({
  title,
  description,
  badge,
  accentClass = 'from-slate-950 via-sky-950 to-cyan-950',
  videoRef,
  overlayRef,
  cameraState,
  modelState,
  trackingState,
  errorKey,
  onRetry,
  hands,
  frame,
  copy,
  instructions,
  stageRef,
  children,
  footer,
}) {
  const showBlockingState =
    errorKey ||
    cameraState === 'requesting' ||
    modelState === 'loading';

  return (
    <div className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className={`overflow-hidden rounded-[2rem] bg-gradient-to-br ${accentClass} px-6 py-7 text-white shadow-lg`}>
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            <Hand className="h-3.5 w-3.5" />
            {badge}
          </div>
          <h2 className="mt-4 text-3xl font-bold">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-white/80">{description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill tone={cameraState === 'ready' ? 'success' : errorKey ? 'danger' : 'warning'}>
              {copy.camera}
            </StatusPill>
            <StatusPill tone={modelState === 'ready' ? 'success' : modelState === 'error' ? 'danger' : 'warning'}>
              {copy.model}
            </StatusPill>
            <StatusPill tone={getTrackingTone(trackingState)}>
              {copy.tracking}
            </StatusPill>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div
            ref={stageRef}
            className="relative aspect-[16/9] overflow-hidden rounded-[2rem] border border-neutral-200 bg-slate-950 shadow-inner dark:border-dark-border"
          >
            {children}

            {hands.map((hand, index) => (
              <div
                key={hand.id}
                className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${hand.cursor.x * 100}%`, top: `${hand.cursor.y * 100}%` }}
              >
                <div className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-lg ${hand.pinchState === 'pinching' ? 'border-orange-300 bg-orange-500/70' : 'border-sky-300 bg-sky-500/60'}`}>
                  {index === 0 ? 'L1' : 'L2'}
                  <span className={`absolute inset-0 rounded-full ${hand.pinchState === 'pinching' ? 'animate-ping bg-orange-400/30' : 'bg-transparent'}`} />
                </div>
              </div>
            ))}

            {showBlockingState ? (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/82 px-6 text-center text-white backdrop-blur-sm">
                <div className="max-w-md space-y-4">
                  {errorKey ? (
                    <AlertCircle className="mx-auto h-12 w-12 text-rose-300" />
                  ) : (
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-sky-200" />
                  )}
                  <h3 className="text-2xl font-semibold">
                    {errorKey ? copy.errorTitle : copy.loadingTitle}
                  </h3>
                  <p className="text-sm leading-7 text-white/80">
                    {errorKey ? (copy.errors[errorKey] || errorKey) : copy.loadingBody}
                  </p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {copy.retry}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {footer ? (
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
              {footer}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-slate-950 shadow-sm dark:border-dark-border">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                <Camera className="h-3.5 w-3.5" />
                {copy.cameraPreview}
              </div>
              <span className="text-xs text-white/60">{frame.fps ? `${frame.fps} fps` : '...'}</span>
            </div>
            <div className="relative aspect-[4/3] bg-slate-900">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              <canvas ref={overlayRef} className="absolute inset-0 h-full w-full" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-dark-border dark:bg-dark-bg">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-300">
              <ScanSearch className="h-4 w-4" />
              {copy.statusTitle}
            </div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
              <div>{copy.statusCamera(cameraState)}</div>
              <div>{copy.statusModel(modelState)}</div>
              <div>{copy.statusTracking(trackingState, hands.length)}</div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-dark-border dark:bg-dark-bg">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-300">
              {copy.instructionsTitle}
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
              {instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
