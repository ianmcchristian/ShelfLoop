// ─── Analysis Actions Panel ────────────────────────────────────────────────────
// Sidebar action menu for the Analysis tab.
// CSV placement upload replaced by the in-session placement editor modal.

import type { ResolvedTagPlacement } from './rfidTypes';
import { PlacementEditorModal } from './PlacementEditorModal';

interface AnalysisActionsPanelProps {
  placements: ResolvedTagPlacement[];
  editorOpen: boolean;
  isSyncRotating: boolean;
  showAntennaGuide: boolean;
  showCompassGuide: boolean;
  onReset: () => void;
  onPlacementsChange: (placements: ResolvedTagPlacement[]) => void;
  onEditorOpenChange: (open: boolean) => void;
  onSyncRotatingToggle: () => void;
  onAntennaGuideToggle: () => void;
  onCompassGuideToggle: () => void;
}

export function AnalysisActionsPanel({
  placements,
  editorOpen,
  isSyncRotating,
  showAntennaGuide,
  showCompassGuide,
  onReset,
  onPlacementsChange,
  onEditorOpenChange,
  onSyncRotatingToggle,
  onAntennaGuideToggle,
  onCompassGuideToggle,
}: AnalysisActionsPanelProps) {

  return (
    <>
      <div className="panel p-4">
        <p className="eyebrow">Analysis actions</p>

        <details className="group mt-3 w-full text-center">
          <summary className="inline-flex cursor-pointer list-none items-center justify-center gap-3 rounded-full bg-retail-blue px-5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-retail-blue-dark">
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

          <div className="mt-4 space-y-3 text-center text-sm font-semibold text-slate-600">
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
                  <p className="text-[0.6rem] font-black uppercase tracking-[0.12em] text-slate-400">
                    Placement database
                  </p>
                  <button
                    type="button"
                    className="mx-auto block rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 ring-1 ring-slate-200 transition hover:bg-retail-blue-light hover:text-retail-blue hover:ring-retail-blue/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35"
                    onClick={() => onEditorOpenChange(true)}
                  >
                    Box Placement
                  </button>

                  <p className="pt-2 text-[0.6rem] font-black uppercase tracking-[0.12em] text-slate-400">
                    Rig overlays
                  </p>
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
