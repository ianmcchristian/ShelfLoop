import type { CSSProperties } from 'react';

export interface MerchandiseDotDetails {
  sku: string;
  name: string;
  rackLabel: string;
}

export type MerchandisePositionHighlight = 'available' | 'missing' | 'tap-to-light';

interface MerchandiseDotProps {
  active: boolean;
  details: MerchandiseDotDetails;
  className?: string;
  highlight?: MerchandisePositionHighlight | null;
  onHoverChange?: (isHovered: boolean) => void;
  onPick?: () => void;
  showTooltip?: boolean;
  sizeClassName?: string;
}

export function MerchandiseTooltip({
  className,
  details,
  isMissing,
  style,
}: {
  className: string;
  details: MerchandiseDotDetails;
  isMissing: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`pointer-events-none w-max max-w-48 border border-retail-blue/20 bg-white px-2.5 py-2 text-left text-[0.65rem] font-bold leading-4 text-slate-700 shadow-retail ${className}`}
      style={style}
    >
      <span
        className={`block font-black uppercase tracking-[0.16em] ${
          isMissing ? 'text-red-600' : 'text-retail-blue'
        }`}
      >
        {details.sku}
      </span>
      <span className="block whitespace-nowrap text-retail-ink">{details.name}</span>
      <span className="block text-slate-400">
        {details.rackLabel}
        {isMissing ? ' · Not in stock' : ''}
      </span>
    </span>
  );
}

export function MerchandiseDot({
  active,
  details,
  className = '',
  highlight = null,
  onHoverChange,
  onPick,
  showTooltip = true,
  sizeClassName = 'h-3.5 w-3.5',
}: MerchandiseDotProps) {
  const isAvailableHighlight = highlight === 'available';
  const isMissingHighlight = highlight === 'missing';
  // tap-to-light: the item is still physically absent (active is false),
  // but a worker is en route to restock it -- pulses green (hollow, same
  // way 'missing' is hollow-red) right on the dot itself instead of red.
  // Gated on `!active` so the instant `active` flips true (the nudge
  // completing), this collapses to false on the very next render -- no
  // separate phase-timing logic needed to "turn it off", it just falls out
  // of the state that already flips instantly.
  const isTapToLightHighlight = highlight === 'tap-to-light' && !active;
  const isGreenPulse = isAvailableHighlight || isTapToLightHighlight;
  const isHighlighted = isGreenPulse || isMissingHighlight;
  const activeClassName = isAvailableHighlight
    ? 'border-emerald-900 bg-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.85)]'
    : 'border-slate-800 bg-retail-blue shadow-sm';
  const inactiveClassName = isTapToLightHighlight
    ? 'border-emerald-600 bg-white shadow-[0_0_18px_rgba(34,197,94,0.72)]'
    : isMissingHighlight
      ? 'border-red-700 bg-white shadow-[0_0_18px_rgba(239,68,68,0.72)]'
      : 'border-slate-800 bg-white/90';
  const canPick = Boolean(onPick);

  return (
    <span
      aria-label={canPick ? `Pick ${details.sku} from ${details.rackLabel}` : undefined}
      className={`group/dot ${className} ${
        canPick
          ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35'
          : ''
      }`}
      role={canPick ? 'button' : undefined}
      tabIndex={canPick ? 0 : undefined}
      onClick={
        canPick
          ? (event) => {
              event.stopPropagation();
              onPick?.();
            }
          : undefined
      }
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onKeyDown={
        canPick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onPick?.();
              }
            }
          : undefined
      }
    >
      <span
        className={`relative inline-flex ${sizeClassName} items-center justify-center rounded-full`}
      >
        {isHighlighted ? (
          <>
            <span
              className={`pointer-events-none absolute -inset-2 rounded-full animate-ping ${
                isMissingHighlight ? 'bg-red-400/45' : 'bg-emerald-400/45'
              }`}
            />
            <span
              className={`pointer-events-none absolute -inset-1 rounded-full blur-sm ${
                isMissingHighlight ? 'bg-red-300/40' : 'bg-emerald-300/40'
              }`}
            />
          </>
        ) : null}
        <span
          aria-hidden="true"
          className={`relative block ${sizeClassName} rounded-full border-2 ${
            active ? activeClassName : inactiveClassName
          }`}
        />
      </span>

      {showTooltip && (active || isMissingHighlight) ? (
        <MerchandiseTooltip
          className="absolute bottom-full left-1/2 z-[120] mb-2 hidden -translate-x-1/2 group-hover/dot:block"
          details={details}
          isMissing={isMissingHighlight}
        />
      ) : null}
    </span>
  );
}
