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
  | 'worker-box-pause'
  | 'worker-grab-box'
  | 'worker-pick-box'
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
  // Glow starts only once the worker has paused just inside the backroom --
  // not during the initial approach/entry walk, per Ian's requested beat --
  // and stays lit through the walk-up and the pick gesture until grabbed.
  return ['worker-box-pause', 'worker-grab-box', 'worker-pick-box'].includes(phase);
}

/**
 * CSS class for the "Backroom storage / Replenishment reserve" label.
 *
 * Every prior round tuned keyframe %s against the leg that crosses the
 * label's height (worker-to-box's leg 2, worker-from-box's leg 3) and kept
 * failing. The leg boundary was never the real constraint -- see the
 * geometry breakdown in index.css's showcase-label-fade-during-entry /
 * -exit keyframes. Two real numbers matter instead:
 *
 * 1. The corridor walk height (53%) sits only ~10px of real clearance from
 *    the label's top edge once you account for the worker sprite's own
 *    footprint -- and the icon's 18px glow blur is bigger than that gap. So
 *    the glow can visually reach the label for all of leg 1, not just the
 *    crossing leg. Fix: fade out almost immediately in worker-to-box
 *    instead of holding full opacity for the first third of the phase.
 * 2. worker-paused holds the worker at x=50% -- the SAME x as the label
 *    (dead center). "Passed back over where the text is" requires
 *    horizontal clearance, which worker-paused never provides (it's a
 *    static hold). The worker doesn't move away from that x-column until
 *    worker-guided. Fix: fade-in now happens during worker-guided, timed to
 *    the point the worker actually clears the label's x-span, not during
 *    worker-paused.
 *
 * Phase map:
 * - worker-to-box (4.5s): fades out almost immediately, done by 45% -- a
 *   real 30pp buffer before leg 2 (75%) even starts, covering the tight
 *   corridor-to-label gap for nearly the whole walk-in, not just the tail.
 * - worker-box-pause / worker-grab-box / worker-pick-box / worker-from-box
 *   / worker-paused: flat hidden, no animation. Covers the whole time the
 *   worker is in the backroom, the entire retrace (including leg 3's rise
 *   back through the gap), AND the static pause afterward -- because that
 *   pause still sits directly under the label's x-column.
 * - worker-guided (3.0s): this is the phase that actually walks the worker
 *   OUT from under the label (x=50% -> x=39%). Fade-in holds at 0 until the
 *   worker has cleared the label's x-span with a real buffer, then fades
 *   in, finishing right as the phase ends.
 * - everything else: fully visible.
 */
export function getShowcaseBackroomLabelClassName(phase: ShowcasePhase): string {
  if (phase === 'worker-to-box') {
    return 'animate-showcase-label-fade-entry';
  }

  if (
    phase === 'worker-box-pause' ||
    phase === 'worker-grab-box' ||
    phase === 'worker-pick-box' ||
    phase === 'worker-from-box' ||
    phase === 'worker-paused'
  ) {
    return 'opacity-0';
  }

  if (phase === 'worker-guided') {
    return 'animate-showcase-label-fade-exit';
  }

  return 'opacity-100';
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
  // worker-to-box: 4.5s, 2-leg entry -- walk the corridor to the entrance gap,
  // then straight down through the gap into the backroom. No glow yet. Ends 28,200ms.
  { delayMs: 28_200, phase: 'worker-box-pause' },
  // worker-box-pause: 1.0s static hold just inside the backroom -- this is
  // the beat where the target box STARTS glowing. Ends 29,200ms.
  { delayMs: 29_200, phase: 'worker-grab-box' },
  // worker-grab-box: 3.0s, 2-leg axis-aligned walk -- shift into the aisle,
  // then walk the aisle down to stand level with box 14. Ends 32,200ms.
  { delayMs: 32_200, phase: 'worker-pick-box' },
  // worker-pick-box: 1.3s pick gesture (same timing as showcase-shopper-pick,
  // just horizontal) -- quick reach toward the box and back. Grab happens
  // near the reach's peak, same relative offset as the shopper's pick-item
  // action (600ms into its own 1.3s pick).
  { delayMs: 32_800, phase: 'worker-pick-box', action: 'grab-box' },
  // worker-pick-box ends 33,500ms; +400ms beat, then retrace the same legs back out.
  { delayMs: 33_900, phase: 'worker-from-box' },
  // worker-from-box: 4.0s retrace, ends 37,900ms; +300ms beat, then a 1s hold
  // just outside the backroom -- this is where tap-to-light starts pulsing.
  { delayMs: 38_200, phase: 'worker-paused' },
  // worker-paused: 1.0s hold, ends 39,200ms, then walk straight to Rack A.
  { delayMs: 39_200, phase: 'worker-guided', action: 'guide-worker' },
  // worker-guided: 3.0s walk from the entrance (50%,53%) to Rack A (27%,48%).
  { delayMs: 42_200, phase: 'worker-restock', action: 'arrive-at-rack' },
  // Restock nudge: 1.3s. Item reappears at nudge peak (35% × 1.3s = 455ms in).
  { delayMs: 42_655, phase: 'worker-restock', action: 'complete-restock' },
  // +400ms beat after nudge completes (nudge done at 43,500ms), then worker exits.
  { delayMs: 43_900, phase: 'worker-exit' },
  // worker-exit: 2.5s walk off right edge, same corridor height as the entry.
  { delayMs: 46_400, phase: 'idle' },
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
  { label: 'Worker pauses (box glows)', phase: 'worker-box-pause', itemMissing: true },
  { label: 'Worker walks to box', phase: 'worker-grab-box', itemMissing: true },
  { label: 'Worker picks box', phase: 'worker-pick-box', itemMissing: true },
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
    'worker-box-pause',
    'worker-grab-box',
    'worker-pick-box',
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
