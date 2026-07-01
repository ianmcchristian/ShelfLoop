import { useMemo, useState } from 'react';

type RackId = 'rack-a' | 'rack-b';
type RackStock = Record<RackId, number>;

interface RackConfig {
  id: RackId;
  label: string;
  category: string;
  mapClassName: string;
  capacity: number;
  startingStock: number;
  readRate: number;
  scanConfidence: number;
  dwellMinutes: number;
}

const racks: RackConfig[] = [
  {
    id: 'rack-a',
    label: 'Rack A',
    category: 'Performance polos',
    mapClassName: 'left-[10%] top-[23%] h-[27%] w-[34%]',
    capacity: 16,
    startingStock: 14,
    readRate: 96,
    scanConfidence: 93,
    dwellMinutes: 4,
  },
  {
    id: 'rack-b',
    label: 'Rack B',
    category: 'Folded core tees',
    mapClassName: 'left-[51%] top-[23%] h-[27%] w-[34%]',
    capacity: 18,
    startingStock: 16,
    readRate: 82,
    scanConfidence: 77,
    dwellMinutes: 9,
  },
];

const initialStock = racks.reduce<RackStock>((stock, rack) => {
  stock[rack.id] = rack.startingStock;
  return stock;
}, {} as RackStock);

function stockTone(stock: number, capacity: number): string {
  const stockRatio = stock / capacity;

  if (stockRatio < 0.45) {
    return 'border-red-300 bg-red-50';
  }

  if (stockRatio < 0.75) {
    return 'border-spark bg-yellow-50';
  }

  return 'border-retail-blue bg-retail-blue-light';
}

function MerchandiseSpot({ active, className = '' }: { active: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`h-3.5 w-3.5 rounded-full ${
        active
          ? 'bg-retail-blue shadow-sm ring-1 ring-white'
          : 'border border-dashed border-slate-300 bg-white/65'
      } ${className}`}
    />
  );
}

function MetricsPopover({ rack, stock }: { rack: RackConfig; stock: number }) {
  const missing = rack.capacity - stock;
  const fillRate = Math.round((stock / rack.capacity) * 100);

  return (
    <div className="absolute left-0 top-full z-50 mt-2 w-64 border border-retail-blue/20 bg-white p-3 text-left shadow-retail">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-retail-blue">
            Advanced metrics
          </p>
          <h4 className="mt-1 text-base font-black text-retail-ink">{rack.label}</h4>
        </div>
        <span className="bg-retail-blue px-2 py-1 text-[0.62rem] font-black text-white">Live</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-retail-blue-light p-2">
          <dt className="font-black uppercase tracking-[0.12em] text-slate-500">On rack</dt>
          <dd className="mt-1 text-lg font-black text-retail-ink">{stock}</dd>
        </div>
        <div className="bg-retail-blue-light p-2">
          <dt className="font-black uppercase tracking-[0.12em] text-slate-500">Fill</dt>
          <dd className="mt-1 text-lg font-black text-retail-ink">{fillRate}%</dd>
        </div>
        <div className="bg-slate-50 p-2">
          <dt className="font-black uppercase tracking-[0.12em] text-slate-500">RFID read</dt>
          <dd className="mt-1 text-lg font-black text-retail-ink">{rack.readRate}%</dd>
        </div>
        <div className="bg-slate-50 p-2">
          <dt className="font-black uppercase tracking-[0.12em] text-slate-500">Dwell</dt>
          <dd className="mt-1 text-lg font-black text-retail-ink">{rack.dwellMinutes}m</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
        {missing > 0
          ? `${missing} open merchandise position${missing === 1 ? '' : 's'} after simulated pulls.`
          : 'Rack is fully replenished.'}{' '}
        Confidence: {rack.scanConfidence}%.
      </p>
    </div>
  );
}

