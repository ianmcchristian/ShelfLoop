import type { ShowcaseCheckpoint } from './storeMapShowcase';

interface StoreMapSidebarProps {
  isPrecisionPicking: boolean;
  isShowcasePaused: boolean;
  isShowcaseRunning: boolean;
  lastAction: string;
  locatorStatus: string;
  devCheckpoints: ShowcaseCheckpoint[];
  onJumpToCheckpoint: (checkpoint: ShowcaseCheckpoint) => void;
  onPrecisionPickingToggle: () => void;
  onReplenish: () => void;
  onResetDemo: () => void;
  onShowcasePlaybackToggle: () => void;
  onShowcaseToggle: () => void;
}

export function StoreMapSidebar({
  devCheckpoints,
  isPrecisionPicking,
  isShowcasePaused,
  isShowcaseRunning,
  lastAction,
  locatorStatus,
  onJumpToCheckpoint,
  onPrecisionPickingToggle,
  onReplenish,
  onResetDemo,
  onShowcasePlaybackToggle,
  onShowcaseToggle,
}: StoreMapSidebarProps) {
  return (
    <aside className="space-y-4">
      <div className="panel p-4">
        <p className="eyebrow">Map actions</p>
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
              aria-pressed={isPrecisionPicking}
              className={`mx-auto flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35 ${
                isPrecisionPicking
                  ? 'bg-retail-blue text-white shadow-sm'
                  : 'bg-retail-blue-light text-retail-blue hover:bg-retail-blue hover:text-white'
              } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300`}
              disabled={isShowcaseRunning}
              onClick={onPrecisionPickingToggle}
            >
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full ${
                  isPrecisionPicking
                    ? 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]'
                    : 'bg-slate-300'
                }`}
              />
              Precision picking
            </button>
            <button
              type="button"
              className="mx-auto block transition hover:text-retail-blue focus:outline-none focus-visible:underline"
              onClick={onShowcaseToggle}
            >
              {isShowcaseRunning ? 'Cancel showcase' : 'Showcase A'}
            </button>
            <button
              type="button"
              className="mx-auto block transition hover:text-retail-blue focus:outline-none focus-visible:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300"
              disabled={isShowcaseRunning}
              onClick={onReplenish}
            >
              Replenish
            </button>
            <button
              type="button"
              className="mx-auto block transition hover:text-retail-blue focus:outline-none focus-visible:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300"
              disabled={isShowcaseRunning}
              onClick={onResetDemo}
            >
              Reset demo
            </button>

            {/* ── Dev panel ──────────────────────────────────── */}
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
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    aria-label={isShowcasePaused ? 'Start animation' : 'Stop animation'}
                    className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300 disabled:ring-slate-200 ${
                      isShowcasePaused
                        ? 'bg-emerald-50 text-emerald-600 ring-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-50 text-red-600 ring-red-200 hover:bg-red-100'
                    }`}
                    disabled={!isShowcaseRunning}
                    onClick={onShowcasePlaybackToggle}
                  >
                    {isShowcasePaused ? (
                      <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 12 12">
                        <path d="M3 2.2v7.6c0 .5.54.8.96.53l5.8-3.8a.63.63 0 0 0 0-1.06l-5.8-3.8A.63.63 0 0 0 3 2.2Z" />
                      </svg>
                    ) : (
                      <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 12 12">
                        <rect x="2.2" y="2" width="2.4" height="8" rx="0.6" />
                        <rect x="7.4" y="2" width="2.4" height="8" rx="0.6" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  Jump to checkpoint
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {devCheckpoints.map((cp) => (
                    <button
                      key={cp.phase}
                      type="button"
                      className="rounded-lg bg-slate-50 px-2 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500 ring-1 ring-slate-200 transition hover:bg-amber-50 hover:text-amber-700 hover:ring-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                      onClick={() => onJumpToCheckpoint(cp)}
                    >
                      {cp.label}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </details>
      </div>

      <div className="panel p-4">
        <p className="eyebrow">Item locator</p>
        <p className="mt-2 text-sm font-semibold text-slate-600">{locatorStatus}</p>
      </div>

      <div className="panel p-4">
        <p className="eyebrow">Last event</p>
        <p className="mt-2 text-sm font-semibold text-slate-600">{lastAction}</p>
      </div>
    </aside>
  );
}
