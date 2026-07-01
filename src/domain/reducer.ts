import { createInitialState } from '../data/demoData';
import type {
  Fixture,
  ReplenishmentTask,
  RfidTag,
  ShelfEvent,
  ShelfLoopAction,
  ShelfLoopState,
} from './types';

const MAX_EVENTS = 20;

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function appendEvents(state: ShelfLoopState, events: ShelfEvent[]): ShelfLoopState {
  return {
    ...state,
    events: [...events, ...state.events].slice(0, MAX_EVENTS),
    lastUpdatedAt: events[0]?.timestamp ?? state.lastUpdatedAt,
  };
}

function createEvent(
  input: Omit<ShelfEvent, 'id' | 'timestamp'>,
  timestamp = nowIso(),
): ShelfEvent {
  return {
    ...input,
    id: makeId(input.kind),
    timestamp,
  };
}

function moveTags(
  tags: RfidTag[],
  sku: string,
  fromLocationId: string,
  toLocationId: string | 'sold' | 'unknown',
  quantity: number,
): RfidTag[] {
  let remaining = quantity;

  return tags.map((tag) => {
    if (remaining > 0 && tag.sku === sku && tag.currentLocationId === fromLocationId) {
      remaining -= 1;
      return { ...tag, currentLocationId: toLocationId };
    }

    return tag;
  });
}

function scanFixture(state: ShelfLoopState, fixture: Fixture, timestamp: string): ShelfEvent {
  const presentTags = state.tags.filter((tag) => tag.currentLocationId === fixture.id);
  const readRate =
    state.settings.mode === 'clean'
      ? fixture.readProfile.cleanReadRate
      : fixture.readProfile.realisticReadRate;
  const detectedTags = presentTags.filter(() => Math.random() <= readRate);
  const detectedIds = new Set(detectedTags.map((tag) => tag.id));
  const missedTags = presentTags.filter((tag) => !detectedIds.has(tag.id));
  const confidence = presentTags.length === 0 ? readRate : detectedTags.length / presentTags.length;

  return createEvent(
    {
      kind: 'scan',
      title: `${fixture.name} scan complete`,
      fixtureId: fixture.id,
      detectedTagIds: detectedTags.map((tag) => tag.id),
      missedTagIds: missedTags.map((tag) => tag.id),
      confidence,
      notes: [
        `${detectedTags.length}/${presentTags.length} present tags detected`,
        fixture.readProfile.fieldNote,
      ],
    },
    timestamp,
  );
}

