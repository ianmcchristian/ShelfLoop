import logoUrl from '../../assets/shelfloop-logo.png';
import type { ReactNode } from 'react';
import type { RouteId } from '../../routes';

interface AppShellProps {
  children: ReactNode;
  route: RouteId;
  onRouteChange: (route: RouteId) => void;
}

const navItems: { id: RouteId; label: string; icon: 'map' | 'info' }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'map' },
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

function NavIcon({ icon }: { icon: 'map' | 'info' }) {
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

export function AppShell({ children, route, onRouteChange }: AppShellProps) {
  return (
    <main className="min-h-screen bg-retail-canvas text-retail-ink">
      <header className="bg-retail-blue text-white shadow-retail">
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

          <div className="hidden min-w-0 flex-1 lg:mx-8 lg:block">
            <div className="flex h-11 items-center gap-3 rounded-full bg-white px-4 text-sm font-semibold text-slate-500 shadow-sm">
              <svg aria-hidden="true" className="h-4 w-4 text-retail-blue" viewBox="0 0 20 20" fill="none">
                <path
                  d="M8.5 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm4-1.5 4 4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
              <span>Store map workspace</span>
            </div>
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
