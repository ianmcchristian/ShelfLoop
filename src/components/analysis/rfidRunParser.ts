// ─── RFID Run / Scan CSV Parser ──────────────────────────────────────────────
// Supports two formats from engineering scan exports:
//
//   unique-tags CSV   — ID,count
//     One row per unique EPC, no RSSI data.
//
//   data CSV          — ID,tick,rssi,count
//     One row per read event; same EPC may appear many times.
//     RSSI (dBm) is averaged across all reads of the same EPC.
//
// Format is detected from the header row. Column matching is case-insensitive.
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
  return 0; // fallback
}

/** Returns the column index for RSSI, or -1 if this file has no RSSI column. */
function findRssiColumnIndex(headers: string[]): number {
  return headers.findIndex((h) => h.toLowerCase() === 'rssi');
}

/**
 * Parse a run/scan CSV into de-duplicated tag reads.
 *
 * When the file has an `rssi` column, reads are grouped by EPC and the RSSI
 * is averaged across all events. The resulting RunTagRead will carry `rssi`.
 * When no `rssi` column is present, `rssi` is omitted from each read.
 */
export function parseRunCsv(csvText: string): RunParseResult {
  const issues: ParseIssue[] = [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) {
    return {
      reads: [],
      issues: [{ severity: 'error', message: 'Run file appears empty or has only a header.' }],
    };
  }

  const headers = (lines[0] ?? '').split(',').map(clean);
  const epcCol  = findEpcColumnIndex(headers);
  const rssiCol = findRssiColumnIndex(headers);
  const hasRssi = rssiCol !== -1;

  // For data-format files: accumulate RSSI values per suffix before de-duping.
  // { suffix -> { sum, count, rawEpc } }
  const rssiAcc = new Map<string, { sum: number; count: number; rawEpc: string }>();
  // For unique-format files (or fallback): simple seen-set de-dup.
  const seenSuffixes = new Set<string>();
  const reads: RunTagRead[] = [];

  let rowIndex = 1;
  for (const rawLine of lines.slice(1)) {
    rowIndex++;
    const cols   = rawLine.split(',').map(clean);
    const rawEpc = cols[epcCol] ?? '';

    if (rawEpc === '') {
      issues.push({ severity: 'warn', message: `Row ${rowIndex}: empty EPC — skipped.`, row: rowIndex });
      continue;
    }
    if (!/^[0-9A-Fa-f]+$/.test(rawEpc)) {
      issues.push({
        severity: 'warn',
        message: `Row ${rowIndex}: "${rawEpc}" doesn't look like a hex EPC — skipped.`,
        row: rowIndex,
      });
      continue;
    }

    const suffix = toSuffix(rawEpc);

    if (hasRssi) {
      // Data format: accumulate RSSI, de-dup later
      const rssiRaw = parseFloat(cols[rssiCol] ?? '');
      const rssiVal = isNaN(rssiRaw) ? null : rssiRaw;
      const existing = rssiAcc.get(suffix);
      if (existing) {
        if (rssiVal !== null) { existing.sum += rssiVal; existing.count++; }
      } else {
        rssiAcc.set(suffix, {
          rawEpc: rawEpc.toUpperCase(),
          sum:   rssiVal ?? 0,
          count: rssiVal !== null ? 1 : 0,
        });
      }
    } else {
      // Unique format: simple de-dup
      if (seenSuffixes.has(suffix)) continue;
      seenSuffixes.add(suffix);
      reads.push({ rawEpc: rawEpc.toUpperCase(), suffix });
    }
  }

  // Flush accumulated RSSI data into final reads
  if (hasRssi) {
    for (const [suffix, { rawEpc, sum, count }] of rssiAcc) {
      const avgRssi = count > 0 ? sum / count : undefined;
      reads.push({ rawEpc, suffix, ...(avgRssi !== undefined && { rssi: avgRssi }) });
    }
  }

  if (reads.length === 0) {
    issues.push({ severity: 'error', message: 'No valid EPC reads found in the run file.' });
  }

  return { reads, issues };
}
