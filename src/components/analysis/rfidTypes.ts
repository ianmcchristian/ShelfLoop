// ─── RFID Analysis — Domain Types ────────────────────────────────────────────
// Describes the 8-box rig (2×2×2 Experiment 2 layout) and how scan run
// results are matched against known tag placements.

/** The six faces of a box. */
export type BoxFace = 'Front' | 'Back' | 'Left' | 'Right' | 'Top' | 'Bottom';

/** The four tag positions on each face. */
export type FacePosition = 'TL' | 'TR' | 'BL' | 'BR';

/** A single tag placement record from the placement database. */
export interface TagPlacement {
  boxNumber: number; // 1–8
  face: BoxFace;
  position: FacePosition;
  /** Shortened suffix label as it appears in the placement CSV. */
  label: string;
}

/** A fully resolved placement with a canonical full EPC if known. */
export interface ResolvedTagPlacement extends TagPlacement {
  fullEpc: string | null; // null = not yet resolved from master list
}

/** How a tag slot looks after matching a run against the placement DB. */
export type TagReadState = 'read' | 'missed' | 'unresolved';

/** A placement slot enriched with its read state from a specific run. */
export interface TagSlotResult extends ResolvedTagPlacement {
  state: TagReadState;
}

// ─── Box-level aggregation ───────────────────────────────────────────────────

export interface FaceResult {
  face: BoxFace;
  slots: TagSlotResult[];
  readCount: number;
  missCount: number;
  unresolvedCount: number;
  coveragePct: number;
}

export interface BoxResult {
  boxNumber: number;
  faces: FaceResult[];
  readCount: number;
  missCount: number;
  unresolvedCount: number;
  coveragePct: number;
}

// ─── Run metadata ─────────────────────────────────────────────────────────────

/** Antenna config selected by the user — matches Experiment 2 variables.
 *  Empty string means unset (required for export). */
export interface ScanMeta {
  antenna:     'Medium' | 'Large' | '';
  orientation: '0°' | '45°' | '';
  range:       '3ft' | '6ft' | '';
  power:       'Base' | 'Max' | '';
}

/** Returns true when every field is selected — used to gate the export feature. */
export function scanMetaIsComplete(meta: ScanMeta): boolean {
  return meta.antenna !== '' && meta.orientation !== '' && meta.range !== '' && meta.power !== '';
}

/** Metadata attached to a fully parsed run. */
export interface RunMeta {
  name:        string; // free-text run label
  antenna:     string; // 'Medium' | 'Large'
  orientation: string; // '0°' | '45°'
  range:       string; // '3ft' | '6ft'
  power:       string; // 'Base' | 'Max'
}

// ─── Tag reads ────────────────────────────────────────────────────────────────

/** A tag read row from a scan run CSV. */
export interface RunTagRead {
  rawEpc: string;   // as it appeared in the file
  suffix: string;   // last 7 chars, normalised uppercase
  rssi?: number;    // average RSSI (dBm) — present only when parsed from a _data.csv
}

/** A fully parsed + matched run. */
export interface AnalysisRun {
  meta: RunMeta;
  reads: RunTagRead[];
  boxResults: BoxResult[];
  totalTags: number;
  totalRead: number;
  totalMissed: number;
  totalUnresolved: number;
  overallCoveragePct: number;
}

// ─── Parser issues ────────────────────────────────────────────────────────────

export type IssueSeverity = 'warn' | 'error';

export interface ParseIssue {
  severity: IssueSeverity;
  message: string;
  row?: number;
}

export interface PlacementParseResult {
  placements: ResolvedTagPlacement[];
  issues: ParseIssue[];
}

export interface RunParseResult {
  reads: RunTagRead[];
  issues: ParseIssue[];
}

// ─── Rig layout ───────────────────────────────────────────────────────────────

/**
 * Physical position of a box in the 2×2×2 rig (Experiment 2 layout).
 *
 * col:   0=West,   1=East
 * row:   0=North,  1=South   (North = front — all box Front faces face North)
 * layer: 0=Bottom, 1=Top
 *
 * Viewed from above (North at top):
 *
 *          West(0)   East(1)
 * North(0)  [1,5]     [2,6]
 * South(1)  [3,7]     [4,8]
 *
 * Top layer (layer=1):    1=NW · 2=NE · 3=SW · 4=SE
 * Bottom layer (layer=0): 5=NW · 6=NE · 7=SW · 8=SE
 */
export interface RigPosition {
  col: 0 | 1;   // 0=West,   1=East
  row: 0 | 1;   // 0=North,  1=South
  layer: 0 | 1; // 0=Bottom, 1=Top
}

// Experiment 2 physical layout — front face of every box faces North.
// Top layer    NW→NE→SW→SE: 1, 2, 3, 4
// Bottom layer NW→NE→SW→SE: 5, 6, 7, 8
export const RIG_LAYOUT: Record<number, RigPosition> = {
  1: { col: 0, row: 0, layer: 1 }, // NW Top
  2: { col: 1, row: 0, layer: 1 }, // NE Top
  3: { col: 0, row: 1, layer: 1 }, // SW Top
  4: { col: 1, row: 1, layer: 1 }, // SE Top
  5: { col: 0, row: 0, layer: 0 }, // NW Bottom
  6: { col: 1, row: 0, layer: 0 }, // NE Bottom
  7: { col: 0, row: 1, layer: 0 }, // SW Bottom
  8: { col: 1, row: 1, layer: 0 }, // SE Bottom
};

export const BOX_FACES: BoxFace[]         = ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'];
export const FACE_POSITIONS: FacePosition[] = ['TL', 'TR', 'BL', 'BR'];
