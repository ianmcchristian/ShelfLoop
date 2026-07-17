import logoUrl from '../../assets/shelfloop-logo.png';
import type { ReactNode } from 'react';
import type { RouteId } from '../../routes';

interface LocatorSuggestion {
  sku: string;
  name: string;
  rackLabel: string;
}

interface AppShellProps {
  children: ReactNode;
  locatorQuery: string;
  locatorSuggestions: LocatorSuggestion[];
  route: RouteId;
  onLocatorClear: () => void;
  onLocatorQueryChange: (query: string) => void;
  onLocatorSubmit: () => void;
  onLocatorSuggestionSelect: (sku: string) => void;
  onRouteChange: (route: RouteId) => void;
}

const navItems: { id: RouteId; label: string; icon: 'map' | 'info' | 'chart' }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'map' },
  { id: 'analysis', label: 'Analysis', icon: 'chart' },
  { id: 'about', label: 'About', icon: 'info' },
];

function ShelfLoopMark() {
  return (
    <img
      src={logoUrl}
      alt="ShelfLoop logo"
      className="h-12 w-12 rounded-xl object-cover shadow-sm ring-1 ring-white/25"
    />
  );
}

function NavIcon({ icon }: { icon: 'map' | 'info' | 'chart' }) {
  if (icon === 'chart') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="12" width="3" height="6" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="7" y="8" width="3" height="10" rx="1" fill="currentColor" opacity="0.8" />
        <rect x="12" y="4" width="3" height="14" rx="1" fill="currentColor" />
        <path d="M17 6 L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'info') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M10 9v5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <circle cx="10" cy="6" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 5.5l4-1.5 6 2 4-1.5v10l-4 1.5-6-2-4 1.5v-10z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path d="M7 4v10m6-8v10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function AppShell({
  children,
  locatorQuery,
  locatorSuggestions,
  route,
  onLocatorClear,
  onLocatorQueryChange,
  onLocatorSubmit,
  onLocatorSuggestionSelect,
  onRouteChange,
}: AppShellProps) {
  const isLocatorEnabled = route === 'dashboard';
  const shouldShowLocatorSuggestions =
    isLocatorEnabled && locatorQuery.trim().length > 0 && locatorSuggestions.length > 0;

  return (
    <main className="min-h-screen bg-retail-canvas text-retail-ink">
      <header className="relative z-[200] bg-retail-blue text-white shadow-retail">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <ShelfLoopMark />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                RFID retail concept
              </p>
              <h1 className="text-2xl font-black tracking-tight">ShelfLoop</h1>
            </div>
          </div>

          <div className="relative hidden min-w-0 flex-1 lg:mx-8 lg:block">
            <div
              className={`flex h-11 items-center gap-3 rounded-full bg-white px-4 text-sm font-semibold shadow-sm ${
                isLocatorEnabled ? 'text-retail-ink' : 'text-slate-400 opacity-75'
              }`}
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-retail-blue"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M8.5 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm4-1.5 4 4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
              <input
                aria-label="Enter a SKU and press Enter to ping it on the store map"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-retail-ink outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={!isLocatorEnabled}
                placeholder={
                  isLocatorEnabled
                    ? 'Enter SKU, then press Enter to ping it on the map'
                    : 'Open Dashboard to ping a SKU on the map'
                }
                type="search"
                value={locatorQuery}
                onChange={(event) => onLocatorQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onLocatorSubmit();
                  }
                }}
              />
              {isLocatorEnabled && locatorQuery ? (
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400 transition hover:bg-retail-blue-light hover:text-retail-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35"
                  onClick={onLocatorClear}
                >
                  Clear
                </button>
              ) : null}
            </div>

            {shouldShowLocatorSuggestions ? (
              <div className="absolute left-0 right-0 top-full z-[220] mt-2 overflow-hidden rounded-2xl border border-retail-blue/15 bg-white text-retail-ink shadow-retail">
                <p className="border-b border-slate-100 px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-400">
                  SKU matches
                </p>
                <div className="max-h-64 overflow-y-auto py-1">
                  {locatorSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.sku}
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition hover:bg-retail-blue-light focus:bg-retail-blue-light focus:outline-none"
                      onClick={() => onLocatorSuggestionSelect(suggestion.sku)}
                    >
                      <span>
                        <span className="block text-sm font-black text-retail-blue">
                          {suggestion.sku}
                        </span>
                        <span className="block text-xs font-semibold text-slate-500">
                          {suggestion.name}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">
                        {suggestion.rackLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <nav aria-label="Primary navigation" className="flex gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onRouteChange(item.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                  route === item.id
                    ? 'bg-white text-retail-blue shadow-sm'
                    : 'bg-retail-blue-dark/45 text-white hover:bg-retail-blue-dark'
                }`}
              >
                <NavIcon icon={item.icon} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6">{children}</section>
    </main>
  );
}
