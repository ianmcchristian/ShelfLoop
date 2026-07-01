import type { InventoryHealth, ProductVariant, ReplenishmentTask, ShelfLoopState } from './types';

export interface InventoryRow {
  ruleId: string;
  fixtureId: string;
  fixtureName: string;
  sku: string;
  productName: string;
  variant: string;
  targetQuantity: number;
  detectedQuantity: number;
  missingQuantity: number;
  backroomQuantity: number;
  replenishThreshold: number;
  confirmAfterMisses: number;
  currentMissConfirmations: number;
  health: InventoryHealth;
}

export interface KpiCard {
  label: string;
  value: string;
  detail: string;
  tone: 'blue' | 'green' | 'orange' | 'slate';
}

export function getProduct(state: ShelfLoopState, sku: string): ProductVariant {
  const product = state.products.find((item) => item.sku === sku);
  if (!product) {
    throw new Error(`Unknown SKU: ${sku}`);
  }
  return product;
}

export function getFixtureName(state: ShelfLoopState, fixtureId: string): string {
  return state.fixtures.find((fixture) => fixture.id === fixtureId)?.name ?? fixtureId;
}

export function countTagsAt(state: ShelfLoopState, sku: string, fixtureId: string): number {
  return state.tags.filter((tag) => tag.sku === sku && tag.currentLocationId === fixtureId).length;
}

export function countBackroomTags(state: ShelfLoopState, sku: string): number {
  const backroomFixtureIds = new Set(
    state.fixtures.filter((fixture) => fixture.zone === 'backroom').map((fixture) => fixture.id),
  );

  return state.tags.filter(
    (tag) => tag.sku === sku && backroomFixtureIds.has(tag.currentLocationId),
  ).length;
}

export function getInventoryRows(state: ShelfLoopState): InventoryRow[] {
  return state.inventoryRules.map((rule) => {
    const fixtureName = getFixtureName(state, rule.fixtureId);
    const product = getProduct(state, rule.sku);
    const detectedQuantity = countTagsAt(state, rule.sku, rule.fixtureId);
    const missingQuantity = Math.max(rule.targetQuantity - detectedQuantity, 0);
    const hasOutOfStockAlert = state.outOfStockAlerts.some(
      (alert) => alert.fixtureId === rule.fixtureId && alert.sku === rule.sku,
    );

    let health: InventoryHealth = 'healthy';
    if (hasOutOfStockAlert) {
      health = 'out-of-stock';
    } else if (missingQuantity >= rule.replenishWhenMissingAtLeast) {
      health = 'replenish';
    } else if (missingQuantity > 0) {
      health = 'watch';
    }

    return {
      ruleId: rule.id,
      fixtureId: rule.fixtureId,
      fixtureName,
      sku: rule.sku,
      productName: product.name,
      variant: `${product.color} / ${product.size}`,
      targetQuantity: rule.targetQuantity,
      detectedQuantity,
      missingQuantity,
      backroomQuantity: countBackroomTags(state, rule.sku),
      replenishThreshold: rule.replenishWhenMissingAtLeast,
      confirmAfterMisses: rule.confirmAfterMisses,
      currentMissConfirmations: state.missingConfirmations[rule.id] ?? 0,
      health,
    };
  });
}

export function getOpenTasks(state: ShelfLoopState): ReplenishmentTask[] {
  return state.tasks.filter((task) => task.status !== 'completed');
}

export function getKpis(state: ShelfLoopState): KpiCard[] {
  const rows = getInventoryRows(state);
  const openTasks = getOpenTasks(state);
  const scanEvents = state.events.filter(
    (event) => event.kind === 'scan' && event.confidence !== undefined,
  );
  const avgConfidence = scanEvents.length
    ? scanEvents.reduce((sum, event) => sum + (event.confidence ?? 0), 0) / scanEvents.length
    : 1;
  const completedTasks = state.tasks.filter((task) => task.status === 'completed').length;
  const atRiskRevenue = rows.reduce((sum, row) => {
    if (row.health === 'healthy') {
      return sum;
    }
    return sum + getProduct(state, row.sku).unitRetail * row.missingQuantity;
  }, 0);

  return [
    {
      label: 'Open tasks',
      value: String(openTasks.length),
      detail: 'Shared queue replenishment work',
      tone: openTasks.length > 0 ? 'orange' : 'green',
    },
    {
      label: 'OOS alerts',
      value: String(state.outOfStockAlerts.length),
      detail: 'Missing on floor and not found in backroom',
      tone: state.outOfStockAlerts.length > 0 ? 'orange' : 'green',
    },
    {
      label: 'Scan confidence',
      value: `${Math.round(avgConfidence * 100)}%`,
      detail: `${state.settings.mode} mode · ${state.settings.scanWindowLabel}`,
      tone: avgConfidence < 0.7 ? 'orange' : 'blue',
    },
    {
      label: 'At-risk revenue',
      value: `$${atRiskRevenue.toFixed(2)}`,
      detail: `${completedTasks} task${completedTasks === 1 ? '' : 's'} completed in demo`,
      tone: atRiskRevenue > 0 ? 'orange' : 'slate',
    },
  ];
}
