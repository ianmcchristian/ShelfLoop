interface StoreMapSidebarProps {
  isPrecisionPicking: boolean;
  isShowcaseRunning: boolean;
  lastAction: string;
  locatorStatus: string;
  onPrecisionPickingToggle: () => void;
  onReplenish: () => void;
  onResetDemo: () => void;
  onShowcaseToggle: () => void;
}

export function StoreMapSidebar({
  isPrecisionPicking,
  isShowcaseRunning,
  lastAction,
  locatorStatus,
  onPrecisionPickingToggle,
  onReplenish,
  onResetDemo,
  onShowcaseToggle,
}: StoreMapSidebarProps) {
  return (
    <aside className="space-y-4">
      <div className="panel p-4">
        <p className="eyebrow">Map actions</p>
        <details className="group mx-auto mt-3 w-fit text-center">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-3 rounded-full bg-retail-blue px-5 py-2 text-sm font-black text-white shadow-sm transition hover:bg-retail-blue-dark">
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
