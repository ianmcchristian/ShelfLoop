import { useState } from 'react';

import {
  BackstockRoom,
  CardboardBoxIcon,
  HangingRackMerchandise,
  TieredDisplayMerchandise,
  backroomBoxCount,
} from './StoreMapFixtures';

type RackId = 'rack-a' | 'rack-b';
type RackInventory = Record<RackId, boolean[]>;

interface RackConfig {
  id: RackId;
  label: string;
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
    mapClassName: 'left-[10%] top-[23%] h-[27%] w-[34%]',
    capacity: 16,
    startingStock: 16,
    readRate: 96,
    scanConfidence: 93,
    dwellMinutes: 4,
  },
  {
    id: 'rack-b',
    label: 'Rack B',
    mapClassName: 'left-[51%] top-[23%] h-[27%] w-[34%]',
    capacity: 54,
    startingStock: 54,
    readRate: 82,
    scanConfidence: 77,
    dwellMinutes: 9,
  },
];

function createRackPositions(rack: RackConfig, fillTo: number): boolean[] {
  return Array.from({ length: rack.capacity }, (_, index) => index < fillTo);
}

function createInitialInventory(): RackInventory {
  return racks.reduce<RackInventory>((inventory, rack) => {
    inventory[rack.id] = createRackPositions(rack, rack.startingStock);
    return inventory;
  }, {} as RackInventory);
}

const initialInventory = createInitialInventory();

function countActivePositions(positions: boolean[]): number {
  return positions.filter(Boolean).length;
}

function chooseRandomIndex(indexes: number[]): number | null {
  if (indexes.length === 0) {
    return null;
  }

  return indexes[Math.floor(Math.random() * indexes.length)] ?? null;
}

function chooseRandomActiveIndex(positions: boolean[]): number | null {
  return chooseRandomIndex(positions.flatMap((isActive, index) => (isActive ? [index] : [])));
}

function chooseRandomDenseRackIndex(positions: boolean[]): number | null {
  const removableIndexes: number[] = [];

  for (let clusterStart = 0; clusterStart < positions.length; clusterStart += 3) {
    const leftIndex = clusterStart;
    const centerIndex = clusterStart + 1;
    const rightIndex = clusterStart + 2;

    if (positions[leftIndex]) {
      removableIndexes.push(leftIndex);
    }

    if (positions[rightIndex]) {
      removableIndexes.push(rightIndex);
    }

    if (!positions[leftIndex] && !positions[rightIndex] && positions[centerIndex]) {
      removableIndexes.push(centerIndex);
    }
  }

  return chooseRandomIndex(removableIndexes);
}

function chooseRandomPullIndex(rackId: RackId, positions: boolean[]): number | null {
  return rackId === 'rack-b'
    ? chooseRandomDenseRackIndex(positions)
    : chooseRandomActiveIndex(positions);
}

function createFullInventory(): RackInventory {
  return racks.reduce<RackInventory>((inventory, rack) => {
    inventory[rack.id] = createRackPositions(rack, rack.capacity);
    return inventory;
  }, {} as RackInventory);
}

function createFullBackroomBoxes(): boolean[] {
  return Array.from({ length: backroomBoxCount }, () => true);
}

type InventorySignalLevel = 'healthy' | 'warning' | 'critical';

function inventorySignalLevel(stock: number, capacity: number): InventorySignalLevel {
  const stockRatio = stock / capacity;

  if (stockRatio < 0.3) {
    return 'critical';
  }

  if (stockRatio < 0.6) {
    return 'warning';
  }

  return 'healthy';
}

function rfidSignalTone(stock: number, capacity: number): string {
  const level = inventorySignalLevel(stock, capacity);

  if (level === 'critical') {
    return 'bg-red-400/25 shadow-[0_0_58px_rgba(239,68,68,0.42)]';
  }

  if (level === 'warning') {
    return 'bg-spark/25 shadow-[0_0_58px_rgba(255,194,32,0.42)]';
  }

  return 'bg-retail-blue/20 shadow-[0_0_58px_rgba(0,113,220,0.34)]';
}

