// ─── RFID Color Utilities ─────────────────────────────────────────────────────
// Shared color helpers for both the 3D canvas and the box detail panel.
// Kept framework-free (no Three.js) so it can be used anywhere.

import type { RunTagRead } from './rfidTypes';

// ─── RSSI gradient ────────────────────────────────────────────────────────────
// Swap point: -60 dBm. This mirrors the common RF signal-quality convention
// (same idea as Wi-Fi bars: ~-60 dBm and better = "good", weaker = "fair/poor")
// and lines up with our own scan data — per-tag averaged RSSI here runs about
// -67 to -44 dBm, so -60 dBm sits right at the point where a read stops being
// merely acceptable and starts being solid.
//
// IMPORTANT: red and green are two ENTIRELY SEPARATE stop tables, picked by a
// hard branch on the threshold — never interpolated across each other. Lerping
// directly from a reddish hex to a greenish hex in RGB space crosses through a
// muddy gray/brown midpoint (R and G channels cross over), which is exactly the
// bug this replaced. No blending ever happens between the red and green zones.

type ColorStop = [number, string]; // [dBm, hex]

const RSSI_THRESHOLD_DBM = -60; // >= this -> green (good). < this -> red (weak/fair).
const RSSI_FLOOR_DBM     = -70; // worst realistic read (our data's min was -69)
const RSSI_CEIL_DBM      = -30; // best realistic read

// Weak/fair zone: dark red (worst) -> light red (right at the edge of the cliff)
const RED_STOPS: ColorStop[] = [
  [-70, '#7f1d1d'], // maroon -- barely readable
  [-65, '#dc2626'], // vivid red
  [-62, '#f87171'], // medium red
  [-60, '#fca5a5'], // light red -- weakest shade still on the red side
];

// Good zone: light green (just crossed the cliff) -> dark green (excellent)
const GREEN_STOPS: ColorStop[] = [
  [-60, '#bbf7d0'], // light green -- just crossed into "good"
  [-52, '#4ade80'], // medium green
  [-42, '#22c55e'], // vivid green
  [-30, '#15803d'], // dark green -- excellent
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

function interpolateStops(stops: ColorStop[], dBm: number): string {
  for (let i = 0; i < stops.length - 1; i++) {
    const [lo, cLo] = stops[i]!;
    const [hi, cHi] = stops[i + 1]!;
    if (dBm >= lo && dBm <= hi) {
      return lerpHex(cLo, cHi, (dBm - lo) / (hi - lo));
    }
  }
  return stops[stops.length - 1]![1];
}

/** Convert an RSSI dBm value to a CSS hex colour using a hard red/green cliff.
 *  Red and green are never interpolated across each other -- see RSSI_THRESHOLD_DBM. */
export function rssiToHex(rssiDbm: number): string {
  if (rssiDbm >= RSSI_THRESHOLD_DBM) {
    const clamped = Math.min(RSSI_CEIL_DBM, rssiDbm);
    return interpolateStops(GREEN_STOPS, clamped);
  }
  const clamped = Math.max(RSSI_FLOOR_DBM, rssiDbm);
  return interpolateStops(RED_STOPS, clamped);
}

/** Convert RSSI dBm to a normalised 0-100 percentage for display. */
export function rssiToPct(rssiDbm: number): number {
  return Math.round(
    Math.max(0, Math.min(100, ((Math.max(RSSI_FLOOR_DBM, Math.min(RSSI_CEIL_DBM, rssiDbm)) - RSSI_FLOOR_DBM) / (RSSI_CEIL_DBM - RSSI_FLOOR_DBM)) * 100)),
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
