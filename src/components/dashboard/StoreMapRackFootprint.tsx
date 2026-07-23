import {
  HangingRackMerchandise,
  TieredDisplayMerchandise,
  type MerchandiseDotDetails,
  type MerchandisePositionHighlight,
} from './StoreMapFixtures';
import { RfidScannerIcon } from './StoreMapLegend';
import {
  getRackItemForPosition,
  getRackPositionLabel,
  normalizeSku,
  type RackConfig,
  type RackId,
} from './storeMapCatalog';

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

function RfidSignalGlow({
  capacity,
  isShowcaseScanning,
  stock,
}: {
  capacity: number;
  isShowcaseScanning: boolean;
  stock: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute left-1/2 top-[60%] z-0 h-[56%] w-[94%] -translate-x-1/2 -translate-y-1/2 rounded-[999px] blur-2xl transition ${
        isShowcaseScanning ? 'animate-showcase-rfid-scan' : ''
      } ${rfidSignalTone(stock, capacity)}`}
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
  isShowcaseInteractionLocked: boolean;
  isShowcaseScanning: boolean;
  positionHighlightsOverride?: (MerchandisePositionHighlight | null)[];
  selectedSku: string;
  onInspect: (rackId: RackId | null) => void;
  onPullItem: (rackId: RackId) => void;
  onPullPosition: (rackId: RackId, positionIndex: number) => void;
}

export function RackFootprint({
  rack,
  occupiedPositions,
  isInspecting,
  isPrecisionPicking,
  isShowcaseInteractionLocked,
  isShowcaseScanning,
  positionHighlightsOverride,
  selectedSku,
  onInspect,
  onPullItem,
  onPullPosition,
}: RackFootprintProps) {
  const stock = countActivePositions(occupiedPositions);
  const positionHighlights =
    positionHighlightsOverride ?? createPositionHighlights(occupiedPositions, rack, selectedSku);
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
        isPrecisionPicking || isShowcaseInteractionLocked ? '' : 'cursor-pointer'
      } ${isShowcaseInteractionLocked ? 'pointer-events-none' : ''} ${rack.mapClassName}`}
      role={isPrecisionPicking || isShowcaseInteractionLocked ? 'group' : 'button'}
      tabIndex={isPrecisionPicking || isShowcaseInteractionLocked ? undefined : 0}
      onClick={() => {
        if (!isPrecisionPicking && !isShowcaseInteractionLocked) {
          onPullItem(rack.id);
        }
      }}
      onKeyDown={(event) => {
        if (isPrecisionPicking || isShowcaseInteractionLocked) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onPullItem(rack.id);
        }
      }}
    >
      <RfidSignalGlow
        capacity={rack.capacity}
        isShowcaseScanning={isShowcaseScanning}
        stock={stock}
      />

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