function HangingRackModule({ moduleIndex, stock }: { moduleIndex: number; stock: number }) {
  const firstPosition = moduleIndex * 4;

  return (
    <div className="relative h-full min-h-20">
      <span className="absolute left-1/2 top-2 h-[calc(100%-1rem)] w-1.5 -translate-x-1/2 bg-slate-800" />
      <span className="absolute left-[13%] right-[13%] top-[26%] h-1.5 bg-slate-800" />
      <span className="absolute left-[13%] right-[13%] bottom-[26%] h-1.5 bg-slate-800" />
      <span className="absolute left-[13%] top-[20%] h-4 w-1 bg-slate-800" />
      <span className="absolute right-[13%] top-[20%] h-4 w-1 bg-slate-800" />
      <span className="absolute bottom-[20%] left-[13%] h-4 w-1 bg-slate-800" />
      <span className="absolute bottom-[20%] right-[13%] h-4 w-1 bg-slate-800" />

      <MerchandiseSpot active={stock > firstPosition} className="absolute left-[20%] top-[15%]" />
      <MerchandiseSpot
        active={stock > firstPosition + 1}
        className="absolute right-[20%] top-[15%]"
      />
      <MerchandiseSpot
        active={stock > firstPosition + 2}
        className="absolute bottom-[15%] left-[20%]"
      />
      <MerchandiseSpot
        active={stock > firstPosition + 3}
        className="absolute bottom-[15%] right-[20%]"
      />
    </div>
  );
}

function HangingRackMerchandise({ stock }: { stock: number }) {
  return (
    <div className="grid h-full grid-cols-4 gap-2 rounded-sm bg-white/70 p-2">
      {Array.from({ length: 4 }, (_, moduleIndex) => (
        <HangingRackModule key={moduleIndex} moduleIndex={moduleIndex} stock={stock} />
      ))}
    </div>
  );
}

function DenseRackMerchandise({ stock, capacity }: { stock: number; capacity: number }) {
  const missing = capacity - stock;

  return (
    <div className="space-y-3">
      <div className="h-1.5 bg-slate-700" />
      <div className="grid grid-cols-9 gap-1.5 rounded-sm bg-white/80 p-2">
        {Array.from({ length: stock }, (_, index) => (
          <MerchandiseSpot key={`stock-${index}`} active />
        ))}
        {Array.from({ length: missing }, (_, index) => (
          <MerchandiseSpot key={`empty-${index}`} active={false} />
        ))}
      </div>
      <div className="h-1.5 bg-slate-700" />
    </div>
  );
}

interface RackFootprintProps {
  rack: RackConfig;
  stock: number;
  isInspecting: boolean;
  isSelected: boolean;
  onInspect: (rackId: RackId | null) => void;
  onPullItem: (rackId: RackId) => void;
}

function RackFootprint({
  rack,
  stock,
  isInspecting,
  isSelected,
  onInspect,
  onPullItem,
}: RackFootprintProps) {
  return (
    <button
      type="button"
      onClick={() => onPullItem(rack.id)}
      className={`absolute z-20 flex flex-col justify-between border-2 p-3 text-left shadow-sm transition hover:shadow-retail focus:outline-none focus:ring-4 focus:ring-retail-blue/25 ${rack.mapClassName} ${stockTone(
        stock,
        rack.capacity,
      )} ${isSelected ? 'ring-4 ring-retail-blue/20' : ''}`}
      aria-label={`${rack.label}, ${rack.category}. Click to simulate removing one item.`}
    >
      <span className="absolute -left-2 top-4 h-7 w-2 border border-slate-400 bg-white" />
      <span className="absolute -right-2 bottom-4 h-7 w-2 border border-slate-400 bg-white" />

      <div className="flex items-start justify-between gap-3">
        <div
          className="relative"
          onMouseEnter={() => onInspect(rack.id)}
          onMouseLeave={() => onInspect(null)}
        >
          <p className="w-fit text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500 underline decoration-transparent underline-offset-4 transition hover:text-retail-blue hover:decoration-retail-blue">
            {rack.label}
          </p>
          <h3 className="mt-1 text-sm font-black text-retail-ink">{rack.category}</h3>
          {isInspecting ? <MetricsPopover rack={rack} stock={stock} /> : null}
        </div>
        <span className="border border-slate-300 bg-white px-2 py-1 text-[0.65rem] font-black text-retail-blue">
          {stock}/{rack.capacity}
        </span>
      </div>

      <div className="min-h-[6.4rem]">
        {rack.id === 'rack-a' ? (
          <HangingRackMerchandise stock={stock} />
        ) : (
          <DenseRackMerchandise stock={stock} capacity={rack.capacity} />
        )}
      </div>
    </button>
  );
}

