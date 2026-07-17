import { useMemo, useState } from 'react';
import type { AnalysisRun, ParseIssue, ResolvedTagPlacement, RunTagRead } from './rfidTypes';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ExceptionItem {
  severity: 'error' | 'warn';
  message: string;
}

interface ExceptionsPanelProps {
  placements: ResolvedTagPlacement[];
  placementIssues: ParseIssue[];
  scanIssues: ParseIssue[];
  scanResult: AnalysisRun | null;
}

const BUCKET_LIMIT = 10;

// ─── Derivation ───────────────────────────────────────────────────────────────

function lookupKey(placement: ResolvedTagPlacement): string {
  return placement.fullEpc
    ? placement.fullEpc.slice(-7).toUpperCase()
    : placement.label.toUpperCase().slice(-7);
}

function readMatchesPlacement(read: RunTagRead, placement: ResolvedTagPlacement): boolean {
  const key = lookupKey(placement);
  if (!key) return false;
  if (key.length < 7) return read.suffix.endsWith(key);
  return read.suffix === key;
}

function dedupeItems(items: ExceptionItem[]): ExceptionItem[] {
  const seen = new Set<string>();
  return items.filter(({ severity, message }) => {
    const k = `${severity}:${message}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function buildExceptions(
  placements: ResolvedTagPlacement[],
  placementIssues: ParseIssue[],
  scanIssues: ParseIssue[],
  scanResult: AnalysisRun | null,
): { errors: ExceptionItem[]; warnings: ExceptionItem[] } {
  const items: ExceptionItem[] = [];

  // ── Parser issues ───────────────────────────────────────────────────────────
  for (const issue of [...placementIssues, ...scanIssues]) {
    items.push({ severity: issue.severity, message: issue.message });
  }

  // ── Unresolved placements (warn) ────────────────────────────────────────────
  for (const p of placements.filter((p) => p.fullEpc === null)) {
    items.push({
      severity: 'warn',
      message: `Unresolved placement — Box ${p.boxNumber} ${p.face} ${p.position} has no resolved full EPC (${p.label}).`,
    });
  }

  // ── Duplicate canonical IDs (error) ────────────────────────────────────────
  const slotMap = new Map<string, string[]>();
  for (const p of placements) {
    const canonical = p.fullEpc?.toUpperCase() || '';
    if (!canonical) continue;
    const slot = `Box ${p.boxNumber} ${p.face} ${p.position}`;
    slotMap.set(canonical, [...(slotMap.get(canonical) ?? []), slot]);
  }
  for (const [epc, slots] of slotMap.entries()) {
    if (slots.length > 1) {
      items.push({
        severity: 'error',
        message: `Duplicate ID — ${epc} is assigned to ${slots.join(', ')}.`,
      });
    }
  }

  if (scanResult) {
    // ── Unexpected / unassigned reads (error) ──────────────────────────────
    for (const read of scanResult.reads) {
      if (!placements.some((p) => readMatchesPlacement(read, p))) {
        items.push({
          severity: 'error',
          message: `Unexpected read — ${read.rawEpc} is not assigned to any known box/face.`,
        });
      }
    }

    const avg =
      scanResult.boxResults.reduce((s, b) => s + b.coveragePct, 0) /
      (scanResult.boxResults.length || 1);

    for (const box of scanResult.boxResults) {
      // ── Low coverage ───────────────────────────────────────────────────────
      if (box.coveragePct < 50) {
        items.push({
          severity: 'error',
          message: `Low coverage — Box ${box.boxNumber} is at ${box.coveragePct}% (<50%).`,
        });
      } else if (box.coveragePct < 85) {
        items.push({
          severity: 'warn',
          message: `Low coverage — Box ${box.boxNumber} is at ${box.coveragePct}% (<85%).`,
        });
      }

      // ── Coverage outlier (warn) ────────────────────────────────────────────
      if (avg - box.coveragePct >= 25) {
        items.push({
          severity: 'warn',
          message: `Coverage outlier — Box ${box.boxNumber} is ${Math.round(avg - box.coveragePct)} pts below rig average.`,
        });
      }

      // ── Face gaps (warn) ───────────────────────────────────────────────────
      for (const face of box.faces) {
        const eligible = face.readCount + face.missCount;
        if (eligible > 0 && face.readCount === 0) {
          items.push({
            severity: 'warn',
            message: `Face gap — Box ${box.boxNumber} ${face.face} has 0 reads across ${eligible} expected tags.`,
          });
        }
      }
    }
  }

  const deduped = dedupeItems(items);
  return {
    errors:   deduped.filter((i) => i.severity === 'error'),
    warnings: deduped.filter((i) => i.severity === 'warn'),
  };
}

// ─── Bucket list ──────────────────────────────────────────────────────────────
// Shows up to BUCKET_LIMIT items; if more exist, "Expand" button appears at
// the bottom of this bucket only.

interface BucketListProps {
  title: string;
  allItems: ExceptionItem[];
  tone: 'error' | 'warn';
}

function BucketList({ title, allItems, tone }: BucketListProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const preview  = allItems.slice(0, BUCKET_LIMIT);
  const hasMore  = allItems.length > BUCKET_LIMIT;

  const s =
    tone === 'error'
      ? { badge: 'bg-red-100 text-red-700', border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700', expandBg: 'bg-red-100 hover:bg-red-200 text-red-700' }
      : { badge: 'bg-amber-100 text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', expandBg: 'bg-amber-100 hover:bg-amber-200 text-amber-700' };

  return (
    <>
      <div className={`flex flex-col rounded-2xl border ${s.border} ${s.bg} p-4`}>
        {/* Header — always shows TRUE total */}
        <div className="mb-3 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.12em] ${s.badge}`}>
            {title}
          </span>
          <span className="text-xs font-bold text-slate-500">{allItems.length}</span>
        </div>

        {/* Items */}
        {preview.length === 0 ? (
          <p className="text-sm text-slate-500">None.</p>
        ) : (
          <ul className="flex-1 space-y-1.5">
            {preview.map((item, i) => (
              <li key={i} className={`text-sm ${s.text}`}>
                {item.message}
              </li>
            ))}
          </ul>
        )}

        {/* Expand — bottom of THIS bucket, only when overflow */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`mt-4 w-full rounded-xl py-1.5 text-xs font-black uppercase tracking-[0.12em] transition ${s.expandBg}`}
          >
            Expand — {allItems.length - BUCKET_LIMIT} more
          </button>
        )}
      </div>

      {/* Full-list modal for this bucket */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className={`flex items-center justify-between border-b ${s.border} px-5 py-4`}>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.12em] ${s.badge}`}>
                  {title}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  {allItems.length} total
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <ul className={`max-h-[calc(85vh-72px)] space-y-2 overflow-y-auto p-5 ${s.text}`}>
              {allItems.map((item, i) => (
                <li key={i} className="text-sm">
                  {item.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function ExceptionsPanel({ placements, placementIssues, scanIssues, scanResult }: ExceptionsPanelProps) {
  const { errors, warnings } = useMemo(
    () => buildExceptions(placements, placementIssues, scanIssues, scanResult),
    [placements, placementIssues, scanIssues, scanResult],
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-black text-retail-ink">Exceptions</h3>
        <p className="text-sm text-slate-500">
          Flags unexpected reads, data integrity problems, and suspicious coverage patterns.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BucketList title="Errors"   allItems={errors}   tone="error" />
        <BucketList title="Warnings" allItems={warnings} tone="warn"  />
      </div>
    </div>
  );
}
