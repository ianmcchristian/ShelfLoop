// ─── RFID Placement CSV Parser ────────────────────────────────────────────────
// Parses the "Box vs Tag Database" CSV.
// Labels in the CSV are shortened tag suffixes (last ~7 chars).
// Rows use merged-cell-style blanks for Box # and Box face columns.

import type {
  BoxFace,
  FacePosition,
  ParseIssue,
  PlacementParseResult,
  ResolvedTagPlacement,
} from './rfidTypes';

const VALID_FACES = new Set<string>(['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom']);
const VALID_POSITIONS = new Set<string>(['TL', 'TR', 'BL', 'BR']);

/** Strip BOM, replacement chars, leading/trailing whitespace. */
function clean(s: string): string {
  return s.replace(/[\uFFFD\uFEFF]/g, '').trim();
}

function isValidFace(s: string): s is BoxFace {
  return VALID_FACES.has(s);
}

function isValidPosition(s: string): s is FacePosition {
  return VALID_POSITIONS.has(s);
}

/**
 * Parse the placement CSV into resolved tag placements.
 * Tolerates blank Box# / Face cells (carry-forward from merged rows).
 */
export function parsePlacementCsv(csvText: string): PlacementParseResult {
  const issues: ParseIssue[] = [];
  const placements: ResolvedTagPlacement[] = [];

  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) {
    return {
      placements,
      issues: [{ severity: 'error', message: 'File appears empty or has no data rows.' }],
    };
  }

  let currentBox = 0;
  let currentFace: BoxFace | null = null;
  let rowIndex = 0;

  for (const rawLine of lines) {
    rowIndex++;
    const cols = rawLine.split(',').map(clean);

    // Skip header row
    if (rowIndex === 1) continue;
    // Skip fully blank rows
    if (cols.every((c) => c === '')) continue;

    // Box # column (carry forward if blank)
    const rawBox = cols[0] ?? '';
    if (rawBox !== '') {
      const parsed = parseInt(rawBox, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 8) {
        issues.push({ severity: 'warn', message: `Row ${rowIndex}: invalid box # "${rawBox}"`, row: rowIndex });
      } else {
        currentBox = parsed;
      }
    }

    // Face column (carry forward if blank)
    const rawFace = cols[1] ?? '';
    if (rawFace !== '') {
      if (isValidFace(rawFace)) {
        currentFace = rawFace;
      } else {
        issues.push({ severity: 'warn', message: `Row ${rowIndex}: unknown face "${rawFace}"`, row: rowIndex });
        currentFace = null;
      }
    }

    // Position column
    const rawPos = cols[2] ?? '';
    if (!isValidPosition(rawPos)) {
      if (rawPos !== '') {
        issues.push({ severity: 'warn', message: `Row ${rowIndex}: invalid position "${rawPos}"`, row: rowIndex });
      }
      continue;
    }

    // Label column (col 3 = Source Label)
    const rawLabel = cols[3] ?? '';
    if (rawLabel === '') {
      issues.push({ severity: 'warn', message: `Row ${rowIndex}: empty label — slot skipped.`, row: rowIndex });
      continue;
    }

    if (currentBox === 0 || currentFace === null) {
      issues.push({ severity: 'warn', message: `Row ${rowIndex}: no valid box/face context — skipped.`, row: rowIndex });
      continue;
    }

    // Full Tag ID column (col 4) — populated for VERIFIED_SUFFIX rows.
    const rawFullEpc = cols[4] ?? '';
    let fullEpc: string | null = null;
    if (rawFullEpc.length > 10 && /^[0-9A-Fa-f]+$/i.test(rawFullEpc)) {
      fullEpc = rawFullEpc.toUpperCase();
    } else if (rawLabel.length > 10 && /^[0-9A-Fa-f]+$/i.test(rawLabel)) {
      // Edge case: label column itself contains a full EPC
      fullEpc = rawLabel.toUpperCase();
    }

    placements.push({
      boxNumber: currentBox,
      face: currentFace,
      position: rawPos as FacePosition,
      label: rawLabel.toUpperCase(),
      fullEpc,
    });
  }

  if (placements.length === 0) {
    issues.push({ severity: 'error', message: 'No valid placement rows could be parsed.' });
  }

  return { placements, issues };
}
