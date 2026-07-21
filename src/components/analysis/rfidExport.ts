// ─── RFID Export Utilities ────────────────────────────────────────────────────
// Builds CSV export strings from a completed AnalysisRun.
//
// Two formats:
//   buildRunSummaryCsv  — one row per run, designed to stack across 16 tests.
//                         Columns: config · coverage % · per-box % · face % ·
//                         layer split · per-box RSSI mean.
//   buildTagDetailCsv   — one row per placement slot (read / missed / unresolved).
//                         Config columns repeated so it's also stackable.
//
// Both include antenna config columns so a stack of N exports is immediately
// pivot-ready without any manual metadata entry.

import type { AnalysisRun, BoxFace } from './rfidTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_FACES: BoxFace[] = ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'];
const TOP_BOXES    = [1, 2, 3, 4];
const BOTTOM_BOXES = [5, 6, 7, 8];
const ALL_BOXES    = [1, 2, 3, 4, 5, 6, 7, 8];

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Quote a CSV cell — handles commas, quotes, and newlines. */
function q(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Per-box RSSI mean, derived from slot read states + rssiSuffixMap. */
function computeBoxRssiMeans(
  run: AnalysisRun,
  rssiSuffixMap: Map<string, number>,
): Map<number, number | null> {
  const out = new Map<number, number | null>();
  for (const box of run.boxResults) {
    const vals: number[] = [];
    for (const face of box.faces) {
      for (const slot of face.slots) {
        if (slot.state === 'read') {
          const key = (slot.fullEpc ?? slot.label).slice(-7).toUpperCase();
          const rssi = rssiSuffixMap.get(key);
          if (rssi !== undefined) vals.push(rssi);
        }
      }
    }
    out.set(box.boxNumber, mean(vals));
  }
  return out;
}

/** Coverage % for a subset of box numbers. */
function layerCoveragePct(run: AnalysisRun, boxes: number[]): number {
  const boxMap = new Map(run.boxResults.map((b) => [b.boxNumber, b]));
  let reads = 0, total = 0;
  for (const n of boxes) {
    const b = boxMap.get(n);
    if (!b) continue;
    reads += b.readCount;
    total += b.readCount + b.missCount;
  }
  return total > 0 ? (reads / total) * 100 : 0;
}

/** Coverage % for one face aggregated across all boxes. */
function faceCoveragePct(run: AnalysisRun, face: BoxFace): number {
  let reads = 0, total = 0;
  for (const box of run.boxResults) {
    const fr = box.faces.find((f) => f.face === face);
    if (!fr) continue;
    reads += fr.readCount;
    total += fr.readCount + fr.missCount;
  }
  return total > 0 ? (reads / total) * 100 : 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * One-row summary CSV — stack 16 of these for a cross-run pivot table.
 * Returns the full CSV string (header row + data row).
 *
 * Columns:
 *   run_name · antenna · orientation · range · power
 *   overall_coverage_pct · total_reads · total_tags · unresolved_reads
 *   top_layer_pct · bottom_layer_pct
 *   box_1_pct … box_8_pct
 *   face_front_pct … face_bottom_pct
 *   box_1_rssi_mean … box_8_rssi_mean
 *   exported_at
 */
export function buildRunSummaryCsv(
  run: AnalysisRun,
  rssiSuffixMap: Map<string, number>,
): string {
  const boxMap   = new Map(run.boxResults.map((b) => [b.boxNumber, b]));
  const rssiMeans = computeBoxRssiMeans(run, rssiSuffixMap);

  const headers = [
    'run_name', 'antenna', 'orientation', 'range', 'power',
    'overall_coverage_pct', 'total_reads', 'total_tags', 'unresolved_reads',
    'top_layer_pct', 'bottom_layer_pct',
    ...ALL_BOXES.map((n) => `box_${n}_pct`),
    ...ALL_FACES.map((f) => `face_${f.toLowerCase()}_pct`),
    ...ALL_BOXES.map((n) => `box_${n}_rssi_mean_dbm`),
    'exported_at',
  ];

  const data = [
    q(run.meta.name || 'Unnamed'),
    q(run.meta.antenna), q(run.meta.orientation), q(run.meta.range), q(run.meta.power),
    run.overallCoveragePct.toFixed(1),
    run.totalRead, run.totalTags, run.totalUnresolved,
    layerCoveragePct(run, TOP_BOXES).toFixed(1),
    layerCoveragePct(run, BOTTOM_BOXES).toFixed(1),
    ...ALL_BOXES.map((n) => (boxMap.get(n)?.coveragePct ?? 0).toFixed(1)),
    ...ALL_FACES.map((f) => faceCoveragePct(run, f).toFixed(1)),
    ...ALL_BOXES.map((n) => {
      const r = rssiMeans.get(n);
      return r !== null && r !== undefined ? r.toFixed(1) : '';
    }),
    q(new Date().toISOString()),
  ];

  return [headers.join(','), data.join(',')].join('\n');
}

/**
 * Full tag-level detail CSV — one row per placement slot.
 * Config columns are repeated on every row so stacking works here too.
 *
 * Columns:
 *   run_name · antenna · orientation · range · power
 *   box · face · position · label · full_epc · state · rssi_dbm
 */
export function buildTagDetailCsv(
  run: AnalysisRun,
  rssiSuffixMap: Map<string, number>,
): string {
  const headers = [
    'run_name', 'antenna', 'orientation', 'range', 'power',
    'box', 'face', 'position', 'label', 'full_epc', 'state', 'rssi_dbm',
  ];

  const configCols = [
    q(run.meta.name || 'Unnamed'),
    q(run.meta.antenna), q(run.meta.orientation), q(run.meta.range), q(run.meta.power),
  ];

  const rows: string[] = [headers.join(',')];
  for (const box of run.boxResults) {
    for (const face of box.faces) {
      for (const slot of face.slots) {
        const lookupKey = (slot.fullEpc ?? slot.label).slice(-7).toUpperCase();
        const rssi = slot.state === 'read' ? (rssiSuffixMap.get(lookupKey) ?? null) : null;
        rows.push([
          ...configCols,
          box.boxNumber, q(face.face), q(slot.position),
          q(slot.label), q(slot.fullEpc ?? ''),
          q(slot.state),
          rssi !== null ? rssi.toFixed(1) : '',
        ].join(','));
      }
    }
  }

  return rows.join('\n');
}

/**
 * Build a safe filename slug from run metadata.
 * e.g. "Large_45deg_3ft_Max" or "Example_A_Large_45deg_3ft_Max"
 */
export function buildExportFilename(run: AnalysisRun, type: 'summary' | 'detail'): string {
  const configSlug = [run.meta.antenna, run.meta.orientation, run.meta.range, run.meta.power]
    .join('_')
    .replace(/[°\s]/g, '');
  const namePart = run.meta.name ? `${run.meta.name.replace(/\s+/g, '_')}_` : '';
  return `shelfloop_${type}_${namePart}${configSlug}.csv`;
}

/** Trigger a browser file download for a CSV string. */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
