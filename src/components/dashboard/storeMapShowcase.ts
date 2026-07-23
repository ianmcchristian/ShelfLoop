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
  | 'worker-from-box'
  | 'worker-paused'
  | 'worker-guided'
  | 'worker-restock'
  | 'worker-exit';

export const showcaseRackId: RackId = 'rack-a';
export const showcaseRackAItemPosition = 15;

/**
 * Global box index for the tap-to-light target in the backroom.
 * With 6 boxes/column (2 wide x 3 tall): column 2 (the true visual middle
 * of the 5 storage columns, centered under the entrance gap), middle row,
 * left box → local index 2, global index 14 (2 * 6 + 2).
 */
export const showcaseBackroomGlowBoxIndex = 14;

export function shouldShowcaseGlowBackroomBox(phase: ShowcasePhase): boolean {
  return phase === 'worker-to-box';
}

export type ShowcaseAction =
  | 'pick-item'
  | 'scan-rack'
  | 'assign-task'
  | 'dispatch-worker'
  | 'grab-box'
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
  // Phone slides off-screen by ~23,250ms (TTL press then slide-down).
  // Worker enters at 23,700ms -- tight handoff right after the phone clears.
  { delayMs: 23_700, phase: 'worker-to-box', action: 'dispatch-worker' },
  // worker-to-box: 8.5s, 5-leg path -- enter above the line, down through the
  // entrance gap, shift into the aisle, walk the aisle down, reach into box 14.
  // Grab happens at the reach-in beat (92% × 8.5s = 7,820ms in).
  { delayMs: 31_520, phase: 'worker-to-box', action: 'grab-box' },
  // worker-to-box ends 32,200ms; +400ms beat, then retrace the same 4 legs back out.
  { delayMs: 32_600, phase: 'worker-from-box' },
  // worker-from-box: 4.5s retrace, ends 37,100ms; +300ms beat, then a 1s hold
  // just outside the backroom -- this is where tap-to-light starts pulsing.
  { delayMs: 37_400, phase: 'worker-paused' },
  // worker-paused: 1.0s hold, ends 38,400ms, then walk straight to Rack A.
  { delayMs: 38_400, phase: 'worker-guided', action: 'guide-worker' },
  // worker-guided: 3.0s walk from the entrance (50%,59%) to Rack A (27%,48%).
  { delayMs: 41_400, phase: 'worker-restock', action: 'arrive-at-rack' },
  // Restock nudge: 1.3s. Item reappears at nudge peak (35% × 1.3s = 455ms in).
  { delayMs: 41_855, phase: 'worker-restock', action: 'complete-restock' },
  // +400ms beat after nudge completes (nudge done at 42,700ms), then worker exits.
  { delayMs: 43_100, phase: 'worker-exit' },
  // worker-exit: 2.5s walk off right edge, same corridor height as the entry.
  { delayMs: 45_600, phase: 'idle' },
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
  { label: 'Shopper picks', phase: 'shopper-pick', itemMissing: false },
  { label: 'Shopper exits', phase: 'shopper-exit', itemMissing: true },
  { label: 'RFID scan', phase: 'rfid-scan', itemMissing: true },
  { label: 'Phone popup', phase: 'task-alert', itemMissing: true },
  { label: 'Worker enters', phase: 'worker-to-box', itemMissing: true },
  { label: 'Worker retraces', phase: 'worker-from-box', itemMissing: true },
  { label: 'Worker paused', phase: 'worker-paused', itemMissing: true },
  { label: 'Worker at rack', phase: 'worker-restock', itemMissing: false },
];

/** Phases from the moment the box is grabbed onward -- the backroom box stays consumed. */
export const showcasePhasesAfterBoxGrab: ShowcasePhase[] = [
  'worker-from-box',
  'worker-paused',
  'worker-guided',
  'worker-restock',
  'worker-exit',
];

export function isShowcaseRunning(phase: ShowcasePhase): boolean {
  return phase !== 'idle';
}

export function shouldShowcaseHighlightMissingItem(phase: ShowcasePhase): boolean {
  return [
    'rfid-detect',
    'task-alert',
    'worker-to-box',
    'worker-from-box',
    'worker-paused',
    'worker-guided',
    'worker-restock',
  ].includes(phase);
}

export function shouldShowcaseScanRack(phase: ShowcasePhase, rackId: RackId): boolean {
  return rackId === showcaseRackId && ['rfid-scan', 'rfid-detect'].includes(phase);
}

export function shouldShowcaseTapToLight(phase: ShowcasePhase, rackId: RackId): boolean {
  return (
    rackId === showcaseRackId &&
    ['worker-paused', 'worker-guided', 'worker-restock'].includes(phase)
  );
}
