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
      // left-[27%] anchors the horizontal position; animation handles top (nudge UP/DOWN)
      return 'left-[27%] animate-showcase-worker-restock-nudge';
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

function RFIDPulseWave({ phase }: { phase: ShowcasePhase }) {
  if (phase !== 'rfid-scan' && phase !== 'rfid-detect') {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-[27%] top-[28%] z-[60] -translate-x-1/2 -translate-y-1/2">
      <svg
        aria-hidden="true"
        className="h-[200px] w-[200px] overflow-visible"
        viewBox="0 0 100 100"
      >
        <defs>
          {/* Vertical mask — transparent above y=36, opaque below y=58 */}
          <linearGradient
            id="rfid-vert-grad"
            x1="0"
            y1="36"
            x2="0"
            y2="58"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="black" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
          {/* Explicit bounds required — default maskUnits="userSpaceOnUse" clips to (-10,-10)→(110,110) */}
          <mask
            id="rfid-vert-mask"
            maskUnits="userSpaceOnUse"
            x="-300"
            y="-100"
            width="700"
            height="350"
          >
            <rect x="-400" y="-400" width="1000" height="1000" fill="url(#rfid-vert-grad)" />
          </mask>

          {/*
            Horizontal mask — opaque centre, fades to black at ±rx extents.
            Gradient spans the full max ellipse width: cx=50 ± rx=240 → x1=-190, x2=290.
            Opaque zone 12%–88% covers ≈ cx±180 (75 % of max rx) before any fade begins.
            Nested <g mask> composes multiplicatively with the vertical mask — no blend-mode hacks.
          */}
          {/* Gradient spans cx=50 ± rx=120, with fade zone either side → x1=-90, x2=190 */}
          <linearGradient
            id="rfid-horiz-grad"
            x1="-90"
            y1="0"
            x2="190"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="black" />
            <stop offset="12%" stopColor="white" />
            <stop offset="88%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>
          <mask
            id="rfid-horiz-mask"
            maskUnits="userSpaceOnUse"
            x="-300"
            y="-100"
            width="700"
            height="350"
          >
            <rect x="-400" y="-400" width="1000" height="1000" fill="url(#rfid-horiz-grad)" />
          </mask>

          <filter id="rfid-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Nested masks compose multiplicatively (SVG spec) — no blend-mode tricks needed */}
        <g mask="url(#rfid-vert-mask)">
          <g mask="url(#rfid-horiz-mask)">
            {/* Ring 1 — fastest, most opaque */}
            <ellipse
              cx="50"
              cy="50"
              rx="5"
              ry="2"
              fill="rgba(0,113,220,0.07)"
              stroke="rgba(0,113,220,0.9)"
              strokeWidth="1.5"
              filter="url(#rfid-glow)"
            >
              <animate attributeName="rx" from="5" to="120" dur="3s" fill="freeze" />
              <animate attributeName="ry" from="2" to="65" dur="3s" fill="freeze" />
              <animate attributeName="opacity" from="0.9" to="0" dur="3s" fill="freeze" />
            </ellipse>

            {/* Ring 2 — slight delay, fades in then out */}
            <ellipse
              cx="50"
              cy="50"
              rx="5"
              ry="2"
              opacity="0"
              fill="rgba(0,113,220,0.05)"
              stroke="rgba(0,113,220,0.75)"
              strokeWidth="1.2"
              filter="url(#rfid-glow)"
            >
              <animate attributeName="rx" from="5" to="120" dur="3.6s" begin="0.4s" fill="freeze" />
              <animate attributeName="ry" from="2" to="65" dur="3.6s" begin="0.4s" fill="freeze" />
              <animate
                attributeName="opacity"
                values="0;0.72;0"
                keyTimes="0;0.15;1"
                dur="3.6s"
                begin="0.4s"
                fill="freeze"
              />
            </ellipse>

            {/* Ring 3 — slowest, most delayed */}
            <ellipse
              cx="50"
              cy="50"
              rx="5"
              ry="2"
              opacity="0"
              fill="rgba(0,113,220,0.04)"
              stroke="rgba(0,113,220,0.55)"
              strokeWidth="1"
              filter="url(#rfid-glow)"
            >
              <animate attributeName="rx" from="5" to="120" dur="4.2s" begin="0.8s" fill="freeze" />
              <animate attributeName="ry" from="2" to="65" dur="4.2s" begin="0.8s" fill="freeze" />
              <animate
                attributeName="opacity"
                values="0;0.52;0"
                keyTimes="0;0.18;1"
                dur="4.2s"
                begin="0.8s"
                fill="freeze"
              />
            </ellipse>
          </g>
        </g>
      </svg>
    </div>
  );
}

function GuidancePath({ phase }: { phase: ShowcasePhase }) {
  if (phase !== 'worker-paused' && phase !== 'worker-guided' && phase !== 'worker-restock') {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[65] h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {/*
       * Path from the backroom entrance (50%, 53%) to Rack A (27%, 48%).
       * Gentle curve -- worker walks out of the backroom to the sales floor.
       */}
      <path
        className="animate-showcase-dash"
        d="M 50 53 C 40 51, 30 49, 27 48"
        fill="none"
        stroke="rgba(0,113,220,0.88)"
        strokeDasharray="4 4"
        strokeLinecap="round"
        strokeWidth="0.8"
      />
      <circle cx="27" cy="48" fill="rgba(34,197,94,0.9)" r="1.2" />
    </svg>
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
      <GuidancePath phase={phase} />
      <RFIDPulseWave phase={phase} />
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
