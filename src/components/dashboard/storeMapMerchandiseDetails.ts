import type { MerchandiseDotDetails } from './StoreMapMerchandise';

export function getPositionDetails(
  positionDetails: MerchandiseDotDetails[],
  positionIndex: number,
): MerchandiseDotDetails {
  return (
    positionDetails[positionIndex] ?? {
      sku: 'UNKNOWN',
      name: 'Unknown item',
      rackLabel: 'Unknown position',
    }
  );
}
