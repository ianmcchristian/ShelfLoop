import { useState } from 'react';

import {
  MerchandiseDot,
  MerchandiseTooltip,
  type MerchandiseDotDetails,
  type MerchandisePositionHighlight,
} from './StoreMapMerchandise';
import { getPositionDetails } from './storeMapMerchandiseDetails';

const tieredDisplayTiers = [
  {
    id: 'top',
    className: 'left-[3%] top-[3%] h-[34%] w-[94%]',
    zClassName: 'z-30',
    count: 6,
    firstPosition: 0,
    gridClassName: 'grid-cols-6',
    heightPercent: 34,
    leftPercent: 3,
    topPercent: 3,
    widthPercent: 94,
  },
  {
    id: 'middle',
    className: 'left-[9%] top-[35%] h-[32%] w-[82%]',
    zClassName: 'z-20',
    count: 6,
    firstPosition: 18,
    gridClassName: 'grid-cols-6',
    heightPercent: 32,
    leftPercent: 9,
    topPercent: 35,
    widthPercent: 82,
  },
  {
    id: 'base',
    className: 'left-[13%] top-[64%] h-[32%] w-[74%]',
    zClassName: 'z-10',
    count: 6,
    firstPosition: 36,
    gridClassName: 'grid-cols-6',
    heightPercent: 32,
    leftPercent: 13,
    topPercent: 64,
    widthPercent: 74,
  },
];

type TieredDisplayTier = (typeof tieredDisplayTiers)[number];

interface TieredDisplayTooltipState {
  details: MerchandiseDotDetails;
  isMissing: boolean;
  leftPercent: number;
  positionIndex: number;
  topPercent: number;
}

function DenseMerchandiseCluster({
  centerActive,
  centerHighlight,
  details,
  firstPositionIndex,
  leftActive,
  leftHighlight,
  onHoverPositionChange,
  onPickStack,
  rightActive,
  rightHighlight,
}: {
  centerActive: boolean;
  centerHighlight: MerchandisePositionHighlight | null;
  details: MerchandiseDotDetails;
  firstPositionIndex: number;
  leftActive: boolean;
  leftHighlight: MerchandisePositionHighlight | null;
  onHoverPositionChange?: (positionIndex: number, isHovered: boolean) => void;
  onPickStack?: (firstPositionIndex: number) => void;
  rightActive: boolean;
  rightHighlight: MerchandisePositionHighlight | null;
}) {
  const lobes = [
    {
      active: leftActive,
      className: 'absolute left-0 top-1/2 -translate-y-1/2',
      highlight: leftHighlight,
      positionIndex: firstPositionIndex,
      sizeClassName: 'h-3 w-3',
    },
    {
      active: rightActive,
      className: 'absolute right-0 top-1/2 -translate-y-1/2',
      highlight: rightHighlight,
      positionIndex: firstPositionIndex + 2,
      sizeClassName: 'h-3 w-3',
    },
    {
      active: centerActive,
      className: 'absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2',
      highlight: centerHighlight,
      positionIndex: firstPositionIndex + 1,
      sizeClassName: 'h-4 w-4',
    },
  ];
  const canPickStack = Boolean(onPickStack);
  const hoverPositionIndex =
    lobes.find((lobe) => lobe.active || lobe.highlight === 'missing')?.positionIndex ??
    firstPositionIndex;

  return (
    <span
      aria-label={canPickStack ? `Pick one ${details.sku} from ${details.rackLabel}` : undefined}
      className={`relative block h-4 w-7 justify-self-center ${
        canPickStack
          ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35'
          : ''
      }`}
      role={canPickStack ? 'button' : undefined}
      tabIndex={canPickStack ? 0 : undefined}
      onClick={
        canPickStack
          ? (event) => {
              event.stopPropagation();
              onPickStack?.(firstPositionIndex);
            }
          : undefined
      }
      onKeyDown={
        canPickStack
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onPickStack?.(firstPositionIndex);
              }
            }
          : undefined
      }
      onMouseEnter={() => onHoverPositionChange?.(hoverPositionIndex, true)}
      onMouseLeave={() => onHoverPositionChange?.(hoverPositionIndex, false)}
    >
      {lobes.map((lobe) => (
        <MerchandiseDot
          key={lobe.className}
          active={lobe.active}
          className={`pointer-events-none ${lobe.className}`}
          details={details}
          highlight={lobe.highlight}
          showTooltip={false}
          sizeClassName={lobe.sizeClassName}
        />
      ))}
    </span>
  );
}

