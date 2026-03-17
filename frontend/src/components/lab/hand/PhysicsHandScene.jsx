import { BatteryCharging, Lightbulb, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import HandTrackingStage from '../../../features/handTracking/HandTrackingStage';
import { useInteractiveHandScene } from '../../../features/handTracking/useInteractiveHandScene';
import { useHandTrackingRuntime } from '../../../features/handTracking/useHandTrackingRuntime';

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
    { id: 'zone-battery', accepts: ['battery'], x: 0.48, y: 0.22, w: 0.16, h: 0.12 },
    { id: 'zone-wire-top', accepts: ['wire'], x: 0.67, y: 0.12, w: 0.19, h: 0.1 },
    { id: 'zone-lamp', accepts: ['lamp'], x: 0.76, y: 0.34, w: 0.14, h: 0.14 },
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

function CircuitZone({ zone, label, active }) {
  return (
    <div
      className={`absolute rounded-[1.8rem] border border-dashed px-3 py-2 text-center transition-all ${active ? 'border-emerald-300 bg-emerald-400/15 text-emerald-100' : 'border-white/30 bg-white/5 text-white/65'}`}
      style={{
        left: `${zone.x * 100}%`,
        top: `${zone.y * 100}%`,
        width: `${zone.w * 100}%`,
        height: `${zone.h * 100}%`,
      }}
    >
      <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.2em]">
        {label}
      </div>
    </div>
  );
}

function CircuitObject({ object }) {
  const Icon = object.kind === 'battery' ? BatteryCharging : object.kind === 'lamp' ? Lightbulb : Zap;

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
      <div className={`flex h-full w-full items-center gap-3 rounded-[1.7rem] border border-white/10 bg-gradient-to-br ${object.accent} px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.4)]`}>
        <Icon className="h-5 w-5 shrink-0" />
        <span>{object.label}</span>
      </div>
    </div>
  );
}

export default function PhysicsHandScene() {
  const { t } = useLanguage();
  const runtime = useHandTrackingRuntime();
  const stageRef = useRef(null);
  const { objects, isComplete, resetScene } = useInteractiveHandScene({
    scene: PHYSICS_SCENE,
    hands: runtime.frame.hands,
  });
  const filledZones = useMemo(
    () => new Set(objects.filter((object) => object.snappedZoneId).map((object) => object.snappedZoneId)),
    [objects],
  );
  const copy = t.handLab.common;
  const physicsCopy = t.handLab.physics;

  return (
    <HandTrackingStage
      title={physicsCopy.title}
      description={physicsCopy.description}
      badge={physicsCopy.badge}
      accentClass="from-slate-950 via-emerald-950 to-teal-950"
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
      instructions={physicsCopy.instructions}
      stageRef={stageRef}
      footer={(
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-300">
              <Sparkles className="h-4 w-4" />
              {physicsCopy.objectiveTitle}
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
              {isComplete ? physicsCopy.successBody : physicsCopy.objectiveBody}
            </p>
          </div>

          <button
            type="button"
            onClick={resetScene}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4" />
            {physicsCopy.reset}
          </button>
        </div>
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_30%)]" />

      <div className="absolute left-6 top-6 z-10 max-w-xs rounded-3xl border border-white/10 bg-black/30 px-5 py-4 text-white backdrop-blur">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
          {physicsCopy.stageLabel}
        </div>
        <div className="mt-2 text-2xl font-bold">{physicsCopy.stageTitle}</div>
        <p className="mt-2 text-sm leading-6 text-white/75">{physicsCopy.stageHint}</p>
      </div>

      <div className="absolute inset-y-[12%] left-[42%] right-[8%] rounded-[2.7rem] border border-white/10 bg-white/5" />

      <div className="absolute left-[56%] top-[28%] h-[2px] w-[18%] bg-white/20" />
      <div className="absolute left-[78%] top-[40%] h-[18%] w-[2px] bg-white/20" />
      <div className="absolute left-[62%] top-[72%] h-[2px] w-[24%] bg-white/20" />
      <div className="absolute left-[56%] top-[34%] h-[40%] w-[2px] bg-white/20" />

      <CircuitZone zone={PHYSICS_SCENE.snapZones[0]} label={physicsCopy.zoneBattery} active={filledZones.has('zone-battery')} />
      <CircuitZone zone={PHYSICS_SCENE.snapZones[1]} label={physicsCopy.zoneTopWire} active={filledZones.has('zone-wire-top')} />
      <CircuitZone zone={PHYSICS_SCENE.snapZones[2]} label={physicsCopy.zoneLamp} active={filledZones.has('zone-lamp')} />
      <CircuitZone zone={PHYSICS_SCENE.snapZones[3]} label={physicsCopy.zoneBottomWire} active={filledZones.has('zone-wire-bottom')} />

      {objects.map((object) => (
        <CircuitObject key={object.id} object={object} />
      ))}

      {isComplete ? (
        <>
          <div className="absolute inset-x-0 top-[12%] z-20 mx-auto flex max-w-md items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-500/20 px-5 py-3 text-sm font-semibold text-emerald-100 shadow-lg backdrop-blur">
            {physicsCopy.successBanner}
          </div>
          <div className="absolute left-[81%] top-[41%] z-20 flex h-16 w-16 items-center justify-center rounded-full bg-amber-300/80 shadow-[0_0_40px_rgba(253,224,71,0.75)]">
            <Lightbulb className="h-8 w-8 text-amber-950" />
          </div>
        </>
      ) : null}
    </HandTrackingStage>
  );
}
