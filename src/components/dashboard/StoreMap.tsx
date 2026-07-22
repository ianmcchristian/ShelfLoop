import { useEffect, useRef, useState } from 'react';

import {
  BackstockRoom,
  backroomBoxCount,
} from './StoreMapFixtures';
import type { MerchandisePositionHighlight } from './StoreMapMerchandise';
import { RfidLegend } from './StoreMapLegend';
import { RackFootprint } from './StoreMapRackFootprint';
import { StoreMapShowcaseLayer } from './StoreMapShowcaseLayer';
import { StoreMapSidebar } from './StoreMapSidebar';
import {
  chooseDenseRackStackPickIndex,
  chooseRandomActiveIndex,
} from './storeMapPicking';
import {
  isShowcaseRunning,
  showcaseBackroomGlowBoxIndex,
  showcaseCheckpoints,
  showcaseRackAItemPosition,
  showcaseRackId,
  showcaseTimeline,
  shouldShowcaseGlowBackroomBox,
  shouldShowcaseHighlightMissingItem,
  shouldShowcaseScanRack,
  shouldShowcaseTapToLight,
  type ShowcaseAction,
  type ShowcaseCheckpoint,
  type ShowcasePhase,
} from './storeMapShowcase';
import {
  findRackItemBySku,
  getPositionIndexesForSku,
  getRackItemForPosition,
  getRackPositionLabel,
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

function createShowcasePositionHighlights(
  rack: RackConfig,
  phase: ShowcasePhase,
): (MerchandisePositionHighlight | null)[] | undefined {
  if (rack.id !== showcaseRackId || !shouldShowcaseHighlightMissingItem(phase)) {
    return undefined;
  }

  const highlights = Array.from(
    { length: rack.capacity },
    (): MerchandisePositionHighlight | null => null,
  );
  highlights[showcaseRackAItemPosition] = 'missing';

  return highlights;
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
  const [showcasePhase, setShowcasePhase] = useState<ShowcasePhase>('idle');
  const [showcaseJumpKey, setShowcaseJumpKey] = useState(0);
  const [isShowcasePaused, setIsShowcasePaused] = useState(false);
  const showcaseTimersRef = useRef<number[]>([]);
  const showcaseStartedAtMsRef = useRef<number | null>(null);
  const showcaseElapsedMsRef = useRef(0);
  const isShowcaseActive = isShowcaseRunning(showcasePhase);
  const showcaseRack = racks.find((rack) => rack.id === showcaseRackId) ?? racks[0]!;
  const showcaseItem = getRackItemForPosition(showcaseRack, showcaseRackAItemPosition);

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

  useEffect(() => {
    return () => {
      showcaseTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      showcaseTimersRef.current = [];
    };
  }, []);

  const clearShowcaseTimers = () => {
    showcaseTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    showcaseTimersRef.current = [];
  };

  const scheduleShowcaseTimelineFrom = (elapsedMs: number) => {
    clearShowcaseTimers();
    showcaseElapsedMsRef.current = elapsedMs;
    // eslint-disable-next-line react-hooks/purity -- called only from event handlers, not render
    showcaseStartedAtMsRef.current = performance.now() - elapsedMs;

    const remainingSteps = showcaseTimeline.filter(({ delayMs }) => delayMs > elapsedMs);

    showcaseTimersRef.current = remainingSteps.map(({ action, delayMs, phase }) =>
      window.setTimeout(() => {
        setShowcasePhase(phase);

        if (action) {
          runShowcaseAction(action);
        }

        if (phase === 'idle') {
          setIsShowcasePaused(false);
          showcaseStartedAtMsRef.current = null;
          showcaseElapsedMsRef.current = 0;
        }
      }, delayMs - elapsedMs),
    );
  };

  const consumeBackroomBox = () => {
    setBackroomBoxes((currentBoxes) => {
      const consumedBoxIndex = chooseRandomActiveIndex(currentBoxes);

      if (consumedBoxIndex === null) {
        return currentBoxes;
      }

      return currentBoxes.map((isActive, index) => (index === consumedBoxIndex ? false : isActive));
    });
  };

  const runShowcaseAction = (action: ShowcaseAction) => {
    if (action === 'pick-item') {
      setInventory((currentInventory) => {
        const nextRackPositions = [...currentInventory[showcaseRackId]];
        nextRackPositions[showcaseRackAItemPosition] = false;
        return { ...currentInventory, [showcaseRackId]: nextRackPositions };
      });
      setLastAction(`Showcase A: shopper picked ${showcaseItem.sku} from Rack A.`);
      return;
    }

    if (action === 'scan-rack') {
      setLastAction('Showcase A: Rack A RFID scan detected a missing tagged item.');
      return;
    }

    if (action === 'assign-task') {
      setLastAction('Showcase A: replenishment task assigned to the worker phone.');
      return;
    }

    if (action === 'dispatch-worker') {
      setLastAction('Showcase A: worker accepted the task and moved to backroom storage.');
      return;
    }

    if (action === 'guide-worker') {
      setLastAction('Showcase A: worker is following ShelfLoop guidance back to Rack A.');
      return;
    }

    if (action === 'arrive-at-rack') {
      setLastAction('Showcase A: Rack A tap-to-light is flashing the restock location.');
      return;
    }

    setInventory((currentInventory) => {
      const nextRackPositions = [...currentInventory[showcaseRackId]];
      nextRackPositions[showcaseRackAItemPosition] = true;
      return { ...currentInventory, [showcaseRackId]: nextRackPositions };
    });
    consumeBackroomBox();
    setLastAction(`Showcase A complete. ${showcaseItem.sku} restocked; one reserve box consumed.`);
  };

  const cancelShowcase = () => {
    clearShowcaseTimers();
    showcaseStartedAtMsRef.current = null;
    showcaseElapsedMsRef.current = 0;
    setIsShowcasePaused(false);
    setShowcasePhase('idle');
    setLastAction('Showcase A cancelled. Map interactions restored.');
  };

  const startShowcase = () => {
    clearShowcaseTimers();
    showcaseElapsedMsRef.current = 0;
    showcaseStartedAtMsRef.current = performance.now();
    setIsShowcasePaused(false);
    setInspectedRackId(null);
    setIsPrecisionPicking(false);
    setShowcaseJumpKey((k) => k + 1);
    setShowcasePhase('shopper-to-rack');
    setLastAction('Showcase A started: shopper approaching Rack A.');
    setInventory((currentInventory) => {
      const nextRackPositions = [...currentInventory[showcaseRackId]];
      nextRackPositions[showcaseRackAItemPosition] = true;
      return { ...currentInventory, [showcaseRackId]: nextRackPositions };
    });
    setBackroomBoxes((currentBoxes) =>
      currentBoxes.some(Boolean) ? currentBoxes : createFullBackroomBoxes(),
    );

    scheduleShowcaseTimelineFrom(0);
  };

  const jumpToCheckpoint = (checkpoint: ShowcaseCheckpoint) => {
    clearShowcaseTimers();
    setInspectedRackId(null);
    setIsPrecisionPicking(false);

    // Restore backroom if depleted so later phases have boxes to consume
    setBackroomBoxes((current) => (current.some(Boolean) ? current : createFullBackroomBoxes()));

    // Set item presence to match what this phase expects
    setInventory((current) => {
      const nextPositions = [...current[showcaseRackId]];
      nextPositions[showcaseRackAItemPosition] = !checkpoint.itemMissing;
      return { ...current, [showcaseRackId]: nextPositions };
    });

    setIsShowcasePaused(false);
    setShowcasePhase(checkpoint.phase);
    setShowcaseJumpKey((k) => k + 1); // forces StoreMapShowcaseLayer to remount on every jump
    setLastAction(`Dev: jumped to "${checkpoint.label}"`);

    // Continue the rest of the timeline relative to this checkpoint.
    const phaseMs = showcaseTimeline.find((s) => s.phase === checkpoint.phase)?.delayMs ?? 0;
    scheduleShowcaseTimelineFrom(phaseMs);
  };

  const toggleShowcase = () => {
    if (isShowcaseActive) {
      cancelShowcase();
      return;
    }

    startShowcase();
  };

  const toggleShowcasePlayback = () => {
    if (!isShowcaseActive) {
      return;
    }

    if (isShowcasePaused) {
      setIsShowcasePaused(false);
      setLastAction('Showcase A resumed.');
      scheduleShowcaseTimelineFrom(showcaseElapsedMsRef.current);
      return;
    }

    if (showcaseStartedAtMsRef.current !== null) {
      showcaseElapsedMsRef.current = performance.now() - showcaseStartedAtMsRef.current;
    }

    clearShowcaseTimers();
    setIsShowcasePaused(true);
    setLastAction('Showcase A paused.');
  };

  const pullItem = (rackId: RackId) => {
    if (isShowcaseActive) {
      return;
    }

    const rack = racks.find((candidate) => candidate.id === rackId);

    if (!rack) {
      return;
    }

    setInventory((currentInventory) => {
      const randomActiveIndex = chooseRandomActiveIndex(currentInventory[rackId]);

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
    if (isShowcaseActive) {
      return;
    }

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
    if (isShowcaseActive) {
      return;
    }

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
    if (isShowcaseActive) {
      return;
    }

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
    if (isShowcaseActive) {
      return;
    }

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
          {isShowcaseActive
            ? isShowcasePaused
              ? 'Showcase A is paused. Resume from DEV tools or cancel to restore normal map interactions.'
              : 'Showcase A is running. Map interactions are paused while the automated flow plays.'
            : isPrecisionPicking
              ? 'Precision picking is on. Click Rack A dots or Rack B SKU stacks to remove merchandise.'
              : 'Hover only the rack name to open metrics. Click anywhere on a rack to simulate removing merchandise.'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="panel p-4">
          <div className="relative min-h-[900px] overflow-hidden border border-slate-300 bg-[#f7f8fa]">
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

            <BackstockRoom
              occupiedBoxes={backroomBoxes}
              glowBoxIndex={
                shouldShowcaseGlowBackroomBox(showcasePhase)
                  ? showcaseBackroomGlowBoxIndex
                  : undefined
              }
            />

            {racks.map((rack) => (
              <RackFootprint
                key={rack.id}
                rack={rack}
                occupiedPositions={inventory[rack.id]}
                isInspecting={inspectedRackId === rack.id}
                isPrecisionPicking={isPrecisionPicking}
                isShowcaseInteractionLocked={isShowcaseActive}
                isShowcaseScanning={shouldShowcaseScanRack(showcasePhase, rack.id)}
                isTapToLightActive={shouldShowcaseTapToLight(showcasePhase, rack.id)}
                positionHighlightsOverride={createShowcasePositionHighlights(rack, showcasePhase)}
                selectedSku={submittedSku}
                onInspect={setInspectedRackId}
                onPullItem={pullItem}
                onPullPosition={pullPosition}
              />
            ))}

            <StoreMapShowcaseLayer
              key={showcaseJumpKey}
              isPaused={isShowcasePaused}
              phase={showcasePhase}
              targetItemName={showcaseItem.name}
              targetSku={showcaseItem.sku}
            />
          </div>
        </div>

        <StoreMapSidebar
          devCheckpoints={showcaseCheckpoints}
          isPrecisionPicking={isPrecisionPicking}
          isShowcasePaused={isShowcasePaused}
          isShowcaseRunning={isShowcaseActive}
          lastAction={lastAction}
          locatorStatus={locatorStatus}
          onJumpToCheckpoint={jumpToCheckpoint}
          onPrecisionPickingToggle={togglePrecisionPicking}
          onReplenish={replenish}
          onResetDemo={resetDemo}
          onShowcasePlaybackToggle={toggleShowcasePlayback}
          onShowcaseToggle={toggleShowcase}
        />
      </div>
    </section>
  );
}
