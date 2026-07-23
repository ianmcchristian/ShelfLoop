import { PhoneTaskOverlay } from './StoreMapShowcasePhone';
import type { ShowcasePhase } from './storeMapShowcase';

interface StoreMapShowcaseLayerProps {
  isPaused: boolean;
  phase: ShowcasePhase;
  targetItemName: string;
  targetSku: string;
}

function PersonIcon({ label, tone }: { label: string; tone: 'blue' | 'emerald' }) {
  const toneClassName =
    tone === 'blue'
      ? 'border-retail-blue bg-retail-blue text-white shadow-[0_0_18px_rgba(0,113,220,0.35)]'
      : 'border-emerald-700 bg-emerald-500 text-white shadow-[0_0_18px_rgba(34,197,94,0.38)]';

  return (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${toneClassName}`}
    >
      <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M6.5 20c.8-4.1 2.6-6.2 5.5-6.2s4.7 2.1 5.5 6.2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function ActorLabel({ children }: { children: string }) {
  return (
    <span className="mt-1 rounded-full bg-white/95 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

function ShopperActor({ phase }: { phase: ShowcasePhase }) {
  const phaseClassName = (() => {
    if (phase === 'shopper-to-rack') {
      return 'animate-showcase-shopper-to-rack';
    }

    if (phase === 'shopper-pick') {
      return 'left-[40.5%] top-[52%] animate-showcase-shopper-pick';
    }

    if (phase === 'shopper-exit') {
      return 'animate-showcase-shopper-exit';
    }

    return 'hidden';
  })();

  return (
    <div
      className={`absolute z-[75] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${phaseClassName}`}
    >
      <PersonIcon label="Shopper" tone="blue" />
      <ActorLabel>Shopper</ActorLabel>
    </div>
  );
}

function WorkerActor({ phase }: { phase: ShowcasePhase }) {
  const phaseClassName = (() => {
    if (phase === 'worker-to-box') {
      return 'animate-showcase-worker-to-box';
    }

    if (phase === 'worker-box-pause') {
      // Static hold just inside the backroom entrance, right after crossing
      // the gap -- same spot worker-to-box ends at. Backroom box starts
      // glowing during this beat (see shouldShowcaseGlowBackroomBox).
      return 'left-[50%] top-[71%]';
    }

    if (phase === 'worker-grab-box') {
      return 'animate-showcase-worker-grab-box';
    }

    if (phase === 'worker-pick-box') {
      // top-[87.5%] anchors the vertical position; animation handles left
      // (quick horizontal reach toward the box and back -- see
      // showcase-worker-pick-box, deliberately modeled on the shopper's pick).
      return 'top-[87.5%] animate-showcase-worker-pick-box';
    }

    if (phase === 'worker-from-box') {
      return 'animate-showcase-worker-from-box';
    }

    if (phase === 'worker-paused') {
      // Static hold just outside the backroom entrance -- same spot
      // worker-from-box ends at. Tap-to-light starts pulsing here.
      return 'left-[50%] top-[53%]';
    }

    if (phase === 'worker-guided') {
      return 'animate-showcase-worker-guided';
    }

    if (phase === 'worker-restock') {
      // left-[41%] anchors the horizontal position (the exact missing item's
      // dot); animation handles top (nudge UP/DOWN, replenishing the item).
      return 'left-[41%] animate-showcase-worker-restock-nudge';
    }

    if (phase === 'worker-exit') {
      return 'animate-showcase-worker-exit';
    }

    return 'hidden';
  })();

  return (
    <div
      className={`absolute z-[75] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center ${phaseClassName}`}
    >
      <PersonIcon label="Worker" tone="emerald" />
      <ActorLabel>Worker</ActorLabel>
    </div>
  );
}

export function StoreMapShowcaseLayer({
  isPaused,
  phase,
  targetItemName,
  targetSku,
}: StoreMapShowcaseLayerProps) {
  if (phase === 'idle') {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[70]">
      <ShopperActor phase={phase} />
      <WorkerActor phase={phase} />
      {phase === 'task-alert' ? (
        <PhoneTaskOverlay
          isPaused={isPaused}
          targetItemName={targetItemName}
          targetSku={targetSku}
        />
      ) : null}
    </div>
  );
}
