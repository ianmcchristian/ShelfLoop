import { describe, expect, it } from 'vitest';
import { createInitialState } from '../data/demoData';
import { shelfLoopReducer } from '../domain/reducer';
import { getInventoryRows, getOpenTasks } from '../domain/selectors';

function runReplenishmentFlow() {
  let state = shelfLoopReducer(createInitialState(), { type: 'scenario/replenishable-gap' });
  const task = state.tasks[0];
  expect(task).toBeDefined();

  state = shelfLoopReducer(state, { type: 'task/accept', taskId: task!.id });
  state = shelfLoopReducer(state, { type: 'task/confirm-pick', taskId: task!.id });
  state = shelfLoopReducer(state, { type: 'task/confirm-place', taskId: task!.id });

  return state;
}

describe('ShelfLoop inventory logic', () => {
  it('creates a replenishment task when a missing display gap has backroom stock', () => {
    const state = shelfLoopReducer(createInitialState(), { type: 'scenario/replenishable-gap' });
    const openTasks = getOpenTasks(state);

    expect(openTasks).toHaveLength(1);
    expect(openTasks[0]?.sku).toBe('MSP-NV-M');
    expect(openTasks[0]?.quantity).toBe(2);
    expect(state.outOfStockAlerts).toHaveLength(0);
  });

  it('creates an out-of-stock alert when missing display inventory has no backroom stock', () => {
    const state = shelfLoopReducer(createInitialState(), { type: 'scenario/out-of-stock-gap' });

    expect(getOpenTasks(state)).toHaveLength(0);
    expect(state.outOfStockAlerts).toHaveLength(1);
    expect(state.outOfStockAlerts[0]?.sku).toBe('MCT-BK-L');
  });

  it('moves backroom tags to the destination fixture when the stocker completes a task', () => {
    const state = runReplenishmentFlow();
    const rows = getInventoryRows(state);
    const poloRow = rows.find((row) => row.sku === 'MSP-NV-M');

    expect(poloRow?.detectedQuantity).toBe(6);
    expect(poloRow?.missingQuantity).toBe(0);
    expect(getOpenTasks(state)).toHaveLength(0);
  });
});
