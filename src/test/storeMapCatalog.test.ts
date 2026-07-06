import { describe, expect, it } from 'vitest';
import {
  getPositionIndexesForSku,
  getRackItemForPosition,
  racks,
} from '../components/dashboard/storeMapCatalog';

function getRack(label: string) {
  const rack = racks.find((candidate) => candidate.label === label);
  expect(rack).toBeDefined();
  return rack!;
}

describe('store map SKU placement catalog', () => {
  it('keeps Rack A SKUs pinned to individual static positions', () => {
    const rackA = getRack('Rack A');

    expect(getRackItemForPosition(rackA, 0).sku).toBe('MSP-NV-M');
    expect(getRackItemForPosition(rackA, 15).sku).toBe('MBB-CH-L');
    expect(getPositionIndexesForSku(rackA, 'MSP-NV-M')).toEqual([0]);
  });

  it('keeps Rack B SKUs pinned to static three-position stacks', () => {
    const rackB = getRack('Rack B');

    expect(getPositionIndexesForSku(rackB, 'MCT-BK-L')).toEqual([0, 1, 2]);
    expect(getPositionIndexesForSku(rackB, 'MAC-OL-L')).toEqual([51, 52, 53]);
    expect(getRackItemForPosition(rackB, 52).sku).toBe('MAC-OL-L');
  });
});
