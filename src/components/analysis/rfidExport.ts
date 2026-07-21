// ─── RFID Export Utilities ────────────────────────────────────────────────────
// Builds CSV exports and computes DOE primary metrics from a completed AnalysisRun.
//
// Exports:
//   computeDoEMetrics  — Y1 (overall coverage %) + Y2 (CV of box coverage %)
//                        returned as numbers, used for both inline display and CSV.
//   buildRunSummaryCsv — One row per tag slot; Y1/Y2 + config repeated on every
//                        row so 16 stacked exports are immediately pivot-ready.
//   buildExportFilename — Safe filename slug derived from run metadata.
//   downloadCsv         — Browser download trigger.

import type { AnalysisRun } from './rfidTypes';

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Quote a CSV cell — handles commas, quotes, and newlines. */
function q(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute DOE primary response variables from a scan run.
 *
 * Y1 = overall % tag coverage   (higher is better)
 * Y2 = CV of per-box coverage % (lower = more uniform spatial distribution)
 *       CV = (σ / μ) × 100  computed over box 1–8 individual coverage percents
 */
export function computeDoEMetrics(run: AnalysisRun): { y1: number; y2: number } {
  const y1 = run.overallCoveragePct;
  const boxPcts = run.boxResults.map((b) => b.coveragePct);
  const n = boxPcts.length;
  if (n === 0) return { y1, y2: 0 };
  const avg = boxPcts.reduce((a, b) => a + b, 0) / n;
  const variance = boxPcts.reduce((sum, p) => sum + (p - avg) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const y2 = avg > 0 ? (stdDev / avg) * 100 : 0;
  return { y1, y2 };
}

/**
 * Run Summary CSV — one row per tag placement slot.
 *
 * Y1 and Y2 are prepended on every row so the file doubles as a
 * per-run metrics reference when stacking 16 exports for the DOE.
 *
 * Columns:
 *   y1_coverage_pct · y2_distribution_cv
 *   run_name · antenna · orientation · range · power
 *   box · face · position · label · full_epc · state · rssi_dbm
 */
export function buildRunSummaryCsv(
  run: AnalysisRun,
  rssiSuffixMap: Map<string, number>,
): string {
  const { y1, y2 } = computeDoEMetrics(run);

  const headers = [
    'y1_coverage_pct', 'y2_distribution_cv',
    'run_name', 'antenna', 'orientation', 'range', 'power',
    'box', 'face', 'position', 'label', 'full_epc', 'state', 'rssi_dbm',
  ];

  const configCols = [
    y1.toFixed(1), y2.toFixed(1),
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
 * e.g. "shelfloop_summary_Large_45deg_3ft_Max.csv"
 */
export function buildExportFilename(run: AnalysisRun): string {
  const configSlug = [run.meta.antenna, run.meta.orientation, run.meta.range, run.meta.power]
    .join('_')
    .replace(/[°\s]/g, '');
  const namePart = run.meta.name ? `${run.meta.name.replace(/\s+/g, '_')}_` : '';
  return `shelfloop_summary_${namePart}${configSlug}.csv`;
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
