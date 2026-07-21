// ─── Analysis Actions Panel ────────────────────────────────────────────────────
// Sidebar action menu for the Analysis tab.
// Shows DOE primary metrics (Y1/Y2) inline when scan data is loaded,
// and a single "Run Summary" download gated on complete antenna config.

import { useEffect, useRef } from 'react';
import type { ResolvedTagPlacement } from './rfidTypes';
import { PlacementEditorModal } from './PlacementEditorModal';

interface DoEMetrics {
  y1: number; // overall coverage %
  y2: number; // CV of box coverage %
}

interface AnalysisActionsPanelProps {
  placements: ResolvedTagPlacement[];
  editorOpen: boolean;
  isSyncRotating: boolean;
  showAntennaGuide: boolean;
  showCompassGuide: boolean;
  canExport: boolean;
  doEMetrics: DoEMetrics | null;
  selectedBox: number | null;
  onRequestBoxDeselect: () => void;
  onReset: () => void;
  onPlacementsChange: (placements: ResolvedTagPlacement[]) => void;
  onEditorOpenChange: (open: boolean) => void;
  onSyncRotatingToggle: () => void;
  onAntennaGuideToggle: () => void;
  onCompassGuideToggle: () => void;
  onExportRunSummary: () => void;
}

// ── Mini zone bar ────────────────────────────────────────────────────────────
// Renders a small horizontal bar with a red background zone and a green
// highlight zone, plus a tick marker at the current value position.
// Both min and greenMin are assumed to be 0 for simplicity.
function MiniBar({
  value,
  max,
  greenThreshold, // values >= this are "in the green" (for Y1)
  invertGreen,    // true = values <= greenThreshold are "in the green" (for Y2)
}: {
  value: number;
  max: number;
  greenThreshold: number;
  invertGreen?: boolean;
}) {
  const clampPct = (v: number) => Math.min(Math.max((v / max) * 100, 0), 100);
  const markerPct     = clampPct(value);
  const thresholdPct  = clampPct(greenThreshold);

  // green zone spans from threshold→100% (Y1) or 0→threshold (Y2)
  const greenLeft  = invertGreen ? 0              : thresholdPct;
  const greenWidth = invertGreen ? thresholdPct   : 100 - thresholdPct;

  return (
    <div className="relative mt-1.5 h-2 w-full rounded-full bg-red-300/50">
      {/* green zone */}
      <div
        className="absolute top-0 h-full rounded-full bg-emerald-400/75"
        style={{ left: `${greenLeft}%`, width: `${greenWidth}%` }}
      />
      {/* value tick marker */}
      <div
        className="absolute top-1/2 h-3.5 w-[3px] -translate-y-1/2 rounded-full bg-slate-700 ring-1 ring-white"
        style={{ left: `calc(${markerPct}% - 1.5px)` }}
      />
    </div>
  );
}

