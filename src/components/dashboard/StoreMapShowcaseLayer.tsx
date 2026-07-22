import { useEffect, useRef, useState } from 'react';
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
          <linearGradient id="rfid-vert-grad" x1="0" y1="36" x2="0" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
          {/* Explicit bounds required — default maskUnits="userSpaceOnUse" clips to (-10,-10)→(110,110) */}
          <mask id="rfid-vert-mask" maskUnits="userSpaceOnUse" x="-300" y="-100" width="700" height="350">
            <rect x="-400" y="-400" width="1000" height="1000" fill="url(#rfid-vert-grad)" />
          </mask>

          {/*
            Horizontal mask — opaque centre, fades to black at ±rx extents.
            Gradient spans the full max ellipse width: cx=50 ± rx=240 → x1=-190, x2=290.
            Opaque zone 12%–88% covers ≈ cx±180 (75 % of max rx) before any fade begins.
            Nested <g mask> composes multiplicatively with the vertical mask — no blend-mode hacks.
          */}
          {/* Gradient spans cx=50 ± rx=120, with fade zone either side → x1=-90, x2=190 */}
          <linearGradient id="rfid-horiz-grad" x1="-90" y1="0" x2="190" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="black" />
            <stop offset="12%" stopColor="white" />
            <stop offset="88%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>
          <mask id="rfid-horiz-mask" maskUnits="userSpaceOnUse" x="-300" y="-100" width="700" height="350">
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
      {/*
       * Path from the aisle at box-12 level (24%, 82%) to Rack A (28%, 48%).
       * Gentle upward curve -- worker walks up out of the backroom to the sales floor.
       */}
      <path
        className="animate-showcase-dash"
        d="M 24 82 C 24 64, 28 55, 28 48"
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

function PhoneStatusBar() {
  return (
    <div className="flex items-center justify-between px-4">
      <span className="text-[9px] font-semibold tracking-tight text-white">9:41</span>
      <div className="flex items-center gap-1.5">
        {/* Signal bars */}
        <svg aria-hidden="true" fill="none" height="8" viewBox="0 0 11 8" width="11">
          <rect fill="white" fillOpacity="0.35" height="3" rx="0.4" width="2" x="0" y="5" />
          <rect fill="white" fillOpacity="0.6" height="5" rx="0.4" width="2" x="3" y="3" />
          <rect fill="white" fillOpacity="0.85" height="7" rx="0.4" width="2" x="6" y="1" />
          <rect fill="white" height="8" rx="0.4" width="2" x="9" y="0" />
        </svg>
        {/* Battery */}
        <div className="flex items-center gap-px">
          <div className="relative h-[8px] w-[14px] rounded-[2px] border border-white/70">
            <div className="absolute inset-[1.5px] right-[1.5px] rounded-[1px] bg-white" />
          </div>
          <div className="h-[4px] w-[1.5px] rounded-r-full bg-white/60" />
        </div>
      </div>
    </div>
  );
}

type PhoneStep = 'blank' | 'notification' | 'scanning' | 'results';

/** Total internal phone timeline: TTL press ends 12.6s, slide-down completes ~13.25s */
const PHONE_TIMELINE_END_MS = 13_250;

