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
  | 'worker-restock';

export const showcaseRackId: RackId = 'rack-a';
export const showcaseRackAItemPosition = 15;

/**
 * Global box index for the tap-to-light target in the backroom.
 * Column 1 (2nd from left), row 2 (3rd from top), left box → local index 4, global index 12.
 */
export const showcaseBackroomGlowBoxIndex = 12;

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
  { delayMs: 2_500, phase: 'shopper-pick' },
  { delayMs: 3_100, phase: 'shopper-pick', action: 'pick-item' },
  { delayMs: 4_000, phase: 'shopper-exit', action: 'scan-rack' },
  { delayMs: 7_000, phase: 'rfid-scan' },
  { delayMs: 9_500, phase: 'rfid-detect' },
  { delayMs: 12_000, phase: 'task-alert', action: 'assign-task' },
  // Phone owns the ending beat: press Tap-to-Light, slide down (fully gone ~25,250ms).
  // Generous margin so the phase flip can never cut the exit animation short.
  { delayMs: 26_500, phase: 'idle' },
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
