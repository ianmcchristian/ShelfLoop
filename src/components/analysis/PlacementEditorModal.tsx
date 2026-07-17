// ─── Placement Editor Modal ────────────────────────────────────────────────────
// Session-only placement database editor. Changes exist only until page reload.
// Never mutates TEST_PLACEMENTS — always works on a local copy.

import { useCallback, useMemo, useState } from 'react';
import { TEST_PLACEMENTS } from './rfidTestData';
import type { BoxFace, FacePosition, ResolvedTagPlacement } from './rfidTypes';
import { FACE_POSITIONS } from './rfidTypes';

interface PlacementEditorModalProps {
  placements: ResolvedTagPlacement[];
  onApply: (placements: ResolvedTagPlacement[]) => void;
  onClose: () => void;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type SlotKey = `${number}-${BoxFace}-${FacePosition}`;

interface SlotDraft {
  label: string;
  fullEpc: string; // empty string = null when applied
}

type DraftMap = Map<SlotKey, SlotDraft>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slotKey(box: number, face: BoxFace, pos: FacePosition): SlotKey {
  return `${box}-${face}-${pos}`;
}

function buildDraftMap(placements: ResolvedTagPlacement[]): DraftMap {
  const map: DraftMap = new Map();
  for (const p of placements) {
    map.set(slotKey(p.boxNumber, p.face, p.position), {
      label: p.label,
      fullEpc: p.fullEpc ?? '',
    });
  }
  return map;
}

function draftToPlacement(
  box: number,
  face: BoxFace,
  pos: FacePosition,
  draft: SlotDraft,
): ResolvedTagPlacement {
  const trimmedEpc = draft.fullEpc.trim().toUpperCase();
  const isValidEpc = trimmedEpc.length > 10 && /^[0-9A-F]+$/.test(trimmedEpc);
  return {
    boxNumber: box,
    face,
    position: pos,
    label: draft.label.trim().toUpperCase(),
    fullEpc: isValidEpc ? trimmedEpc : null,
  };
}

function applyDraftMap(draft: DraftMap): ResolvedTagPlacement[] {
  const results: ResolvedTagPlacement[] = [];
  for (const [key, slot] of draft.entries()) {
    if (!slot.label.trim()) continue; // skip empty slots
    const [box, face, pos] = key.split('-') as [string, BoxFace, FacePosition];
    results.push(draftToPlacement(Number(box), face, pos, slot));
  }
  return results;
}

const FACE_SHORT: Record<BoxFace, string> = {
  Front: 'F', Back: 'B', Left: 'L', Right: 'R', Top: 'U', Bottom: 'D',
};

const FACE_GRID_ORDER: BoxFace[] = ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom'];

// ─── Slot cell ────────────────────────────────────────────────────────────────

interface SlotCellProps {
  pos: FacePosition;
  draft: SlotDraft;
  onChange: (field: 'label' | 'fullEpc', value: string) => void;
}

function SlotCell({ pos, draft, onChange }: SlotCellProps) {
  const empty = !draft.label.trim();

  return (
    <div className={`flex flex-col gap-1 rounded-lg border p-2 text-left transition-colors
      ${empty ? 'border-slate-200 bg-slate-50' : 'border-slate-300 bg-white'}`}>
      <span className="text-[0.56rem] font-black uppercase tracking-[0.14em] text-slate-400">
        {pos}
      </span>
      <input
        type="text"
        placeholder="label"
        value={draft.label}
        maxLength={24}
        className="w-full rounded border border-slate-200 bg-transparent px-1.5 py-1 font-mono text-[0.65rem] font-bold uppercase text-retail-ink outline-none placeholder:text-slate-400 focus:border-retail-blue focus:ring-1 focus:ring-retail-blue/25"
        onChange={(e) => onChange('label', e.target.value)}
      />
      <input
        type="text"
        placeholder="full EPC (optional)"
        value={draft.fullEpc}
        maxLength={64}
        className="w-full rounded border border-slate-200 bg-transparent px-1.5 py-1 font-mono text-[0.55rem] text-slate-500 outline-none placeholder:text-slate-400 focus:border-retail-blue focus:ring-1 focus:ring-retail-blue/25"
        onChange={(e) => onChange('fullEpc', e.target.value)}
      />
    </div>
  );
}

// ─── Face card ────────────────────────────────────────────────────────────────

interface FaceCardProps {
  face: BoxFace;
  box: number;
  draft: DraftMap;
  onChange: (key: SlotKey, field: 'label' | 'fullEpc', value: string) => void;
}

function FaceCard({ face, box, draft, onChange }: FaceCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-[0.6rem] font-black uppercase tracking-[0.12em] text-slate-500">
        {FACE_SHORT[face]} — {face}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {FACE_POSITIONS.map((pos) => {
          const key = slotKey(box, face, pos);
          const slot = draft.get(key) ?? { label: '', fullEpc: '' };
          return (
            <SlotCell
              key={pos}
              pos={pos}
              draft={slot}
              onChange={(field, value) => onChange(key, field, value)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Box tab content ──────────────────────────────────────────────────────────

interface BoxEditorProps {
  box: number;
  draft: DraftMap;
  onChange: (key: SlotKey, field: 'label' | 'fullEpc', value: string) => void;
}

function BoxEditor({ box, draft, onChange }: BoxEditorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {FACE_GRID_ORDER.map((face) => (
        <FaceCard key={face} face={face} box={box} draft={draft} onChange={onChange} />
      ))}
    </div>
  );
}

// ─── Public component ──────────────────────────────────────────────────────────

export function PlacementEditorModal({ placements, onApply, onClose }: PlacementEditorModalProps) {
  const [activeBox, setActiveBox] = useState(1);
  const [draft, setDraft] = useState<DraftMap>(() => buildDraftMap(placements));
  const [dirty, setDirty] = useState(false);

  const boxNumbers = useMemo(
    () => [...new Set(TEST_PLACEMENTS.map((p) => p.boxNumber))].sort((a, b) => a - b),
    [],
  );

  const handleChange = useCallback(
    (key: SlotKey, field: 'label' | 'fullEpc', value: string) => {
      setDraft((prev) => {
        const next = new Map(prev);
        const existing = next.get(key) ?? { label: '', fullEpc: '' };
        next.set(key, { ...existing, [field]: value });
        return next;
      });
      setDirty(true);
    },
    [],
  );

  const handleReset = useCallback(() => {
    setDraft(buildDraftMap(TEST_PLACEMENTS));
    setDirty(false);
  }, []);

  const handleApply = useCallback(() => {
    onApply(applyDraftMap(draft));
    onClose();
  }, [draft, onApply, onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h4 className="text-lg font-black text-retail-ink">Box Placement Editor</h4>
            <p className="mt-0.5 text-sm text-slate-500">
              Changes apply this session only, reload to restore defaults.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500 transition hover:bg-slate-50"
              >
                Reset to defaults
              </button>
            )}
            <button
              type="button"
              onClick={handleApply}
              className="rounded-full bg-retail-blue px-4 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-retail-blue-dark"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-500 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Box tabs */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 px-6 py-2">
          {boxNumbers.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setActiveBox(n)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-black transition
                ${activeBox === n
                  ? 'bg-retail-blue text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-retail-ink'}`}
            >
              Box {n}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <BoxEditor box={activeBox} draft={draft} onChange={handleChange} />
        </div>

        {/* Footer hint */}
        <div className="shrink-0 border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-slate-400">
            <strong className="font-black">Label</strong> — 7-char suffix used for matching.
            &nbsp;&nbsp;<strong className="font-black">Full EPC</strong> — optional, enables exact-match search.
            &nbsp;&nbsp;Leave a label empty to remove a slot.
          </p>
        </div>
      </div>
    </div>
  );
}
