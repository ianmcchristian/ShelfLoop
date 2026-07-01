export type FixtureType = 'low-density-table' | 'folded-table' | 'backroom-bin';
export type ZoneType = 'sales-floor' | 'backroom';
export type ScanMode = 'clean' | 'realistic';
export type TaskStatus = 'queued' | 'accepted' | 'picked' | 'completed';
export type EventKind = 'scan' | 'task' | 'alert' | 'system';
export type InventoryHealth = 'healthy' | 'watch' | 'replenish' | 'out-of-stock';
export type VolumeProfile = 'low-volume' | 'high-volume';

export interface ProductVariant {
  sku: string;
  name: string;
  color: string;
  size: string;
  category: string;
  unitRetail: number;
}

export interface Fixture {
  id: string;
  name: string;
  zone: ZoneType;
  type: FixtureType;
  description: string;
  readProfile: {
    cleanReadRate: number;
    realisticReadRate: number;
    fieldNote: string;
  };
}

export interface RfidTag {
  id: string;
  epc: string;
  sku: string;
  currentLocationId: string | 'sold' | 'unknown';
}

export interface InventoryRule {
  id: string;
  fixtureId: string;
  sku: string;
  targetQuantity: number;
  replenishWhenMissingAtLeast: number;
  confirmAfterMisses: number;
  volumeProfile: VolumeProfile;
}

export interface ReplenishmentTask {
  id: string;
  sku: string;
  sourceFixtureId: string;
  destinationFixtureId: string;
  quantity: number;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OutOfStockAlert {
  id: string;
  sku: string;
  fixtureId: string;
  missingQuantity: number;
  createdAt: string;
}

export interface ShelfEvent {
  id: string;
  kind: EventKind;
  timestamp: string;
  title: string;
  fixtureId?: string;
  sku?: string;
  detectedTagIds?: string[];
  missedTagIds?: string[];
  confidence?: number;
  notes: string[];
}

export interface ScanSettings {
  mode: ScanMode;
  intervalSeconds: number;
  autoScanning: boolean;
  scanWindowLabel: string;
}

export interface ShelfLoopState {
  products: ProductVariant[];
  fixtures: Fixture[];
  tags: RfidTag[];
  inventoryRules: InventoryRule[];
  tasks: ReplenishmentTask[];
  outOfStockAlerts: OutOfStockAlert[];
  events: ShelfEvent[];
  missingConfirmations: Record<string, number>;
  settings: ScanSettings;
  activeTaskId: string | null;
  lastUpdatedAt: string;
}

export type ShelfLoopAction =
  | { type: 'scan/run-cycle' }
  | { type: 'scenario/replenishable-gap' }
  | { type: 'scenario/out-of-stock-gap' }
  | { type: 'settings/set-scan-mode'; mode: ScanMode }
  | { type: 'settings/set-interval-seconds'; intervalSeconds: number }
  | { type: 'settings/toggle-auto-scan' }
  | { type: 'task/open'; taskId: string }
  | { type: 'task/accept'; taskId: string }
  | { type: 'task/confirm-pick'; taskId: string }
  | { type: 'task/confirm-place'; taskId: string }
  | { type: 'reset' };
