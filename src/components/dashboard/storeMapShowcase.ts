import type { RackId } from './storeMapCatalog';

export type ShowcasePhase =
  | 'idle'
  | 'shopper-to-rack'
  | 'shopper-pick'
  | 'shopper-exit'
  | 'rfid-scan'
  | 'rfid-detect'
  | 'task-alert'
  | 'worker-to-box'
  | 'worker-guided'
  | 'worker-restock'
  | 'worker-exit';

export const showcaseRackId: RackId = 'rack-a';
export const showcaseRackAItemPosition = 15;

/**
 * Global box index for the tap-to-light target in the backroom.
 * With 6 boxes/column (2 wide x 3 tall): column 1 (2nd from left),
 * middle row, left box → local index 2, global index 8.
 */
export const showcaseBackroomGlowBoxIndex = 8;

export function shouldShowcaseGlowBackroomBox(phase: ShowcasePhase): boolean {
  return phase === 'worker-to-box';
}

export type ShowcaseAction =
  | 'pick-item'
  | 'scan-rack'
  | 'assign-task'
  | 'dispatch-worker'
  | 'guide-worker'
  | 'arrive-at-rack'
  | 'complete-restock';

interface ShowcaseTimelineStep {
  action?: ShowcaseAction;
  delayMs: number;
  phase: ShowcasePhase;
}

export const showcaseTimeline: ShowcaseTimelineStep[] = [
  { delayMs: 2_500,  phase: 'shopper-pick' },
  { delayMs: 3_100,  phase: 'shopper-pick',    action: 'pick-item' },
  { delayMs: 4_000,  phase: 'shopper-exit',    action: 'scan-rack' },
  { delayMs: 7_000,  phase: 'rfid-scan' },
  { delayMs: 9_500,  phase: 'rfid-detect' },
  { delayMs: 12_000, phase: 'task-alert',      action: 'assign-task' },
  // Phone owns the ending beat: TTL press + slide-down, fully gone ~25,250ms.
  // Worker enters at 26,000ms (small beat after phone clears).
  { delayMs: 26_000, phase: 'worker-to-box',   action: 'dispatch-worker' },
  // worker-to-box: 8.5s (4-leg path: corridor → down → left → down to box 12 + L/R nudge)
  // Animation ends 34,500ms; +400ms beat before guided walk.
  { delayMs: 34_900, phase: 'worker-guided',   action: 'guide-worker' },
  // worker-guided: 3.0s walk from box-12 (32%,84%) to Rack A (27%,48%).
  { delayMs: 37_900, phase: 'worker-restock',  action: 'arrive-at-rack' },
  // Restock nudge: 1.3s. Item reappears at nudge peak (35% × 1.3s = 455ms in).
  { delayMs: 38_355, phase: 'worker-restock',  action: 'complete-restock' },
  // +400ms beat after nudge completes (nudge done at 39,200ms), then worker exits.
  { delayMs: 39_600, phase: 'worker-exit' },
  // worker-exit: 2.5s walk off right edge.
  { delayMs: 42_100, phase: 'idle' },
];

export interface ShowcaseCheckpoint {
  label: string;
  phase: ShowcasePhase;
  /** true when the showcase item should appear missing at this phase's start */
  itemMissing: boolean;
}

/**
 * Ordered list of named jump points for the dev panel.
 * Add new entries here as the sequence grows — the sidebar picks them up automatically.
 */
export const showcaseCheckpoints: ShowcaseCheckpoint[] = [
  { label: 'Shopper enters', phase: 'shopper-to-rack', itemMissing: false },
  { label: 'Shopper picks',  phase: 'shopper-pick',    itemMissing: false },
  { label: 'Shopper exits',  phase: 'shopper-exit',    itemMissing: true  },
  { label: 'RFID scan',      phase: 'rfid-scan',       itemMissing: true  },
  { label: 'Phone popup',    phase: 'task-alert',      itemMissing: true  },
  { label: 'Worker enters',  phase: 'worker-to-box',   itemMissing: true  },
  { label: 'Worker at rack', phase: 'worker-restock',  itemMissing: false },
];

export function isShowcaseRunning(phase: ShowcasePhase): boolean {
  return phase !== 'idle';
}

export function shouldShowcaseHighlightMissingItem(phase: ShowcasePhase): boolean {
  return ['rfid-detect', 'task-alert', 'worker-to-box', 'worker-guided', 'worker-restock'].includes(
    phase,
  );
}

export function shouldShowcaseScanRack(phase: ShowcasePhase, rackId: RackId): boolean {
  return rackId === showcaseRackId && ['rfid-scan', 'rfid-detect'].includes(phase);
}

export function shouldShowcaseTapToLight(phase: ShowcasePhase, rackId: RackId): boolean {
  return rackId === showcaseRackId && ['worker-guided', 'worker-restock'].includes(phase);
}
