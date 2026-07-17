// ─── RFID Run / Scan CSV Parser ──────────────────────────────────────────────
// Supports two common formats from engineering scan exports:
//   1. Unique-tags CSV  — one EPC per row (simplest, MVP target)
//   2. Sequential CSV   — timestamped rows with repeated reads
//
// Column detection is header-based and case-insensitive.
// Duplicate EPCs are de-duplicated — seen once = seen.

import type { ParseIssue, RunParseResult, RunTagRead } from './rfidTypes';

const EPC_SUFFIX_LENGTH = 7;

/** Strip BOM, replacement chars, whitespace. */
function clean(s: string): string {
  return s.replace(/[\uFFFD\uFEFF]/g, '').trim();
}

/** Extract the last N chars of an EPC as the matching suffix. */
function toSuffix(epc: string): string {
  const upper = epc.toUpperCase();
  return upper.length >= EPC_SUFFIX_LENGTH ? upper.slice(-EPC_SUFFIX_LENGTH) : upper;
}

/** Detect which column index holds the EPC from the header row. */
function findEpcColumnIndex(headers: string[]): number {
  const candidates = ['epc', 'tag id', 'tagid', 'tag_id', 'id', 'tags'];
  for (const candidate of candidates) {
    const idx = headers.findIndex((h) => h.toLowerCase().includes(candidate));
    if (idx !== -1) return idx;
  }
  // Fallback: first column that looks like it could have EPCs
  return 0;
}

/**
 * Parse a run/scan CSV into de-duplicated tag reads.
 * Accepts both unique-tag and sequential-read formats.
 */
export function parseRunCsv(csvText: string): RunParseResult {
  const issues: ParseIssue[] = [];
  const seen = new Set<string>();
  const reads: RunTagRead[] = [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) {
    return {
      reads,
      issues: [{ severity: 'error', message: 'Run file appears empty or has only a header.' }],
    };
  }

  const headers = (lines[0] ?? '').split(',').map(clean);
  const epcCol = findEpcColumnIndex(headers);

  let rowIndex = 1;
  for (const rawLine of lines.slice(1)) {
    rowIndex++;
    const cols = rawLine.split(',').map(clean);
    const rawEpc = cols[epcCol] ?? '';

    if (rawEpc === '') {
      issues.push({ severity: 'warn', message: `Row ${rowIndex}: empty EPC — skipped.`, row: rowIndex });
      continue;
    }

    // Basic sanity: RFID EPCs are hex strings
    if (!/^[0-9A-Fa-f]+$/.test(rawEpc)) {
      issues.push({
        severity: 'warn',
        message: `Row ${rowIndex}: "${rawEpc}" doesn't look like a hex EPC — skipped.`,
        row: rowIndex,
      });
      continue;
    }

    const suffix = toSuffix(rawEpc);

    if (seen.has(suffix)) continue; // de-duplicate
    seen.add(suffix);

    reads.push({ rawEpc: rawEpc.toUpperCase(), suffix });
  }

  if (reads.length === 0) {
    issues.push({ severity: 'error', message: 'No valid EPC reads found in the run file.' });
  }

  return { reads, issues };
}
