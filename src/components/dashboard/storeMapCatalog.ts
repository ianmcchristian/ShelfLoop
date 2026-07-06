export type RackId = 'rack-a' | 'rack-b';
export type RackInventory = Record<RackId, boolean[]>;
export type RackItemGrouping = 'single' | 'triplet';

export interface MerchandiseItem {
  sku: string;
  name: string;
}

export interface SkuSuggestion extends MerchandiseItem {
  rackLabel: string;
}

export interface RackConfig {
  id: RackId;
  label: string;
  mapClassName: string;
  capacity: number;
  itemGrouping: RackItemGrouping;
  items: MerchandiseItem[];
  startingStock: number;
  readRate: number;
  scanConfidence: number;
  dwellMinutes: number;
}

const rackAItems: MerchandiseItem[] = [
  { sku: 'MSP-NV-M', name: "Men's Stretch Polo · Navy M" },
  { sku: 'MSP-BK-L', name: "Men's Stretch Polo · Black L" },
  { sku: 'MCH-WH-M', name: "Men's Oxford Shirt · White M" },
  { sku: 'MCH-BL-L', name: "Men's Oxford Shirt · Blue L" },
  { sku: 'MFL-GY-M', name: "Men's Fleece Hoodie · Gray M" },
  { sku: 'MFL-BK-L', name: "Men's Fleece Hoodie · Black L" },
  { sku: 'MRC-OL-M', name: "Men's Rain Shell · Olive M" },
  { sku: 'MRC-NV-L', name: "Men's Rain Shell · Navy L" },
  { sku: 'MVT-KH-M', name: "Men's Utility Vest · Khaki M" },
  { sku: 'MVT-BK-L', name: "Men's Utility Vest · Black L" },
  { sku: 'MTS-RD-M', name: "Men's Training Shirt · Red M" },
  { sku: 'MTS-GR-L', name: "Men's Training Shirt · Green L" },
  { sku: 'MSS-WH-M', name: "Men's Stripe Shirt · White M" },
  { sku: 'MSS-NV-L', name: "Men's Stripe Shirt · Navy L" },
  { sku: 'MBB-BL-M', name: "Men's Baselayer · Blue M" },
  { sku: 'MBB-CH-L', name: "Men's Baselayer · Charcoal L" },
];

const rackBItems: MerchandiseItem[] = [
  { sku: 'MCT-BK-L', name: "Men's Core Tee · Black L" },
  { sku: 'MCT-WH-M', name: "Men's Core Tee · White M" },
  { sku: 'MCT-GY-L', name: "Men's Core Tee · Gray L" },
  { sku: 'MCT-NV-M', name: "Men's Core Tee · Navy M" },
  { sku: 'MJT-BK-M', name: "Men's Jersey Tee · Black M" },
  { sku: 'MJT-RD-L', name: "Men's Jersey Tee · Red L" },
  { sku: 'MTH-GR-M', name: "Men's Thermal · Green M" },
  { sku: 'MTH-CH-L', name: "Men's Thermal · Charcoal L" },
  { sku: 'MHS-KH-32', name: "Men's Hybrid Short · Khaki 32" },
  { sku: 'MHS-NV-34', name: "Men's Hybrid Short · Navy 34" },
  { sku: 'MDN-BL-32', name: "Men's Denim · Blue 32" },
  { sku: 'MDN-BK-34', name: "Men's Denim · Black 34" },
  { sku: 'MJG-GY-M', name: "Men's Jogger · Gray M" },
  { sku: 'MJG-BK-L', name: "Men's Jogger · Black L" },
  { sku: 'MCK-WH-M', name: "Men's Crew Knit · White M" },
  { sku: 'MCK-NV-L', name: "Men's Crew Knit · Navy L" },
  { sku: 'MAC-BR-M', name: "Men's Active Chino · Brown M" },
  { sku: 'MAC-OL-L', name: "Men's Active Chino · Olive L" },
];

const fallbackItem: MerchandiseItem = {
  sku: 'UNKNOWN',
  name: 'Unknown item',
};

export const racks: RackConfig[] = [
  {
    id: 'rack-a',
    label: 'Rack A',
    mapClassName: 'left-[10%] top-[23%] h-[27%] w-[34%]',
    capacity: 16,
    itemGrouping: 'single',
    items: rackAItems,
    startingStock: 16,
    readRate: 96,
    scanConfidence: 93,
    dwellMinutes: 4,
  },
  {
    id: 'rack-b',
    label: 'Rack B',
    mapClassName: 'left-[51%] top-[23%] h-[27%] w-[34%]',
    capacity: 54,
    itemGrouping: 'triplet',
    items: rackBItems,
    startingStock: 54,
    readRate: 82,
    scanConfidence: 77,
    dwellMinutes: 9,
  },
];

export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

export function getRackItemIndexForPosition(rack: RackConfig, positionIndex: number): number {
  return rack.itemGrouping === 'triplet' ? Math.floor(positionIndex / 3) : positionIndex;
}

export function getRackItemForPosition(rack: RackConfig, positionIndex: number): MerchandiseItem {
  return (
    rack.items[getRackItemIndexForPosition(rack, positionIndex)] ?? rack.items[0] ?? fallbackItem
  );
}

export function getRackPositionLabel(rack: RackConfig, positionIndex: number): string {
  if (rack.itemGrouping === 'triplet') {
    return `Stack ${getRackItemIndexForPosition(rack, positionIndex) + 1}`;
  }

  return `Dot ${positionIndex + 1}`;
}

export function getPositionIndexesForSku(rack: RackConfig, sku: string): number[] {
  const normalizedSku = normalizeSku(sku);

  return Array.from({ length: rack.capacity }, (_, index) => index).filter(
    (index) => normalizeSku(getRackItemForPosition(rack, index).sku) === normalizedSku,
  );
}

export function getSkuSuggestions(query: string, limit = 6): SkuSuggestion[] {
  const normalizedQuery = normalizeSku(query);

  if (!normalizedQuery) {
    return [];
  }

  return racks
    .flatMap((rack) => rack.items.map((item) => ({ ...item, rackLabel: rack.label })))
    .filter((item) => normalizeSku(item.sku).startsWith(normalizedQuery))
    .sort((a, b) => a.sku.localeCompare(b.sku))
    .slice(0, limit);
}

export function findRackItemBySku(
  sku: string,
): { rack: RackConfig; item: MerchandiseItem; itemIndex: number } | null {
  const normalizedSku = normalizeSku(sku);

  if (!normalizedSku) {
    return null;
  }

  for (const rack of racks) {
    const itemIndex = rack.items.findIndex((item) => normalizeSku(item.sku) === normalizedSku);

    if (itemIndex !== -1) {
      const item = rack.items[itemIndex];

      if (item) {
        return { rack, item, itemIndex };
      }
    }
  }

  return null;
}
