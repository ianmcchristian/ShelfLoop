import type { RackId } from './storeMapCatalog';

export type ShowcasePhase =
  | 'idle'
  | 'shopper-to-rack'
  | 'shopper-pick'
  | 'shopper-exit'
  | 'rfid-scan'
  | 'task-alert'
  | 'worker-to-box'
  | 'worker-guided'
  | 'worker-restock';

export const showcaseRackId: RackId = 'rack-a';
export const showcaseRackAItemPosition = 5;

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
  { delayMs: 1_200, phase: 'shopper-pick' },
  { delayMs: 1_650, phase: 'shopper-exit', action: 'pick-item' },
  { delayMs: 2_650, phase: 'rfid-scan', action: 'scan-rack' },
  { delayMs: 4_000, phase: 'task-alert', action: 'assign-task' },
  { delayMs: 6_500, phase: 'worker-to-box', action: 'dispatch-worker' },
  { delayMs: 7_800, phase: 'worker-guided', action: 'guide-worker' },
  { delayMs: 10_000, phase: 'worker-restock', action: 'arrive-at-rack' },
  { delayMs: 10_900, phase: 'idle', action: 'complete-restock' },
];

export function isShowcaseRunning(phase: ShowcasePhase): boolean {
  return phase !== 'idle';
}

export function shouldShowcaseHighlightMissingItem(phase: ShowcasePhase): boolean {
  return ['rfid-scan', 'task-alert', 'worker-to-box', 'worker-guided', 'worker-restock'].includes(
    phase,
  );
}

export function shouldShowcaseScanRack(phase: ShowcasePhase, rackId: RackId): boolean {
  return rackId === showcaseRackId && phase === 'rfid-scan';
}

export function shouldShowcaseTapToLight(phase: ShowcasePhase, rackId: RackId): boolean {
  return rackId === showcaseRackId && ['worker-guided', 'worker-restock'].includes(phase);
}
