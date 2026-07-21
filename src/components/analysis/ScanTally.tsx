// ─── Scan Tally ───────────────────────────────────────────────────────────────
// Compact read / missed (/ unresolved) counters for the page header.
// The old arc-style coverage gauge was removed — Y1 already reports overall
// coverage, so the arc was redundant. These icon counters stay because they're
// the quick at-a-glance signal.

export interface ScanTallyProps {
  totalRead: number;
  totalMissed: number;
  totalUnresolved: number;
  hasData: boolean;
}

export function ScanTally({
  totalRead,
  totalMissed,
  totalUnresolved,
  hasData,
}: ScanTallyProps) {
  return (
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
  );
}
