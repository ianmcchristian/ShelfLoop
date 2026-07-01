import type {
  Fixture,
  InventoryRule,
  ProductVariant,
  RfidTag,
  ShelfLoopState,
} from '../domain/types';

const fixtures: Fixture[] = [
  {
    id: 'table-polos',
    name: 'Table A · Performance Polos',
    zone: 'sales-floor',
    type: 'low-density-table',
    description: 'Lower-density feature table with easier tag visibility and cleaner reads.',
    readProfile: {
      cleanReadRate: 1,
      realisticReadRate: 0.92,
      fieldNote: 'Represents an easier apparel fixture with strong unique tag coverage.',
    },
  },
  {
    id: 'table-tees',
    name: 'Table B · Folded Core Tees',
    zone: 'sales-floor',
    type: 'folded-table',
    description: 'Dense folded table where stacked garments can block passive tag backscatter.',
    readProfile: {
      cleanReadRate: 1,
      realisticReadRate: 0.38,
      fieldNote: 'Models the harder folded-apparel behavior observed in RFID testing concepts.',
    },
  },
  {
    id: 'bin-mens-basics',
    name: "Backroom Bin M-12 · Men's Basics",
    zone: 'backroom',
    type: 'backroom-bin',
    description: 'Controlled replenishment bin with stronger scan confidence than dense displays.',
    readProfile: {
      cleanReadRate: 1,
      realisticReadRate: 0.88,
      fieldNote: 'Backroom bins are more controlled, but still not treated as magic perfect boxes.',
    },
  },
];

const products: ProductVariant[] = [
  {
    sku: 'MSP-NV-M',
    name: "Men's Stretch Polo",
    color: 'Navy',
    size: 'M',
    category: "Men's basics",
    unitRetail: 18.98,
  },
  {
    sku: 'MCT-BK-L',
    name: "Men's Core Tee",
    color: 'Black',
    size: 'L',
    category: "Men's basics",
    unitRetail: 7.98,
  },
];

const inventoryRules: InventoryRule[] = [
  {
    id: 'rule-polos-table',
    fixtureId: 'table-polos',
    sku: 'MSP-NV-M',
    targetQuantity: 6,
    replenishWhenMissingAtLeast: 2,
    confirmAfterMisses: 1,
    volumeProfile: 'low-volume',
  },
  {
    id: 'rule-tees-table',
    fixtureId: 'table-tees',
    sku: 'MCT-BK-L',
    targetQuantity: 8,
    replenishWhenMissingAtLeast: 3,
    confirmAfterMisses: 2,
    volumeProfile: 'high-volume',
  },
];

function makeTags(prefix: string, sku: string, count: number, locationId: string): RfidTag[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    epc: `3034-${sku}-${String(index + 1).padStart(4, '0')}`,
    sku,
    currentLocationId: locationId,
  }));
}

export function createInitialState(): ShelfLoopState {
  const now = new Date().toISOString();

  return {
    products,
    fixtures,
    inventoryRules,
    tags: [
      ...makeTags('polo-floor', 'MSP-NV-M', 6, 'table-polos'),
      ...makeTags('polo-backroom', 'MSP-NV-M', 4, 'bin-mens-basics'),
      ...makeTags('tee-floor', 'MCT-BK-L', 8, 'table-tees'),
    ],
    tasks: [],
    outOfStockAlerts: [],
    events: [
      {
        id: 'event-initialized',
        kind: 'system',
        timestamp: now,
        title: 'ShelfLoop demo initialized',
        notes: ['Two sales-floor fixtures and one backroom bin are loaded with mock RFID tags.'],
      },
    ],
    missingConfirmations: {},
    settings: {
      mode: 'clean',
      intervalSeconds: 8,
      autoScanning: false,
      scanWindowLabel: 'Every 8 simulated minutes · compressed to 8 seconds',
    },
    activeTaskId: null,
    lastUpdatedAt: now,
  };
}
