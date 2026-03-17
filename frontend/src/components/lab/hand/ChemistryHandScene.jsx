import { RefreshCw, Sparkles } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import HandTrackingStage from '../../../features/handTracking/HandTrackingStage';
import { useInteractiveHandScene } from '../../../features/handTracking/useInteractiveHandScene';
import { useHandTrackingRuntime } from '../../../features/handTracking/useHandTrackingRuntime';

const CHEMISTRY_SCENE = {
  objects: [
    {
      id: 'hydrogen-a',
      kind: 'hydrogen',
      symbol: 'H',
      position: { x: 0.08, y: 0.18 },
      size: { w: 0.12, h: 0.12 },
      accent: 'from-sky-400 to-cyan-500',
    },
    {
      id: 'oxygen-core',
      kind: 'oxygen',
      symbol: 'O',
      position: { x: 0.09, y: 0.43 },
      size: { w: 0.14, h: 0.14 },
      accent: 'from-rose-500 to-orange-500',
    },
    {
      id: 'hydrogen-b',
      kind: 'hydrogen',
      symbol: 'H',
      position: { x: 0.08, y: 0.7 },
      size: { w: 0.12, h: 0.12 },
      accent: 'from-sky-400 to-cyan-500',
    },
  ],
  snapZones: [
    { id: 'left-h', accepts: ['hydrogen'], x: 0.48, y: 0.38, w: 0.13, h: 0.13 },
    { id: 'center-o', accepts: ['oxygen'], x: 0.61, y: 0.34, w: 0.16, h: 0.16 },
    { id: 'right-h', accepts: ['hydrogen'], x: 0.78, y: 0.38, w: 0.13, h: 0.13 },
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

function MoleculeZone({ zone, label, isFilled }) {
  return (
    <div
      className={`absolute rounded-full border border-dashed transition-all ${isFilled ? 'border-emerald-300 bg-emerald-400/20' : 'border-white/35 bg-white/5'}`}
      style={{
        left: `${zone.x * 100}%`,
        top: `${zone.y * 100}%`,
        width: `${zone.w * 100}%`,
        height: `${zone.h * 100}%`,
      }}
    >
      <div className="flex h-full items-center justify-center text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
        {label}
      </div>
    </div>
  );
}

function AtomCard({ object }) {
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
      <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${object.accent} text-3xl font-black text-white shadow-[0_18px_40px_rgba(15,23,42,0.4)]`}>
        {object.symbol}
      </div>
    </div>
  );
}

export default function ChemistryHandScene() {
  const { t } = useLanguage();
  const runtime = useHandTrackingRuntime();
  const stageRef = useRef(null);
  const { objects, isComplete, resetScene } = useInteractiveHandScene({
    scene: CHEMISTRY_SCENE,
    hands: runtime.frame.hands,
  });
  const filledZones = useMemo(
    () => new Set(objects.filter((object) => object.snappedZoneId).map((object) => object.snappedZoneId)),
    [objects],
  );
  const copy = t.handLab.common;
  const chemistryCopy = t.handLab.chemistry;

  return (
    <HandTrackingStage
      title={chemistryCopy.title}
      description={chemistryCopy.description}
      badge={chemistryCopy.badge}
      accentClass="from-slate-950 via-cyan-950 to-sky-950"
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
      instructions={chemistryCopy.instructions}
      stageRef={stageRef}
      footer={(
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-300">
              <Sparkles className="h-4 w-4" />
              {chemistryCopy.objectiveTitle}
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
              {isComplete ? chemistryCopy.successBody : chemistryCopy.objectiveBody}
            </p>
          </div>

          <button
            type="button"
            onClick={resetScene}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <RefreshCw className="h-4 w-4" />
            {chemistryCopy.reset}
          </button>
        </div>
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.18),_transparent_30%)]" />

      <div className="absolute left-6 top-6 z-10 max-w-xs rounded-3xl border border-white/10 bg-black/30 px-5 py-4 text-white backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
          {chemistryCopy.stageLabel}
        </div>
        <div className="mt-2 text-2xl font-bold">H₂O</div>
        <p className="mt-2 text-sm leading-6 text-white/75">{chemistryCopy.stageHint}</p>
      </div>

      <div className="absolute bottom-6 left-6 z-10 rounded-3xl border border-white/10 bg-black/30 px-5 py-4 text-white backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
          {chemistryCopy.inventory}
        </div>
        <div className="mt-2 text-sm text-white/75">{chemistryCopy.inventoryHint}</div>
      </div>

      <div className="absolute inset-y-[22%] left-[40%] right-[10%] rounded-[2.5rem] border border-white/10 bg-white/5" />

      {CHEMISTRY_SCENE.snapZones.map((zone) => (
        <MoleculeZone
          key={zone.id}
          zone={zone}
          label={zone.accepts[0] === 'oxygen' ? 'O' : 'H'}
          isFilled={filledZones.has(zone.id)}
        />
      ))}

      {objects.map((object) => (
        <AtomCard key={object.id} object={object} />
      ))}

      {isComplete ? (
        <div className="absolute inset-x-0 top-[12%] z-20 mx-auto flex max-w-md items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-lg backdrop-blur">
          {chemistryCopy.successBanner}
        </div>
      ) : null}
    </HandTrackingStage>
  );
}
