// ─── RFID Color Utilities ─────────────────────────────────────────────────────
// Shared color helpers for both the 3D canvas and the box detail panel.
// Kept framework-free (no Three.js) so it can be used anywhere.

import type { RunTagRead } from './rfidTypes';

// ─── RSSI gradient ────────────────────────────────────────────────────────────
// Scale: -30 dBm = 100% (best) · -80 dBm = 0% (barely readable)
//
// Cliff at 50% (≈ -55 dBm) mirrors the dramatic red/green split used on the
// 3D boxes (which cliffs at 85% coverage). Same visual language: red = bad,
// green = good, no orange or yellow in between.
//
// Practical thresholds for UHF RFID at 3 ft with large antenna:
//   ≥ -55 dBm → green family (good / strong)
//   < -55 dBm → red family  (marginal / weak)

type ColorStop = [number, string];

const RSSI_STOPS: ColorStop[] = [
  [0,   '#7f1d1d'], // maroon     — extremely weak / -80 dBm
  [1,   '#ef4444'], // vivid red  — instant snap (matches box scale)
  [30,  '#ef4444'], // flat vivid red
  [45,  '#f87171'], // medium red  / -57.5 dBm
  [49,  '#fca5a5'], // light red   / -55.5 dBm (approaching cliff)
  [50,  '#bbf7d0'], // light green — cliff at ≈ -55 dBm
  [70,  '#22c55e'], // vivid green / -45 dBm
  [100, '#16a34a'], // rich green  / -30 dBm (strong)
];

/** CSS color used for unread/missed tags in RSSI heatmap mode.
 *  Gray = no data. The gradient only speaks to tags that were actually read. */
export const RSSI_MISSED_COLOR = 'rgba(100,116,139,0.72)'; // slate-500

// ─── Hex interpolation ───────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r  = Math.round(ar + (br - ar) * t);
  const g  = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

// ─── Public color functions ───────────────────────────────────────────────────

/** Convert an RSSI dBm value to a CSS hex colour using the red/green cliff scale. */
export function rssiToHex(rssiDbm: number): string {
  const clamped = Math.max(-80, Math.min(-30, rssiDbm));
  const pct = ((clamped + 80) / 50) * 100;

  for (let i = 0; i < RSSI_STOPS.length - 1; i++) {
    const [lo, cLo] = RSSI_STOPS[i]!;
    const [hi, cHi] = RSSI_STOPS[i + 1]!;
    if (pct >= lo && pct <= hi) {
      return lerpHex(cLo, cHi, (pct - lo) / (hi - lo));
    }
  }
  return '#16a34a';
}

/** Convert RSSI dBm to a normalised 0–100 percentage for display. */
export function rssiToPct(rssiDbm: number): number {
  return Math.round(
    Math.max(0, Math.min(100, ((Math.max(-80, Math.min(-30, rssiDbm)) + 80) / 50) * 100)),
  );
}

// ─── RSSI suffix map ──────────────────────────────────────────────────────────
// Maps each 7-char EPC suffix to the average RSSI seen across all reads of that tag.
// Returns an empty Map when reads have no RSSI data.

export function buildRssiMap(reads: RunTagRead[]): Map<string, number> {
  const acc = new Map<string, { sum: number; count: number }>();
  for (const r of reads) {
    if (r.rssi === undefined) continue;
    const existing = acc.get(r.suffix);
    if (existing) {
      existing.sum   += r.rssi;
      existing.count += 1;
    } else {
      acc.set(r.suffix, { sum: r.rssi, count: 1 });
    }
  }
  const result = new Map<string, number>();
  for (const [suffix, { sum, count }] of acc) {
    result.set(suffix, sum / count);
  }
  return result;
}

/** Returns true when at least one read in the set carries RSSI data. */
export function readsHaveRssi(reads: RunTagRead[]): boolean {
  return reads.some((r) => r.rssi !== undefined);
}
