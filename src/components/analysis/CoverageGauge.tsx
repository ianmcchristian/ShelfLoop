// ─── Coverage Gauge ───────────────────────────────────────────────────────────
// Flat horizontal strip — no card outline, blends into the page header.
// Arc → big % → divider → inline read/missed stats.

const R    = 28;
const CIRC = 2 * Math.PI * R; // ≈ 175.93

// Matches 3D cube stops exactly
function arcColor(pct: number): string {
  if (pct >= 93) return '#16a34a'; // rich green
  if (pct >= 85) return '#22c55e'; // vivid green
  if (pct >= 84) return '#fca5a5'; // light red — red-300
  if (pct >= 70) return '#f87171'; // medium red
  if (pct >= 1)  return '#ef4444'; // vivid red
  return '#7f1d1d';                // maroon — 0% only
}

function pctTextColor(pct: number): string {
  if (pct >= 93) return '#15803d';
  if (pct >= 85) return '#16a34a';
  if (pct >= 70) return '#dc2626';
  if (pct >= 1)  return '#b91c1c';
  return '#7f1d1d';
}

export interface CoverageGaugeProps {
  overallPct: number | null;
  totalRead: number;
  totalMissed: number;
  totalUnresolved: number;
}

export function CoverageGauge({
  overallPct,
  totalRead,
  totalMissed,
  totalUnresolved,
}: CoverageGaugeProps) {
  const hasData    = overallPct !== null;
  const dashOffset = hasData ? CIRC * (1 - overallPct / 100) : CIRC;
  const arcFill    = hasData ? arcColor(overallPct) : '#e2e8f0';

  return (
    <div className="flex items-center gap-4">
      {/* Mini arc */}
      <svg viewBox="0 0 70 70" width={58} height={58} className="shrink-0" aria-hidden="true">
        <circle cx="35" cy="35" r={R} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="35" cy="35" r={R}
          fill="none"
          stroke={arcFill}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 35 35)"
          style={{ transition: 'stroke-dashoffset 0.7s ease-out, stroke 0.4s ease' }}
        />
        <text
          x="35" y="35"
          textAnchor="middle" dominantBaseline="middle"
          fontSize="13" fontWeight="900"
          fill={hasData ? pctTextColor(overallPct) : '#cbd5e1'}
          style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
        >
          {hasData ? `${overallPct}%` : '--'}
        </text>
      </svg>

      {/* Label */}
      <div className="flex flex-col">
        <span className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-400">
          Coverage
        </span>
        {hasData ? (
          <span
            className="text-xl font-black leading-tight tabular-nums"
            style={{ color: pctTextColor(overallPct) }}
          >
            {overallPct}%
          </span>
        ) : (
          <span className="text-xl font-black leading-tight text-slate-300">--</span>
        )}
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-slate-200" />

      {/* Inline stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className={`text-sm font-black ${hasData ? 'text-emerald-600' : 'text-slate-300'}`}>
            {hasData ? totalRead : '--'}
          </span>
          <span className="text-xs font-semibold text-slate-400">read</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <span className={`text-sm font-black ${hasData ? 'text-red-500' : 'text-slate-300'}`}>
            {hasData ? totalMissed : '--'}
          </span>
          <span className="text-xs font-semibold text-slate-400">missed</span>
        </div>
        {hasData && totalUnresolved > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-slate-300" />
            <span className="text-sm font-black text-slate-400">{totalUnresolved}</span>
            <span className="text-xs font-semibold text-slate-400">unresolved</span>
          </div>
        )}
      </div>
    </div>
  );
}