function getDetectedCountByFixtureSku(
  state: ShelfLoopState,
  events: ShelfEvent[],
): Map<string, number> {
  const tagById = new Map(state.tags.map((tag) => [tag.id, tag]));
  const counts = new Map<string, number>();

  for (const event of events) {
    if (!event.fixtureId || !event.detectedTagIds) {
      continue;
    }

    for (const tagId of event.detectedTagIds) {
      const tag = tagById.get(tagId);
      if (!tag) {
        continue;
      }

      const key = `${event.fixtureId}:${tag.sku}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return counts;
}

function getDetectedBackroomTags(
  state: ShelfLoopState,
  events: ShelfEvent[],
  sku: string,
): RfidTag[] {
  const backroomFixtureIds = new Set(
    state.fixtures.filter((fixture) => fixture.zone === 'backroom').map((fixture) => fixture.id),
  );
  const detectedIds = new Set(
    events
      .filter((event) => event.fixtureId && backroomFixtureIds.has(event.fixtureId))
      .flatMap((event) => event.detectedTagIds ?? []),
  );

  return state.tags.filter((tag) => detectedIds.has(tag.id) && tag.sku === sku);
}

function hasOpenTask(state: ShelfLoopState, sku: string, fixtureId: string): boolean {
  return state.tasks.some(
    (task) =>
      task.sku === sku && task.destinationFixtureId === fixtureId && task.status !== 'completed',
  );
}

function hasOutOfStockAlert(state: ShelfLoopState, sku: string, fixtureId: string): boolean {
  return state.outOfStockAlerts.some((alert) => alert.sku === sku && alert.fixtureId === fixtureId);
}

function reconcileInventory(
  state: ShelfLoopState,
  scanEvents: ShelfEvent[],
  timestamp: string,
): ShelfLoopState {
  const detectedCounts = getDetectedCountByFixtureSku(state, scanEvents);
  const generatedEvents: ShelfEvent[] = [];
  const nextConfirmations = { ...state.missingConfirmations };
  const nextTasks: ReplenishmentTask[] = [...state.tasks];
  const nextAlerts = [...state.outOfStockAlerts];

  for (const rule of state.inventoryRules) {
    const detectedQuantity = detectedCounts.get(`${rule.fixtureId}:${rule.sku}`) ?? 0;
    const missingQuantity = Math.max(rule.targetQuantity - detectedQuantity, 0);

    if (missingQuantity < rule.replenishWhenMissingAtLeast) {
      nextConfirmations[rule.id] = 0;
      continue;
    }

    const confirmations = (nextConfirmations[rule.id] ?? 0) + 1;
    nextConfirmations[rule.id] = confirmations;

    if (
      confirmations < rule.confirmAfterMisses ||
      hasOpenTask({ ...state, tasks: nextTasks }, rule.sku, rule.fixtureId) ||
      hasOutOfStockAlert({ ...state, outOfStockAlerts: nextAlerts }, rule.sku, rule.fixtureId)
    ) {
      continue;
    }

    const detectedBackroomTags = getDetectedBackroomTags(state, scanEvents, rule.sku);
    const sourceFixtureId = detectedBackroomTags[0]?.currentLocationId;

    if (sourceFixtureId && sourceFixtureId !== 'sold' && sourceFixtureId !== 'unknown') {
      const quantity = Math.min(missingQuantity, detectedBackroomTags.length);
      const task: ReplenishmentTask = {
        id: makeId('task'),
        sku: rule.sku,
        sourceFixtureId,
        destinationFixtureId: rule.fixtureId,
        quantity,
        status: 'queued',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      nextTasks.unshift(task);
      generatedEvents.push(
        createEvent(
          {
            kind: 'task',
            title: 'Replenishment task created',
            fixtureId: rule.fixtureId,
            sku: rule.sku,
            notes: [
              `${missingQuantity} unit gap met threshold of ${rule.replenishWhenMissingAtLeast}`,
              `${quantity} unit${quantity === 1 ? '' : 's'} detected in backroom`,
            ],
          },
          timestamp,
        ),
      );
      continue;
    }

    nextAlerts.unshift({
      id: makeId('oos'),
      sku: rule.sku,
      fixtureId: rule.fixtureId,
      missingQuantity,
      createdAt: timestamp,
    });
    generatedEvents.push(
      createEvent(
        {
          kind: 'alert',
          title: 'Out-of-stock state created',
          fixtureId: rule.fixtureId,
          sku: rule.sku,
          notes: [
            `${missingQuantity} unit gap met threshold of ${rule.replenishWhenMissingAtLeast}`,
            'Backroom scan did not detect replenishment stock.',
          ],
        },
        timestamp,
      ),
    );
  }

  return appendEvents(
    {
      ...state,
      tasks: nextTasks,
      outOfStockAlerts: nextAlerts,
      missingConfirmations: nextConfirmations,
    },
    generatedEvents,
  );
}

function runScanCycle(state: ShelfLoopState): ShelfLoopState {
  const timestamp = nowIso();
  const scanEvents = state.fixtures.map((fixture) => scanFixture(state, fixture, timestamp));
  const withScans = appendEvents(state, scanEvents);
  return reconcileInventory(withScans, scanEvents, timestamp);
}

function setTaskStatus(
  state: ShelfLoopState,
  taskId: string,
  status: ReplenishmentTask['status'],
  title: string,
): ShelfLoopState {
  const timestamp = nowIso();
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return state;
  }

  return appendEvents(
    {
      ...state,
      activeTaskId: taskId,
      tasks: state.tasks.map((item) =>
        item.id === taskId ? { ...item, status, updatedAt: timestamp } : item,
      ),
    },
    [
      createEvent(
        {
          kind: 'task',
          title,
          fixtureId: task.destinationFixtureId,
          sku: task.sku,
          notes: [`Task ${task.id} is now ${status}.`],
        },
        timestamp,
      ),
    ],
  );
}

function completeTask(state: ShelfLoopState, taskId: string): ShelfLoopState {
  const timestamp = nowIso();
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return state;
  }

  const updatedTags = moveTags(
    state.tags,
    task.sku,
    task.sourceFixtureId,
    task.destinationFixtureId,
    task.quantity,
  );
  const rule = state.inventoryRules.find(
    (item) => item.fixtureId === task.destinationFixtureId && item.sku === task.sku,
  );
  const nextConfirmations = { ...state.missingConfirmations };
  if (rule) {
    nextConfirmations[rule.id] = 0;
  }

  return appendEvents(
    {
      ...state,
      tags: updatedTags,
      activeTaskId: null,
      missingConfirmations: nextConfirmations,
      tasks: state.tasks.map((item) =>
        item.id === taskId ? { ...item, status: 'completed', updatedAt: timestamp } : item,
      ),
    },
    [
      createEvent(
        {
          kind: 'task',
          title: 'Replenishment confirmed',
          fixtureId: task.destinationFixtureId,
          sku: task.sku,
          notes: [
            `${task.quantity} unit${task.quantity === 1 ? '' : 's'} moved from bin to sales-floor fixture.`,
            'Simulated completion scan accepted the replenishment.',
          ],
        },
        timestamp,
      ),
    ],
  );
}

function updateScanWindow(intervalSeconds: number): string {
  return `Every ${intervalSeconds} simulated minutes · compressed to ${intervalSeconds} seconds`;
}

export function shelfLoopReducer(state: ShelfLoopState, action: ShelfLoopAction): ShelfLoopState {
  switch (action.type) {
    case 'scan/run-cycle':
      return runScanCycle(state);

    case 'scenario/replenishable-gap': {
      const withGap: ShelfLoopState = {
        ...state,
        tags: moveTags(state.tags, 'MSP-NV-M', 'table-polos', 'sold', 2),
      };
      return runScanCycle(
        appendEvents(withGap, [
          createEvent({
            kind: 'system',
            title: 'Demo scenario: replenishable polo gap',
            notes: ['Two polo tags were removed from Table A to mimic sell-through.'],
          }),
        ]),
      );
    }

    case 'scenario/out-of-stock-gap': {
      const withGap: ShelfLoopState = {
        ...state,
        tags: moveTags(state.tags, 'MCT-BK-L', 'table-tees', 'sold', 3),
      };
      const withScenarioEvent = appendEvents(withGap, [
        createEvent({
          kind: 'system',
          title: 'Demo scenario: folded tee out-of-stock gap',
          notes: [
            'Three tee tags were removed from Table B.',
            'This high-volume fixture requires two confirming misses before alerting.',
          ],
        }),
      ]);
      return runScanCycle(runScanCycle(withScenarioEvent));
    }

    case 'settings/set-scan-mode':
      return appendEvents(
        {
          ...state,
          settings: { ...state.settings, mode: action.mode },
        },
        [
          createEvent({
            kind: 'system',
            title: `RFID scan mode set to ${action.mode}`,
            notes: [
              action.mode === 'clean'
                ? 'Demo scans will act as perfect reads.'
                : 'Realistic scans can miss present tags based on fixture read profiles.',
            ],
          }),
        ],
      );

    case 'settings/set-interval-seconds': {
      const intervalSeconds = Math.min(Math.max(action.intervalSeconds, 3), 60);
      return {
        ...state,
        settings: {
          ...state.settings,
          intervalSeconds,
          scanWindowLabel: updateScanWindow(intervalSeconds),
        },
      };
    }

    case 'settings/toggle-auto-scan':
      return {
        ...state,
        settings: {
          ...state.settings,
          autoScanning: !state.settings.autoScanning,
        },
      };

    case 'task/open':
      return { ...state, activeTaskId: action.taskId };

    case 'task/accept':
      return setTaskStatus(state, action.taskId, 'accepted', 'Stocker accepted task');

    case 'task/confirm-pick':
      return setTaskStatus(state, action.taskId, 'picked', 'Backroom pick confirmed');

    case 'task/confirm-place':
      return completeTask(state, action.taskId);

    case 'reset':
      return createInitialState();
  }
}