export function StoreMap() {
  const [stock, setStock] = useState<RackStock>(initialStock);
  const [inspectedRackId, setInspectedRackId] = useState<RackId | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<RackId | null>(null);
  const [lastAction, setLastAction] = useState(
    'Hover a rack name for metrics. Click a rack to pull one item.',
  );

  const inspectedRack = useMemo(
    () => racks.find((rack) => rack.id === inspectedRackId) ?? null,
    [inspectedRackId],
  );

  const selectedRack = useMemo(
    () => racks.find((rack) => rack.id === selectedRackId) ?? null,
    [selectedRackId],
  );

  const pullItem = (rackId: RackId) => {
    const rack = racks.find((candidate) => candidate.id === rackId);

    if (!rack) {
      return;
    }

    setSelectedRackId(rackId);
    setStock((currentStock) => {
      const nextStock = Math.max(currentStock[rackId] - 1, 0);
      setLastAction(
        nextStock === currentStock[rackId]
          ? `${rack.label} is already empty.`
          : `Pulled one item from ${rack.label}.`,
      );
      return { ...currentStock, [rackId]: nextStock };
    });
  };

  const replenish = () => {
    const targetRack = selectedRack ?? inspectedRack;

    if (targetRack) {
      setStock((currentStock) => ({ ...currentStock, [targetRack.id]: targetRack.capacity }));
      setLastAction(`${targetRack.label} replenished to full capacity.`);
      return;
    }

    setStock(
      racks.reduce<RackStock>((nextStock, rack) => {
        nextStock[rack.id] = rack.capacity;
        return nextStock;
      }, {} as RackStock),
    );
    setLastAction('All racks replenished to full capacity.');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2 className="text-3xl font-black tracking-tight text-retail-ink">Store map</h2>
        </div>
        <p className="max-w-xl text-sm font-medium text-slate-600">
          Zoomed apparel layout. Hover a rack name for metrics, click a rack to simulate a shopper
          pull, then replenish from the action menu.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="panel p-4">
          <div className="relative min-h-[560px] overflow-hidden border border-slate-300 bg-[#f7f8fa]">
            <div className="absolute inset-5 border border-slate-300 bg-white" />
            <div className="absolute left-8 top-8 z-10">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-slate-500">
                Men&apos;s basics bay
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Top-view apparel rack zone
              </p>
            </div>

            <div className="absolute bottom-[12%] left-[8%] right-[8%] h-[18%] border border-slate-300 bg-slate-50" />
            <p className="absolute bottom-[19%] left-[11%] z-10 text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-400">
              Main aisle
            </p>

            <div className="absolute right-[7%] top-[61%] h-[25%] w-[25%] border border-slate-300 bg-slate-50 p-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">
                Stockroom cart
              </p>
              <div className="mt-5 grid grid-cols-3 gap-1.5">
                {Array.from({ length: 9 }, (_, index) => (
                  <span key={index} className="h-4 border border-slate-300 bg-white" />
                ))}
              </div>
            </div>

            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 1000 560"
            >
              <path
                d="M 795 405 L 795 305 L 675 305"
                fill="none"
                stroke="#0071dc"
                strokeDasharray="9 9"
                strokeLinecap="round"
                strokeWidth="4"
              />
              <path
                d="M 795 405 L 795 305 L 300 305"
                fill="none"
                opacity="0.35"
                stroke="#0071dc"
                strokeDasharray="9 9"
                strokeLinecap="round"
                strokeWidth="4"
              />
            </svg>

            {racks.map((rack) => (
              <RackFootprint
                key={rack.id}
                rack={rack}
                stock={stock[rack.id]}
                isInspecting={inspectedRackId === rack.id}
                isSelected={selectedRackId === rack.id}
                onInspect={setInspectedRackId}
                onPullItem={pullItem}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel p-4">
            <p className="eyebrow">Map actions</p>
            <details className="mt-3 group">
              <summary className="flex cursor-pointer list-none items-center justify-between border border-slate-300 bg-white px-4 py-3 text-sm font-black text-retail-blue transition hover:bg-retail-blue-light">
                Action menu
                <span className="text-xs transition group-open:rotate-180">▼</span>
              </summary>
              <div className="border-x border-b border-slate-300 bg-white p-2">
                <button type="button" className="primary-button w-full" onClick={replenish}>
                  Replenish
                </button>
              </div>
            </details>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              Replenish targets the selected rack. If none is selected, it refills both racks.
            </p>
          </div>

          <div className="panel p-4">
            <p className="eyebrow">Interaction</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Hover only the rack name to open metrics. Click anywhere on a rack to simulate
              removing merchandise.
            </p>
          </div>

          <div className="panel p-4">
            <p className="eyebrow">Last event</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">{lastAction}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
