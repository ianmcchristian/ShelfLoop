export function StoreMap() {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2 className="text-3xl font-black tracking-tight text-retail-ink">Store map</h2>
        </div>
        <p className="max-w-xl text-sm font-medium text-slate-600">
          Map canvas reset. Layout, fixtures, storage, and workflow animation will be rebuilt from
          here instead of patching the old demo UI.
        </p>
      </div>

      <div className="panel p-4">
        <div
          aria-label="Empty store map canvas"
          className="map-canvas flex min-h-[560px] items-center justify-center border-2 border-dashed border-retail-blue/25 bg-white"
        >
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-retail-blue text-white shadow-sm">
              <svg aria-hidden="true" className="h-7 w-7" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7.5 9 5l6 2.5 5-2.5v11.5L15 19l-6-2.5L4 19V7.5z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path d="M9 5v11.5M15 7.5V19" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-retail-blue">
              Empty map canvas
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Ready for the real top-view layout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