function createTieredDisplayTooltip(
  tier: TieredDisplayTier,
  clusterIndex: number,
  positionIndex: number,
  positionDetails: MerchandiseDotDetails[],
  positionHighlights: (MerchandisePositionHighlight | null)[],
): TieredDisplayTooltipState {
  const relativeLobeIndex = positionIndex - (tier.firstPosition + clusterIndex * 3);
  const lobeOffsetPercent = [-1.25, 0, 1.25][relativeLobeIndex] ?? 0;

  return {
    details: getPositionDetails(positionDetails, positionIndex),
    isMissing: positionHighlights[positionIndex] === 'missing',
    leftPercent:
      tier.leftPercent +
      tier.widthPercent * ((clusterIndex + 0.5) / tier.count) +
      lobeOffsetPercent,
    positionIndex,
    topPercent: tier.topPercent + tier.heightPercent * 0.5,
  };
}

export function TieredDisplayMerchandise({
  occupiedPositions,
  onPickStack,
  positionDetails,
  positionHighlights = [],
}: {
  occupiedPositions: boolean[];
  onPickStack?: (firstPositionIndex: number) => void;
  positionDetails: MerchandiseDotDetails[];
  positionHighlights?: (MerchandisePositionHighlight | null)[];
}) {
  const [hoveredTooltip, setHoveredTooltip] = useState<TieredDisplayTooltipState | null>(null);

  const updateHoveredTooltip = (
    tier: TieredDisplayTier,
    clusterIndex: number,
    positionIndex: number,
    isHovered: boolean,
  ) => {
    if (!isHovered) {
      setHoveredTooltip((currentTooltip) =>
        currentTooltip?.positionIndex === positionIndex ? null : currentTooltip,
      );
      return;
    }

    if (!occupiedPositions[positionIndex] && positionHighlights[positionIndex] !== 'missing') {
      return;
    }

    setHoveredTooltip(
      createTieredDisplayTooltip(
        tier,
        clusterIndex,
        positionIndex,
        positionDetails,
        positionHighlights,
      ),
    );
  };

  return (
    <div className="relative h-full min-h-[6.4rem]">
      {tieredDisplayTiers.map((tier) => (
        <div
          key={tier.id}
          className={`absolute overflow-visible border-2 border-slate-800 bg-white/95 shadow-sm ${tier.zClassName} ${tier.className}`}
        >
          <div className={`grid h-full ${tier.gridClassName} items-center gap-1 px-4 py-2`}>
            {Array.from({ length: tier.count }, (_, index) => {
              const firstLobeIndex = tier.firstPosition + index * 3;

              return (
                <DenseMerchandiseCluster
                  key={`${tier.id}-${index}`}
                  centerActive={Boolean(occupiedPositions[firstLobeIndex + 1])}
                  centerHighlight={positionHighlights[firstLobeIndex + 1] ?? null}
                  details={getPositionDetails(positionDetails, firstLobeIndex)}
                  firstPositionIndex={firstLobeIndex}
                  leftActive={Boolean(occupiedPositions[firstLobeIndex])}
                  leftHighlight={positionHighlights[firstLobeIndex] ?? null}
                  onHoverPositionChange={(positionIndex, isHovered) =>
                    updateHoveredTooltip(tier, index, positionIndex, isHovered)
                  }
                  onPickStack={onPickStack}
                  rightActive={Boolean(occupiedPositions[firstLobeIndex + 2])}
                  rightHighlight={positionHighlights[firstLobeIndex + 2] ?? null}
                />
              );
            })}
          </div>
        </div>
      ))}

      {hoveredTooltip ? (
        <MerchandiseTooltip
          className="absolute z-[180]"
          details={hoveredTooltip.details}
          isMissing={hoveredTooltip.isMissing}
          style={{
            left: `${hoveredTooltip.leftPercent}%`,
            top: `${hoveredTooltip.topPercent}%`,
            transform: 'translate(-50%, calc(-100% - 0.5rem))',
          }}
        />
      ) : null}
    </div>
  );
}