function RfidSignalGlow({ stock, capacity }: { stock: number; capacity: number }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute left-1/2 top-[60%] z-0 h-[56%] w-[94%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] blur-2xl transition ${rfidSignalTone(
        stock,
        capacity,
      )}`}
    />
  );
}

function RfidScannerIcon({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-7 w-7';

  return (
    <svg
      aria-hidden="true"
      className={`${iconSize} overflow-hidden text-retail-blue drop-shadow-[0_0_4px_rgba(0,113,220,0.35)]`}
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

function RfidLegend() {
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

function MetricsPopover({ rack, stock }: { rack: RackConfig; stock: number }) {
  const missing = rack.capacity - stock;
  const fillRate = Math.round((stock / rack.capacity) * 100);

  return (
    <div className="absolute left-1/2 top-full z-[100] mt-2 w-64 -translate-x-1/2 border border-retail-blue/20 bg-white p-3 text-left shadow-retail">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-retail-blue">
            Advanced metrics
          </p>
          <h4 className="mt-1 text-base font-black text-retail-ink">{rack.label}</h4>
        </div>
        <span className="flex items-center gap-1.5 text-[0.62rem] font-black uppercase tracking-[0.12em] text-red-600">
          <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.75)]" />
          Live
        </span>
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
        RFID reader active. Confidence: {rack.scanConfidence}%.
      </p>
    </div>
  );
}

interface RackFootprintProps {
  rack: RackConfig;
  occupiedPositions: boolean[];
  isInspecting: boolean;
  onInspect: (rackId: RackId | null) => void;
  onPullItem: (rackId: RackId) => void;
}

function RackFootprint({
  rack,
  occupiedPositions,
  isInspecting,
  onInspect,
  onPullItem,
}: RackFootprintProps) {
  const stock = countActivePositions(occupiedPositions);

  return (
    <button
      type="button"
      onClick={() => onPullItem(rack.id)}
      className={`absolute ${
        isInspecting ? 'z-50' : 'z-20'
      } flex items-center justify-center bg-transparent p-0 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35 ${rack.mapClassName}`}
      aria-label={`${rack.label}. RFID scanner active. Click to simulate removing one random item.`}
    >
      <RfidSignalGlow stock={stock} capacity={rack.capacity} />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2">
        <div
          className="relative flex flex-col items-center"
          onMouseEnter={() => onInspect(rack.id)}
          onMouseLeave={() => onInspect(null)}
        >
          <RfidScannerIcon />
          <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-600 underline decoration-transparent underline-offset-4 transition hover:text-retail-blue hover:decoration-retail-blue">
            {rack.label}
          </p>
          {isInspecting ? <MetricsPopover rack={rack} stock={stock} /> : null}
        </div>

        <div className="relative z-10 min-h-[6.4rem] w-full">
          {rack.id === 'rack-a' ? (
            <HangingRackMerchandise occupiedPositions={occupiedPositions} />
          ) : (
            <TieredDisplayMerchandise occupiedPositions={occupiedPositions} />
          )}
        </div>
      </div>
    </button>
  );
}

export function StoreMap() {
  const [inventory, setInventory] = useState<RackInventory>(initialInventory);
  const [backroomBoxes, setBackroomBoxes] = useState(createFullBackroomBoxes);
  const [inspectedRackId, setInspectedRackId] = useState<RackId | null>(null);
  const [lastAction, setLastAction] = useState(
    'Hover a rack name for metrics. Click a rack to pull one random item.',
  );

  const pullItem = (rackId: RackId) => {
    const rack = racks.find((candidate) => candidate.id === rackId);

    if (!rack) {
      return;
    }

    setInventory((currentInventory) => {
      const randomActiveIndex = chooseRandomPullIndex(rackId, currentInventory[rackId]);

      if (randomActiveIndex === null) {
        setLastAction(`${rack.label} is already empty.`);
        return currentInventory;
      }

      const nextRackPositions = [...currentInventory[rackId]];
      nextRackPositions[randomActiveIndex] = false;
      setLastAction(`Pulled one random item from ${rack.label}.`);

      return { ...currentInventory, [rackId]: nextRackPositions };
    });
  };

  const replenish = () => {
    const consumedBoxIndex = chooseRandomActiveIndex(backroomBoxes);

    if (consumedBoxIndex === null) {
      setLastAction('Backroom reserve is empty. Reset demo to restock storage.');
      return;
    }

    setInventory(createFullInventory());
    setBackroomBoxes((currentBoxes) =>
      currentBoxes.map((isActive, index) => (index === consumedBoxIndex ? false : isActive)),
    );
    setLastAction('Sales floor replenished. One backroom box consumed.');
  };

  const resetDemo = () => {
    setInventory(createInitialInventory());
    setBackroomBoxes(createFullBackroomBoxes());
    setLastAction('Demo reset to starting rack stock and full backroom reserve.');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-24">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2 className="text-3xl font-black tracking-tight text-retail-ink">Store map</h2>
        </div>
        <p className="max-w-none whitespace-nowrap text-sm font-medium text-slate-600">
          Hover only the rack name to open metrics. Click anywhere on a rack to simulate removing
          merchandise.
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
            <div className="absolute right-8 top-8 z-10">
              <RfidLegend />
            </div>

            <BackstockRoom occupiedBoxes={backroomBoxes} />

            {racks.map((rack) => (
              <RackFootprint
                key={rack.id}
                rack={rack}
                occupiedPositions={inventory[rack.id]}
                isInspecting={inspectedRackId === rack.id}
                onInspect={setInspectedRackId}
                onPullItem={pullItem}
              />
            ))}
          </div>
        </div>

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
                  className="mx-auto block transition hover:text-retail-blue focus:outline-none focus-visible:underline"
                  onClick={replenish}
                >
                  Replenish
                </button>
                <button
                  type="button"
                  className="mx-auto block transition hover:text-retail-blue focus:outline-none focus-visible:underline"
                  onClick={resetDemo}
                >
                  Reset demo
                </button>
              </div>
            </details>
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
