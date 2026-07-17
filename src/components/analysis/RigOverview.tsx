// ─── Rig Overview ─────────────────────────────────────────────────────────────
// 2x2x2 Rubik's-cube layout of all 8 boxes.
// Shows overall coverage as a hero number, then top/bottom layer grids
// with per-box coverage colouring and click-to-select.

import type { BoxResult } from './rfidTypes';
import { RIG_LAYOUT } from './rfidTypes';

// ─── Coverage colour helpers ──────────────────────────────────────────────────

function coverageBg(pct: number, hasData: boolean): string {
  if (!hasData) return 'bg-slate-100 border-slate-200 text-slate-400';
  if (pct === 100) return 'bg-emerald-100 border-emerald-400 text-emerald-800';
  if (pct >= 75) return 'bg-emerald-50 border-emerald-300 text-emerald-700';
  if (pct >= 50) return 'bg-amber-50 border-amber-300 text-amber-700';
  if (pct >= 25) return 'bg-orange-50 border-orange-300 text-orange-700';
  return 'bg-red-50 border-red-300 text-red-700';
}

function coverageBarColor(pct: number): string {
  if (pct === 100) return 'bg-emerald-500';
  if (pct >= 75) return 'bg-emerald-400';
  if (pct >= 50) return 'bg-amber-400';
  if (pct >= 25) return 'bg-orange-400';
  return 'bg-red-400';
}

function coverageTextColor(pct: number): string {
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-red-500';
}

// ─── Coverage hero ────────────────────────────────────────────────────────────

interface CoverageHeroProps {
  overallPct: number;
  totalRead: number;
  totalMissed: number;
  totalUnresolved: number;
}

function CoverageHero({ overallPct, totalRead, totalMissed, totalUnresolved }: CoverageHeroProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-400">
        Overall tag coverage
      </p>

      <div className="mb-4 flex items-end gap-4">
        <span className={`text-6xl font-black leading-none tabular-nums ${coverageTextColor(overallPct)}`}>
          {overallPct}%
        </span>
        <div className="mb-1 flex flex-col gap-1 text-xs font-semibold">
          <span className="text-emerald-600">{totalRead} tags read</span>
          <span className="text-red-400">{totalMissed} missed</span>
          {totalUnresolved > 0 && (
            <span className="text-slate-400">{totalUnresolved} unresolved</span>
          )}
        </div>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${coverageBarColor(overallPct)}`}
          style={{ width: `${overallPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Single box tile ──────────────────────────────────────────────────────────

interface BoxTileProps {
  boxNumber: number;
  result: BoxResult | undefined;
  isSelected: boolean;
  onSelect: (n: number) => void;
}

function BoxTile({ boxNumber, result, isSelected, onSelect }: BoxTileProps) {
  const hasData = result !== undefined && result.readCount + result.missCount > 0;
  const pct = result?.coveragePct ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(boxNumber)}
      className={`relative flex flex-col items-center justify-between gap-1 rounded-xl border-2 p-3 text-center transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/40 ${coverageBg(pct, hasData)} ${
        isSelected ? 'scale-105 ring-2 ring-retail-blue ring-offset-2' : ''
      }`}
    >
      <span className="text-[0.55rem] font-black uppercase tracking-[0.1em] opacity-60">Box</span>
      <span className="text-2xl font-black leading-none">{boxNumber}</span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className={`h-full rounded-full transition-all ${coverageBarColor(pct)}`}
          style={{ width: hasData ? `${pct}%` : '0%' }}
        />
      </div>
      <span className="text-[0.6rem] font-black tabular-nums">
        {hasData ? `${pct}%` : 'no data'}
      </span>
    </button>
  );
}

// ─── 2x2 layer grid ───────────────────────────────────────────────────────────

interface LayerGridProps {
  layer: 0 | 1;
  boxResults: BoxResult[];
  selectedBox: number | null;
  onSelect: (n: number) => void;
}

function LayerGrid({ layer, boxResults, selectedBox, onSelect }: LayerGridProps) {
  const layerBoxes: (number | null)[][] = [
    [null, null],
    [null, null],
  ];

  for (const [boxNum, pos] of Object.entries(RIG_LAYOUT)) {
    if (pos.layer === layer) {
      const rowArr = layerBoxes[pos.row];
      if (rowArr) rowArr[pos.col] = Number(boxNum);
    }
  }

  const resultMap = Object.fromEntries(boxResults.map((b) => [b.boxNumber, b]));

  return (
    <div className="grid grid-cols-2 gap-2">
      {layerBoxes.flat().map((boxNum, i) => {
        if (boxNum === null) return <div key={i} />;
        return (
          <BoxTile
            key={boxNum}
            boxNumber={boxNum}
            result={resultMap[boxNum]}
            isSelected={selectedBox === boxNum}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface RigOverviewProps {
  boxResults: BoxResult[];
  totalRead: number;
  totalMissed: number;
  totalUnresolved: number;
  overallPct: number;
  selectedBox: number | null;
  onBoxSelect: (n: number) => void;
}

export function RigOverview({
  boxResults,
  totalRead,
  totalMissed,
  totalUnresolved,
  overallPct,
  selectedBox,
  onBoxSelect,
}: RigOverviewProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Overall coverage hero */}
      <CoverageHero
        overallPct={overallPct}
        totalRead={totalRead}
        totalMissed={totalMissed}
        totalUnresolved={totalUnresolved}
      />

      {/* Rig grid */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            8-box rig — click a box for face detail
          </span>
          <span className="text-[0.58rem] font-semibold text-slate-400">
            Front &rarr; &nbsp; &larr; Back
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[0.6rem] font-black uppercase tracking-[0.1em] text-slate-400">
              Top layer (boxes 1–4)
            </p>
            <LayerGrid
              layer={1}
              boxResults={boxResults}
              selectedBox={selectedBox}
              onSelect={onBoxSelect}
            />
          </div>
          <div>
            <p className="mb-2 text-[0.6rem] font-black uppercase tracking-[0.1em] text-slate-400">
              Bottom layer (boxes 5–8)
            </p>
            <LayerGrid
              layer={0}
              boxResults={boxResults}
              selectedBox={selectedBox}
              onSelect={onBoxSelect}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <div className="h-2 w-2 rounded-full bg-retail-blue" />
          <span>Antenna position: above rig, centered (approximate)</span>
        </div>
      </div>
    </div>
  );
}
