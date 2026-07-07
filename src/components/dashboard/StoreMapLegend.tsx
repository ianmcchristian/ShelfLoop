import { CardboardBoxIcon } from './StoreMapFixtures';

export function RfidScannerIcon({
  className = '',
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md';
}) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-7 w-7';

  return (
    <svg
      aria-hidden="true"
      className={`${iconSize} overflow-hidden text-retail-blue drop-shadow-[0_0_4px_rgba(0,113,220,0.35)] ${className}`}
      fill="none"
      viewBox="0 0 28 28"
    >
      <circle cx="14" cy="14" fill="currentColor" r="3.25" />
      <circle cx="14" cy="14" opacity="0.38" r="5.75" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="14" cy="14" opacity="0.52" r="5.75" stroke="currentColor" strokeWidth="1.2">
        <animate attributeName="r" dur="3.4s" repeatCount="indefinite" values="5.75;12" />
        <animate attributeName="opacity" dur="3.4s" repeatCount="indefinite" values="0.52;0" />
      </circle>
      <circle cx="14" cy="14" opacity="0" r="5.75" stroke="currentColor" strokeWidth="1.2">
        <animate
          attributeName="r"
          begin="1.7s"
          dur="3.4s"
          repeatCount="indefinite"
          values="5.75;12"
        />
        <animate
          attributeName="opacity"
          begin="1.7s"
          dur="3.4s"
          repeatCount="indefinite"
          values="0.52;0"
        />
      </circle>
    </svg>
  );
}

function SingleItemIcon() {
  return (
    <span
      aria-hidden="true"
      className="h-3 w-3 rounded-full border-2 border-slate-800 bg-retail-blue"
    />
  );
}

function TripleItemIcon() {
  const lobeClassName =
    'absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-slate-800 bg-retail-blue';

  return (
    <span aria-hidden="true" className="relative inline-block h-3.5 w-6">
      <span className={`${lobeClassName} left-0`} />
      <span className={`${lobeClassName} right-0`} />
      <span className="absolute left-1/2 top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-800 bg-retail-blue" />
    </span>
  );
}

export function RfidLegend() {
  return (
    <div className="space-y-1.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-retail-blue">
      <div className="flex items-center gap-1.5">
        <RfidScannerIcon size="sm" />
        <span>RFID Scanner</span>
      </div>
      <div className="flex items-center gap-1.5">
        <SingleItemIcon />
        <span className="text-slate-400">/</span>
        <TripleItemIcon />
        <span>Items</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CardboardBoxIcon className="h-3.5 w-3.5" />
        <span>Replenishments</span>
      </div>
    </div>
  );
}
