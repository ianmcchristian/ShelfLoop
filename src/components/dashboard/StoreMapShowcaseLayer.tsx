import type { ShowcasePhase } from './storeMapShowcase';

interface StoreMapShowcaseLayerProps {
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
      return 'left-[42%] top-[52%]';
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

    if (phase === 'worker-guided') {
      return 'animate-showcase-worker-guided';
    }

    if (phase === 'worker-restock') {
      return 'left-[27%] top-[48%]';
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

function ItemPickupPopup({
  itemName,
  sku,
  phase,
}: {
  itemName: string;
  sku: string;
  phase: ShowcasePhase;
}) {
  if (phase !== 'shopper-pick') {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-[42%] top-[35%] z-[76] -translate-x-1/2 -translate-y-1/2">
      <span className="w-max max-w-48 border border-retail-blue/20 bg-white px-2.5 py-2 text-left text-[0.65rem] font-bold leading-4 text-slate-700 shadow-retail block">
        <span className="block font-black uppercase tracking-[0.16em] text-retail-blue">
          {sku}
        </span>
        <span className="block whitespace-nowrap text-retail-ink">{itemName}</span>
      </span>
    </div>
  );
}

function GuidancePath({ phase }: { phase: ShowcasePhase }) {
  if (phase !== 'worker-guided' && phase !== 'worker-restock') {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[65] h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <path
        className="animate-showcase-dash"
        d="M 50 82 C 50 67, 36 62, 28 48"
        fill="none"
        stroke="rgba(0,113,220,0.88)"
        strokeDasharray="4 4"
        strokeLinecap="round"
        strokeWidth="0.8"
      />
      <circle cx="28" cy="48" fill="rgba(34,197,94,0.9)" r="1.2" />
    </svg>
  );
}

function PhoneTaskOverlay({
  targetItemName,
  targetSku,
}: {
  targetItemName: string;
  targetSku: string;
}) {
  return (
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm">
      <div className="w-[18rem] rounded-[2rem] border-[10px] border-slate-950 bg-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.38)]">
        <div className="overflow-hidden rounded-[1.25rem] bg-white">
          <div className="bg-retail-blue px-4 py-3 text-white">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] opacity-80">
              ShelfLoop task
            </p>
            <h3 className="mt-1 text-lg font-black">New replenishment</h3>
          </div>
          <div className="space-y-3 p-4 text-left">
            <div className="rounded-xl bg-red-50 p-3">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-red-600">
                Missing item detected
              </p>
              <p className="mt-1 text-sm font-black text-retail-ink">{targetSku}</p>
              <p className="text-xs font-semibold text-slate-600">{targetItemName}</p>
            </div>
            <div className="rounded-xl bg-retail-blue-light p-3">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-retail-blue">
                Assigned route
              </p>
              <p className="mt-1 text-sm font-bold text-retail-ink">
                Pick reserve box → Restock Rack A
              </p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
              <span>Accepted</span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.75)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoreMapShowcaseLayer({
  phase,
  targetItemName,
  targetSku,
}: StoreMapShowcaseLayerProps) {
  if (phase === 'idle') {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[70]">
      <GuidancePath phase={phase} />
      <ItemPickupPopup itemName={targetItemName} sku={targetSku} phase={phase} />
      <ShopperActor phase={phase} />
      <WorkerActor phase={phase} />
      {phase === 'task-alert' ? (
        <PhoneTaskOverlay targetItemName={targetItemName} targetSku={targetSku} />
      ) : null}
    </div>
  );
}
