import { useState } from 'react';

import {
  BackstockRoom,
  HangingRackMerchandise,
  TieredDisplayMerchandise,
  backroomBoxCount,
  type MerchandiseDotDetails,
  type MerchandisePositionHighlight,
} from './StoreMapFixtures';
import { RfidLegend, RfidScannerIcon } from './StoreMapLegend';
import { StoreMapSidebar } from './StoreMapSidebar';
import {
  chooseDenseRackStackPickIndex,
  chooseRandomActiveIndex,
  chooseRandomDenseRackIndex,
} from './storeMapPicking';
import {
  findRackItemBySku,
  getPositionIndexesForSku,
  getRackItemForPosition,
  getRackPositionLabel,
  normalizeSku,
  racks,
  type RackConfig,
  type RackId,
  type RackInventory,
} from './storeMapCatalog';

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

function createPositionDetails(rack: RackConfig): MerchandiseDotDetails[] {
  return Array.from({ length: rack.capacity }, (_, positionIndex) => {
    const item = getRackItemForPosition(rack, positionIndex);

    return {
      ...item,
      rackLabel: `${rack.label} · ${getRackPositionLabel(rack, positionIndex)}`,
    };
  });
}

function createPositionHighlights(
  positions: boolean[],
  rack: RackConfig,
  selectedSku: string,
): (MerchandisePositionHighlight | null)[] {
  const normalizedSelectedSku = normalizeSku(selectedSku);

  if (!normalizedSelectedSku) {
    return [];
  }

  return positions.map((isActive, index) => {
    const isSelectedSku =
      normalizeSku(getRackItemForPosition(rack, index).sku) === normalizedSelectedSku;

    if (!isSelectedSku) {
      return null;
    }

    return isActive ? 'available' : 'missing';
  });
}

function countSkuPositionStates(
  inventory: RackInventory,
  rack: RackConfig,
  sku: string,
): { active: number; missing: number; total: number } {
  const indexes = getPositionIndexesForSku(rack, sku);
  const active = indexes.filter((index) => inventory[rack.id][index]).length;

  return {
    active,
    missing: indexes.length - active,
    total: indexes.length,
  };
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
  isPrecisionPicking: boolean;
  selectedSku: string;
  onInspect: (rackId: RackId | null) => void;
  onPullItem: (rackId: RackId) => void;
  onPullPosition: (rackId: RackId, positionIndex: number) => void;
}

