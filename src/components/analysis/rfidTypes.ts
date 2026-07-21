// ─── RFID Analysis — Domain Types ────────────────────────────────────────────
// Describes the 8-box rig (2×2×2 Rubik's cube arrangement) and how scan
// run results are matched against known tag placements.

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

// ─── Run ─────────────────────────────────────────────────────────────────────

/** Metadata the user provides (or we parse) for a scan run. */
export interface RunMeta {
  name: string;
  antennaType: string;
  angle: string;
  distance: string;
  timeout: string;
}

/** A tag read row from a scan run CSV. */
export interface RunTagRead {
  rawEpc: string;    // as it appeared in the file
  suffix: string;    // last 7 chars, normalised uppercase
  rssi?: number;     // average RSSI (dBm) — present only when parsed from a _data.csv
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

// ─── Parser issues ───────────────────────────────────────────────────────────

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

// ─── Rig layout ──────────────────────────────────────────────────────────────

/**
 * Physical position of a box in the 2×2×2 rig.
 * col: 0=left, 1=right  |  row: 0=front, 1=back  |  layer: 0=bottom, 1=top
 */
export interface RigPosition {
  col: 0 | 1;
  row: 0 | 1;
  layer: 0 | 1;
}

// Physical layout confirmed by engineering team.
// Top layer  left→right: 7, 5, 4, 3
// Bottom layer left→right: 8, 6, 2, 1
export const RIG_LAYOUT: Record<number, RigPosition> = {
  1: { col: 1, row: 0, layer: 0 }, // front-right bottom
  2: { col: 1, row: 1, layer: 0 }, // back-right  bottom
  3: { col: 1, row: 0, layer: 1 }, // front-right top
  4: { col: 1, row: 1, layer: 1 }, // back-right  top
  5: { col: 0, row: 0, layer: 1 }, // front-left  top
  6: { col: 0, row: 0, layer: 0 }, // front-left  bottom
  7: { col: 0, row: 1, layer: 1 }, // back-left   top
  8: { col: 0, row: 1, layer: 0 }, // back-left   bottom
};

export const BOX_FACES: BoxFace[] = ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'];
export const FACE_POSITIONS: FacePosition[] = ['TL', 'TR', 'BL', 'BR'];
