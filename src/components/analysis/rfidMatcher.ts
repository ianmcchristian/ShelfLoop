// ─── RFID Matcher ─────────────────────────────────────────────────────────────
// Matches a set of run reads against the placement database.
// Strategy: suffix-match on last 7 chars (upgraded to full-string once
// a canonical EPC list is available).

import type {
  AnalysisRun,
  BoxResult,
  FaceResult,
  ResolvedTagPlacement,
  RunMeta,
  RunTagRead,
  TagReadState,
  TagSlotResult,
} from './rfidTypes';
import { BOX_FACES, FACE_POSITIONS } from './rfidTypes';

// ─── Core match ──────────────────────────────────────────────────────────────

function getTagState(placement: ResolvedTagPlacement, readSuffixes: Set<string>): TagReadState {
  // If we have a full EPC, match on last 7 chars of that
  const lookupKey = placement.fullEpc
    ? placement.fullEpc.slice(-7).toUpperCase()
    : placement.label.toUpperCase().slice(-7);

  if (lookupKey.length === 0) return 'unresolved';

  // Partial labels shorter than 7 chars (e.g. Box 5's 4-char labels)
  // — do a suffix-contains match instead of exact
  if (lookupKey.length < 7) {
    for (const suffix of readSuffixes) {
      if (suffix.endsWith(lookupKey)) return 'read';
    }
    return 'missed';
  }

  return readSuffixes.has(lookupKey) ? 'read' : 'missed';
}

// ─── Aggregation helpers ─────────────────────────────────────────────────────

function buildFaceResult(
  boxNumber: number,
  face: (typeof BOX_FACES)[number],
  placements: ResolvedTagPlacement[],
  readSuffixes: Set<string>,
): FaceResult {
  const faceSlots: TagSlotResult[] = FACE_POSITIONS.map((pos) => {
    const placement = placements.find(
      (p) => p.boxNumber === boxNumber && p.face === face && p.position === pos,
    );
    if (!placement) {
      // Slot missing from placement DB — treat as unresolved
      return {
        boxNumber,
        face,
        position: pos,
        label: '',
        fullEpc: null,
        state: 'unresolved' as TagReadState,
      };
    }
    return { ...placement, state: getTagState(placement, readSuffixes) };
  });

  const readCount = faceSlots.filter((s) => s.state === 'read').length;
  const missCount = faceSlots.filter((s) => s.state === 'missed').length;
  const unresolvedCount = faceSlots.filter((s) => s.state === 'unresolved').length;
  const eligibleCount = readCount + missCount;
  const coveragePct = eligibleCount > 0 ? Math.round((readCount / eligibleCount) * 100) : 0;

  return { face, slots: faceSlots, readCount, missCount, unresolvedCount, coveragePct };
}

function buildBoxResult(
  boxNumber: number,
  placements: ResolvedTagPlacement[],
  readSuffixes: Set<string>,
): BoxResult {
  const faces: FaceResult[] = BOX_FACES.map((face) =>
    buildFaceResult(boxNumber, face, placements, readSuffixes),
  );

  const readCount = faces.reduce((acc, f) => acc + f.readCount, 0);
  const missCount = faces.reduce((acc, f) => acc + f.missCount, 0);
  const unresolvedCount = faces.reduce((acc, f) => acc + f.unresolvedCount, 0);
  const eligibleCount = readCount + missCount;
  const coveragePct = eligibleCount > 0 ? Math.round((readCount / eligibleCount) * 100) : 0;

  return { boxNumber, faces, readCount, missCount, unresolvedCount, coveragePct };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Match run reads against a placement DB and produce a full AnalysisRun.
 */
export function matchRun(
  meta: RunMeta,
  reads: RunTagRead[],
  placements: ResolvedTagPlacement[],
): AnalysisRun {
  const readSuffixes = new Set(reads.map((r) => r.suffix.toUpperCase()));

  const boxNumbers = [...new Set(placements.map((p) => p.boxNumber))].sort((a, b) => a - b);
  const boxResults: BoxResult[] = boxNumbers.map((n) =>
    buildBoxResult(n, placements, readSuffixes),
  );

  const totalRead = boxResults.reduce((acc, b) => acc + b.readCount, 0);
  const totalMissed = boxResults.reduce((acc, b) => acc + b.missCount, 0);
  const totalUnresolved = boxResults.reduce((acc, b) => acc + b.unresolvedCount, 0);
  const totalTags = totalRead + totalMissed + totalUnresolved;
  const eligibleTotal = totalRead + totalMissed;
  const overallCoveragePct =
    eligibleTotal > 0 ? Math.round((totalRead / eligibleTotal) * 100) : 0;

  return {
    meta,
    reads,
    boxResults,
    totalTags,
    totalRead,
    totalMissed,
    totalUnresolved,
    overallCoveragePct,
  };
}