function RackFootprint({
  rack,
  occupiedPositions,
  isInspecting,
  isPrecisionPicking,
  selectedSku,
  onInspect,
  onPullItem,
  onPullPosition,
}: RackFootprintProps) {
  const stock = countActivePositions(occupiedPositions);
  const positionHighlights = createPositionHighlights(occupiedPositions, rack, selectedSku);
  const positionDetails = createPositionDetails(rack);
  const randomPullLabel = `${rack.label}. ${rack.items.length} unique SKUs. RFID scanner active. Click to simulate removing one random item.`;
  const precisionPullLabel =
    rack.itemGrouping === 'triplet'
      ? `${rack.label}. Precision picking enabled. Click a SKU stack to remove one random item from that stack.`
      : `${rack.label}. Precision picking enabled. Click an exact item dot to remove that static position.`;

  return (
    <div
      aria-label={isPrecisionPicking ? precisionPullLabel : randomPullLabel}
      className={`absolute ${
        isInspecting ? 'z-50' : 'z-20'
      } flex items-center justify-center bg-transparent p-0 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35 ${
        isPrecisionPicking ? '' : 'cursor-pointer'
      } ${rack.mapClassName}`}
      role={isPrecisionPicking ? 'group' : 'button'}
      tabIndex={isPrecisionPicking ? undefined : 0}
      onClick={() => {
        if (!isPrecisionPicking) {
          onPullItem(rack.id);
        }
      }}
      onKeyDown={(event) => {
        if (isPrecisionPicking) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onPullItem(rack.id);
        }
      }}
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
            <HangingRackMerchandise
              occupiedPositions={occupiedPositions}
              onPickPosition={
                isPrecisionPicking
                  ? (positionIndex) => onPullPosition(rack.id, positionIndex)
                  : undefined
              }
              positionDetails={positionDetails}
              positionHighlights={positionHighlights}
            />
          ) : (
            <TieredDisplayMerchandise
              occupiedPositions={occupiedPositions}
              onPickStack={
                isPrecisionPicking
                  ? (firstPositionIndex) => onPullPosition(rack.id, firstPositionIndex)
                  : undefined
              }
              positionDetails={positionDetails}
              positionHighlights={positionHighlights}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface StoreMapProps {
  locatorQuery?: string;
  selectedLocatorSku?: string;
}

export function StoreMap({ locatorQuery = '', selectedLocatorSku = '' }: StoreMapProps) {
  const [inventory, setInventory] = useState<RackInventory>(initialInventory);
  const [backroomBoxes, setBackroomBoxes] = useState(createFullBackroomBoxes);
  const [inspectedRackId, setInspectedRackId] = useState<RackId | null>(null);
  const [isPrecisionPicking, setIsPrecisionPicking] = useState(false);
  const [lastAction, setLastAction] = useState(
    'Hover a rack name for metrics. Click a rack to pull one random item.',
  );

  const submittedSku = selectedLocatorSku.trim();
  const selectedItemMatch = findRackItemBySku(submittedSku);
  const locatorStatus = (() => {
    const pendingQuery = locatorQuery.trim();

    if (!submittedSku) {
      return pendingQuery
        ? `Press Enter to ping SKU "${pendingQuery}" on the map.`
        : 'Hover any blue item dot for its SKU. Type a SKU above and press Enter to ping it.';
    }

    if (!selectedItemMatch) {
      return `No SKU found for "${submittedSku}". Hover item dots to see valid SKU examples.`;
    }

    const skuPositions = countSkuPositionStates(
      inventory,
      selectedItemMatch.rack,
      selectedItemMatch.item.sku,
    );

    if (skuPositions.active === 0) {
      return `${selectedItemMatch.item.sku} exists on ${selectedItemMatch.rack.label}, but it is currently out of stock there. Red pulse marks its static home.`;
    }

    if (skuPositions.missing > 0) {
      return `Pinging ${selectedItemMatch.item.sku} · ${selectedItemMatch.item.name}: ${skuPositions.active}/${skuPositions.total} available in green, ${skuPositions.missing} missing in red.`;
    }

    return `Pinging ${selectedItemMatch.item.sku} · ${selectedItemMatch.item.name} on ${
      selectedItemMatch.rack.label
    } (${skuPositions.active}/${skuPositions.total} static position${
      skuPositions.total === 1 ? '' : 's'
    } pulsing green).`;
  })();

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
      const pulledItem = getRackItemForPosition(rack, randomActiveIndex);
      nextRackPositions[randomActiveIndex] = false;
      setLastAction(`Pulled ${pulledItem.sku} · ${pulledItem.name} from ${rack.label}.`);

      return { ...currentInventory, [rackId]: nextRackPositions };
    });
  };

  const pullPosition = (rackId: RackId, positionIndex: number) => {
    const rack = racks.find((candidate) => candidate.id === rackId);

    if (!rack) {
      return;
    }

    setInventory((currentInventory) => {
      const currentRackPositions = currentInventory[rackId];
      const positionItem = getRackItemForPosition(rack, positionIndex);
      const positionLabel = getRackPositionLabel(rack, positionIndex);
      const pulledPositionIndex =
        rack.itemGrouping === 'triplet'
          ? chooseDenseRackStackPickIndex(currentRackPositions, positionIndex)
          : currentRackPositions[positionIndex]
            ? positionIndex
            : null;

      if (pulledPositionIndex === null) {
        setLastAction(
          rack.itemGrouping === 'triplet'
            ? `${positionItem.sku} stack is already empty on ${rack.label} · ${positionLabel}.`
            : `${positionItem.sku} is already missing from ${rack.label} · ${positionLabel}.`,
        );
        return currentInventory;
      }

      const nextRackPositions = [...currentRackPositions];
      nextRackPositions[pulledPositionIndex] = false;
      setLastAction(
        rack.itemGrouping === 'triplet'
          ? `Precision picked one ${positionItem.sku} · ${positionItem.name} from ${rack.label} · ${positionLabel}.`
          : `Precision picked ${positionItem.sku} · ${positionItem.name} from ${rack.label} · ${positionLabel}.`,
      );

      return { ...currentInventory, [rackId]: nextRackPositions };
    });
  };

  const togglePrecisionPicking = () => {
    setIsPrecisionPicking((currentMode) => {
      const nextMode = !currentMode;
      setLastAction(
        nextMode
          ? 'Precision picking enabled. Click Rack A dots or Rack B SKU stacks to pull one item.'
          : 'Precision picking disabled. Rack clicks now pull a random item again.',
      );
      return nextMode;
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
          {isPrecisionPicking
            ? 'Precision picking is on. Click Rack A dots or Rack B SKU stacks to remove merchandise.'
            : 'Hover only the rack name to open metrics. Click anywhere on a rack to simulate removing merchandise.'}
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
                isPrecisionPicking={isPrecisionPicking}
                selectedSku={submittedSku}
                onInspect={setInspectedRackId}
                onPullItem={pullItem}
                onPullPosition={pullPosition}
              />
            ))}
          </div>
        </div>

        <StoreMapSidebar
          isPrecisionPicking={isPrecisionPicking}
          lastAction={lastAction}
          locatorStatus={locatorStatus}
          onPrecisionPickingToggle={togglePrecisionPicking}
          onReplenish={replenish}
          onResetDemo={resetDemo}
        />
      </div>
    </section>
  );
}