const DownloadIcon = () => (
  <svg
    aria-hidden="true"
    className="h-3.5 w-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export function AnalysisActionsPanel({
  placements,
  editorOpen,
  isSyncRotating,
  showAntennaGuide,
  showCompassGuide,
  canExport,
  doEMetrics,
  selectedBox,
  onReset,
  onPlacementsChange,
  onEditorOpenChange,
  onSyncRotatingToggle,
  onAntennaGuideToggle,
  onCompassGuideToggle,
  onExportRunSummary,
  onRequestBoxDeselect,
}: AnalysisActionsPanelProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Close the action menu whenever a box is selected
  useEffect(() => {
    if (selectedBox !== null && detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, [selectedBox]);

  // Collapse the dropdown on a single click anywhere outside it
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const el = detailsRef.current;
      if (el && el.open && !el.contains(e.target as Node)) {
        el.open = false;
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <>
      <div className="panel p-4">
        <p className="eyebrow">Analysis actions</p>

        {/* ── DOE Metrics ────────────────────────────────────────────────── */}
        <div className="mt-3">
          <p className="mb-2 text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-400">
            DOE Primary Metrics
          </p>
          {doEMetrics ? (
            <div className="rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
              <div className="space-y-3">
                {/* Y1 */}
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[0.62rem] font-bold text-slate-500">Y1&nbsp;&nbsp;Coverage</span>
                    <span className="text-[0.78rem] font-black tabular-nums text-emerald-600">
                      {doEMetrics.y1.toFixed(1)}%
                    </span>
                  </div>
                  <MiniBar value={doEMetrics.y1} max={100} greenThreshold={80} />
                </div>
                {/* Y2 */}
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[0.62rem] font-bold text-slate-500">Y2&nbsp;&nbsp;Distribution CV</span>
                    <span className="text-[0.78rem] font-black tabular-nums text-retail-blue">
                      {doEMetrics.y2.toFixed(1)}%
                    </span>
                  </div>
                  <MiniBar value={doEMetrics.y2} max={75} greenThreshold={25} invertGreen />
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-center text-[0.62rem] text-slate-400 ring-1 ring-slate-100">
              Load scan data to see metrics
            </p>
          )}
        </div>

        {/* ── Export ─────────────────────────────────────────────────────── */}
        <div className="mt-3">
          <p className="mb-2 text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-400">
            Export
          </p>
          {canExport ? (
            <button
              type="button"
              onClick={onExportRunSummary}
              className="flex w-full items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-left text-[0.68rem] font-black tracking-[0.06em] text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <DownloadIcon />
              <span className="leading-tight">
                Run Summary
                <span className="block text-[0.58rem] font-semibold text-emerald-500">
                  all slots · Y1+Y2 included
                </span>
              </span>
            </button>
          ) : (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-center text-[0.62rem] text-slate-400 ring-1 ring-slate-100">
              Fill in antenna config<br />to enable export
            </p>
          )}
        </div>

        <div className="my-3 border-t border-slate-100" />

        <details ref={detailsRef} className="group relative w-full text-center">
          <summary
            className="inline-flex cursor-pointer list-none items-center justify-center gap-3 rounded-full bg-retail-blue px-5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-retail-blue-dark"
            onClick={() => { if (selectedBox !== null) onRequestBoxDeselect(); }}
          >
            <span>Action menu</span>
            <svg
              aria-hidden="true"
              className="h-4 w-4 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 16 16"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </summary>

          {/* Floating overlay — position:absolute so it doesn't push the 3D model down */}
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="space-y-3 text-center text-sm font-semibold text-slate-600">
            <button
              type="button"
              aria-pressed={isSyncRotating}
              className={`mx-auto flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35 ${
                isSyncRotating
                  ? 'bg-retail-blue text-white shadow-sm'
                  : 'bg-retail-blue-light text-retail-blue hover:bg-retail-blue hover:text-white'
              }`}
              onClick={onSyncRotatingToggle}
            >
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  isSyncRotating
                    ? 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]'
                    : 'bg-slate-300'
                }`}
              />
              Sync Rotating
            </button>

            <button
              type="button"
              className="mx-auto block transition hover:text-retail-blue focus:outline-none focus-visible:underline"
              onClick={onReset}
            >
              Reset
            </button>

            {/* Dev sub-section */}
            <div className="mt-1 border-t border-slate-100 pt-3">
              <details className="group/dev">
                <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 focus:outline-none">
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                    DEV
                  </span>
                  <svg
                    aria-hidden="true"
                    className="h-3 w-3 text-slate-400 transition-transform group-open/dev:rotate-180"
                    fill="none"
                    viewBox="0 0 12 12"
                  >
                    <path
                      d="M3 4.5l3 3 3-3"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </summary>

                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    className="mx-auto block rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 ring-1 ring-slate-200 transition hover:bg-retail-blue-light hover:text-retail-blue hover:ring-retail-blue/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35"
                    onClick={() => onEditorOpenChange(true)}
                  >
                    Box Placement
                  </button>

                  <button
                    type="button"
                    aria-pressed={showAntennaGuide}
                    className={`mx-auto block rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35 ${
                      showAntennaGuide
                        ? 'bg-retail-blue text-white ring-retail-blue shadow-sm'
                        : 'bg-slate-50 text-slate-500 ring-slate-200 hover:bg-retail-blue-light hover:text-retail-blue hover:ring-retail-blue/30'
                    }`}
                    onClick={onAntennaGuideToggle}
                  >
                    Antenna Guide
                  </button>
                  <button
                    type="button"
                    aria-pressed={showCompassGuide}
                    className={`mx-auto block rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35 ${
                      showCompassGuide
                        ? 'bg-retail-blue text-white ring-retail-blue shadow-sm'
                        : 'bg-slate-50 text-slate-500 ring-slate-200 hover:bg-retail-blue-light hover:text-retail-blue hover:ring-retail-blue/30'
                    }`}
                    onClick={onCompassGuideToggle}
                  >
                    Compass Markers
                  </button>
                </div>
              </details>
            </div>
          </div>
          </div>
        </details>
      </div>

      {editorOpen && (
        <PlacementEditorModal
          placements={placements}
          onApply={onPlacementsChange}
          onClose={() => onEditorOpenChange(false)}
        />
      )}
    </>
  );
}