function PhoneHomeScreen({
  step,
  targetSku,
  targetItemName,
}: {
  step: PhoneStep;
  targetSku: string;
  targetItemName: string;
}) {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 380);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* App header */}
      <div className="flex-none bg-retail-blue px-5 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">ShelfLoop</p>
        <div className="mt-1 flex items-center justify-between">
          <h2 className="text-xl font-black">Tasks</h2>
          {step === 'notification' ? (
            <span className="rounded-full bg-red-400 px-3 py-1 text-xs font-black">1 active</span>
          ) : (
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/80">All clear</span>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-hidden bg-slate-50 p-4">
        {step === 'blank' && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg aria-hidden="true" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-500">No active tasks</p>
            <p className="text-xs font-medium text-slate-500">
              Monitoring rack inventory
              <span className="inline-block w-4 text-left">{'.'.repeat(dots)}</span>
            </p>
          </div>
        )}

        {step === 'notification' && (
          <div className="animate-showcase-notif-in rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100">
                <svg aria-hidden="true" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 6v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                  <circle cx="10" cy="14.5" fill="currentColor" r="0.8" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide text-red-600">Missing item</span>
                  <span className="text-[10px] text-slate-400">just now</span>
                </div>
                <p className="mt-1 text-sm font-black text-retail-ink">{targetSku}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{targetItemName}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="text-[11px] font-semibold text-slate-500">Rack A · Position 15</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PhoneScanningScreen({
  targetSku,
  targetItemName,
}: {
  targetSku: string;
  targetItemName: string;
}) {
  return (
    <div className="animate-showcase-fade-up flex h-full flex-col">
      <div className="flex-none bg-retail-blue px-5 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">ShelfLoop</p>
        <div className="mt-1 flex items-center justify-between">
          <h2 className="text-xl font-black">Checking stock…</h2>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden bg-slate-50 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
          <div className="flex gap-1.5">
            <span className="animate-showcase-scan-dot block h-2.5 w-2.5 rounded-full bg-retail-blue" style={{ animationDelay: '0ms' }} />
            <span className="animate-showcase-scan-dot block h-2.5 w-2.5 rounded-full bg-retail-blue" style={{ animationDelay: '200ms' }} />
            <span className="animate-showcase-scan-dot block h-2.5 w-2.5 rounded-full bg-retail-blue" style={{ animationDelay: '400ms' }} />
          </div>
          <p className="text-sm font-semibold text-slate-500">Scanning backroom inventory…</p>
        </div>
        <div className="rounded-xl bg-red-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-red-500">Missing item</p>
          <p className="mt-1.5 text-base font-black text-retail-ink">{targetSku}</p>
          <p className="mt-0.5 text-sm text-slate-500">{targetItemName}</p>
        </div>
      </div>
    </div>
  );
}

function PhoneResultsScreen({ ttlPressed }: { ttlPressed: boolean }) {
  return (
    <div className="animate-showcase-fade-up flex h-full flex-col">
      <div className="flex-none bg-retail-blue px-5 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">ShelfLoop</p>
        <div className="mt-1 flex items-center gap-2">
          <h2 className="text-xl font-black">Stock found</h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400">
            <svg aria-hidden="true" fill="none" height="10" viewBox="0 0 8 8" width="10">
              <path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden bg-slate-50 p-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            Reserve stock located
          </p>
          <p className="mt-1.5 text-base font-black text-retail-ink">Backroom · Bin 7</p>
          <p className="mt-0.5 text-sm text-slate-500">3 units available</p>
        </div>
        <div
          className={`flex items-center justify-between rounded-xl bg-retail-blue px-5 py-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-sm${
            ttlPressed ? ' animate-showcase-ttl-press' : ''
          }`}
        >
          <span>Activate Tap-to-Light</span>
          <svg aria-hidden="true" fill="none" height="14" viewBox="0 0 12 12" width="14">
            <path d="M2 6H10M10 6L7.5 3.5M10 6L7.5 8.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function PhoneTaskOverlay({
  isPaused,
  targetItemName,
  targetSku,
}: {
  isPaused: boolean;
  targetItemName: string;
  targetSku: string;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  // Accumulated phone-time before the current run segment (survives pause/resume)
  const baseElapsedRef = useRef(0);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setHasEntered(true));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (isPaused || baseElapsedRef.current >= PHONE_TIMELINE_END_MS) {
      return;
    }

    // Real-time clock: measured from performance.now(), not accumulated fake ticks.
    // The old approach re-created the interval on every tick, drifting ~5-10% slow
    // and letting the showcase timeline unmount the phone mid-exit.
    const segmentStartMs = performance.now();

    const timer = window.setInterval(() => {
      const totalMs = baseElapsedRef.current + (performance.now() - segmentStartMs);
      setElapsedMs(Math.min(totalMs, PHONE_TIMELINE_END_MS));
    }, 50);

    return () => {
      baseElapsedRef.current += performance.now() - segmentStartMs;
      window.clearInterval(timer);
    };
  }, [isPaused]);

  // Phone timeline with 2s holds throughout:
  //   0–2000ms    blank (scanning for tasks)
  //   2000–4100ms notification card visible (2s hold, then 0.1s tap matches CSS delay)
  //   4100–8100ms scanning screen (4s)
  //   8100ms+     results screen
  //   10100ms     TTL press starts (2s after results)
  //   10600ms     TTL press ends (0.5s), phone begins descending
  //   ~11250ms    phone fully off-screen
  const step: PhoneStep =
    elapsedMs < 2_000
      ? 'blank'
      : elapsedMs < 4_100
        ? 'notification'
        : elapsedMs < 8_100
          ? 'scanning'
          : 'results';

  const ttlPressed = elapsedMs >= 10_100;
  const isClosing = elapsedMs >= 10_600;
  const isHidden = elapsedMs >= 13_250;
  const isHomeStep = step === 'blank' || step === 'notification';
  const isPhoneVisible = hasEntered && !isClosing;
  const isBackdropVisible = hasEntered && !isClosing;

  if (isHidden) {
    return null;
  }

  return (
    <div className={`absolute inset-0 z-[90]${isPaused ? ' showcase-paused' : ''}`}>
      <div
        className={`absolute inset-0 bg-slate-950/20 backdrop-blur-sm transition-opacity duration-[400ms] ${
          isBackdropVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {/* w-[20rem] × h-[688px] ≈ 1:2.15 — standard iPhone portrait ratio */}
        {/* Phone stays fully opaque — translate-y-[150%] already puts it off-screen,
            so opacity would just make it ghost-fade mid-descent. Transform only. */}
        <div
          className={`relative h-[688px] w-[20rem] rounded-[3rem] border-[11px] border-slate-950 bg-slate-950 shadow-[0_32px_90px_rgba(15,23,42,0.6)] transition-transform ${
            isPhoneVisible ? 'translate-y-0' : 'translate-y-[150%]'
          }`}
          style={{
            transitionDuration: isClosing ? '650ms' : '520ms',
            transitionTimingFunction: isClosing
              ? 'cubic-bezier(0.55, 0, 0.78, 0.2)'
              : 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Volume up */}
          <div className="absolute -left-[14px] top-16 h-8 w-[5px] rounded-l-full bg-slate-700" />
          {/* Volume down */}
          <div className="absolute -left-[14px] top-[6.5rem] h-11 w-[5px] rounded-l-full bg-slate-700" />
          {/* Power */}
          <div className="absolute -right-[14px] top-20 h-14 w-[5px] rounded-r-full bg-slate-700" />

          {/* Screen fills fixed phone height via flex-col h-full */}
          <div className="flex h-full flex-col overflow-hidden rounded-[2.2rem]">
            <div className="flex-none bg-slate-950 pb-2 pt-3">
              <div className="mx-auto mb-2 h-[22px] w-[88px] rounded-full bg-black" />
              <PhoneStatusBar />
            </div>

            {/* Flex-1 fills all remaining height */}
            <div className="min-h-0 flex-1 overflow-hidden bg-slate-50">
              {isHomeStep && (
                <PhoneHomeScreen step={step} targetSku={targetSku} targetItemName={targetItemName} />
              )}
              {step === 'scanning' && (
                <PhoneScanningScreen targetSku={targetSku} targetItemName={targetItemName} />
              )}
              {step === 'results' && <PhoneResultsScreen ttlPressed={ttlPressed} />}
            </div>

            {/* Home indicator */}
            <div className="flex-none flex justify-center bg-slate-50 pb-4 pt-2">
              <div className="h-[5px] w-24 rounded-full bg-slate-300" />
            </div>
          </div>
        </div>
      </div>
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
      <GuidancePath phase={phase} />
      <RFIDPulseWave phase={phase} />
      <ShopperActor phase={phase} />
      <WorkerActor phase={phase} />
      {phase === 'task-alert' ? (
        <PhoneTaskOverlay isPaused={isPaused} targetItemName={targetItemName} targetSku={targetSku} />
      ) : null}
    </div>
  );
}
