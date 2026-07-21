// ─── Rig Summary Panel ────────────────────────────────────────────────────────
// Idle-state occupant of the right column (shown when no single box is selected).
// Deliberately NON-redundant with the rest of the page:
//   • header ScanTally  → read / missed totals
//   • ActionsPanel      → Y1 (overall coverage) + Y2 (CV)
//   • 3D cubes          → coverage as COLOUR only, no numbers, hard to compare
// This panel adds the two things missing: exact per-box coverage laid out in the
// physical 2×2×2 rig geometry, and a per-face aggregate (which faces read worst
// across the whole rig — the actionable signal for antenna aim).

import type { AnalysisRun, BoxFace, BoxResult } from './rfidTypes';
import { BOX_FACES, RIG_LAYOUT } from './rfidTypes';

const FACE_DISPLAY: Partial<Record<BoxFace, string>> = { Top: 'Up', Bottom: 'Down' };

// Boxes at each (row, col) of a layer, in NW · NE · SW · SE reading order.
const GRID_CELLS: [row: 0 | 1, col: 0 | 1][] = [[0, 0], [0, 1], [1, 0], [1, 1]];

function boxAt(layer: 0 | 1, row: 0 | 1, col: 0 | 1): number {
  const found = Object.entries(RIG_LAYOUT).find(
    ([, p]) => p.layer === layer && p.row === row && p.col === col,
  );
  return found ? Number(found[0]) : 0;
}

function coverageTone(pct: number): { text: string; bar: string } {
  if (pct >= 80) return { text: 'text-emerald-600', bar: 'bg-emerald-500' };
  if (pct >= 50) return { text: 'text-amber-600',  bar: 'bg-amber-500' };
  return { text: 'text-red-500', bar: 'bg-red-400' };
}

// ─── Spatial layer grid ───────────────────────────────────────────────────────

function LayerGrid({ layer, label, boxMap }: {
  layer: 0 | 1;
  label: string;
  boxMap: Map<number, BoxResult>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[0.55rem] font-black uppercase tracking-[0.1em] text-slate-500">{label}</span>
        <span className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-slate-300">N ▲</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {GRID_CELLS.map(([row, col]) => {
          const n   = boxAt(layer, row, col);
          const box = boxMap.get(n);
          const has = box !== undefined;
          const tone = has ? coverageTone(box.coveragePct) : null;
          return (
            <div
              key={n}
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-2 shadow-sm"
            >
              <span className="text-[0.5rem] font-bold uppercase tracking-[0.08em] text-slate-400">
                Box {n}
              </span>
              <span className={`text-base font-black tabular-nums ${tone ? tone.text : 'text-slate-300'}`}>
                {has ? `${box.coveragePct}%` : '--'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Per-face aggregate ───────────────────────────────────────────────────────

interface FaceAgg { face: BoxFace; readCount: number; missCount: number; pct: number }

function aggregateFaces(scanResult: AnalysisRun): FaceAgg[] {
  return BOX_FACES.map((face) => {
    let readCount = 0;
    let missCount = 0;
    for (const box of scanResult.boxResults) {
      const f = box.faces.find((x) => x.face === face);
      if (!f) continue;
      readCount += f.readCount;
      missCount += f.missCount;
    }
    const eligible = readCount + missCount;
    const pct = eligible > 0 ? Math.round((readCount / eligible) * 100) : 0;
    return { face, readCount, missCount, pct };
  }).sort((a, b) => a.pct - b.pct); // weakest first — that's the actionable end
}

function FaceBreakdown({ faces }: { faces: FaceAgg[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.55rem] font-black uppercase tracking-[0.1em] text-slate-500">
        Coverage by face
      </span>
      <div className="flex flex-col gap-1">
        {faces.map(({ face, pct, readCount, missCount }) => {
          const tone = coverageTone(pct);
          const eligible = readCount + missCount;
          return (
            <div key={face} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-[0.6rem] font-bold text-slate-600">
                {FACE_DISPLAY[face] ?? face}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`w-9 shrink-0 text-right text-[0.65rem] font-black tabular-nums ${tone.text}`}>
                {eligible > 0 ? `${pct}%` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function RigSummaryPanel({ scanResult }: { scanResult: AnalysisRun | null }) {
  const boxMap = new Map((scanResult?.boxResults ?? []).map((b) => [b.boxNumber, b]));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-black text-retail-ink">Coverage Map</h3>
        <p className="text-xs text-slate-500">
          {scanResult
            ? 'Exact per-box coverage in the 2×2×2 rig layout. Click a box for its faces.'
            : 'Load a scan to see per-box and per-face coverage across the rig.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LayerGrid layer={1} label="Top layer" boxMap={boxMap} />
        <LayerGrid layer={0} label="Bottom layer" boxMap={boxMap} />
      </div>

      {scanResult && <FaceBreakdown faces={aggregateFaces(scanResult)} />}
    </div>
  );
}
