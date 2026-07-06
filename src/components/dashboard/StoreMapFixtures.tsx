import { useState, type CSSProperties } from 'react';

const boxesPerStorageColumn = 8;

const backroomStorageColumns = [
  'left-[6.5%] top-[32%] h-[61%] w-[9%]',
  'left-[26%] top-[32%] h-[61%] w-[9%]',
  'left-[45.5%] top-[32%] h-[61%] w-[9%]',
  'left-[65%] top-[32%] h-[61%] w-[9%]',
  'left-[84.5%] top-[32%] h-[61%] w-[9%]',
];

export const backroomBoxCount = backroomStorageColumns.length * boxesPerStorageColumn;

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

export interface MerchandiseDotDetails {
  sku: string;
  name: string;
  rackLabel: string;
}

export type MerchandisePositionHighlight = 'available' | 'missing';

interface MerchandiseDotProps {
  active: boolean;
  details: MerchandiseDotDetails;
  className?: string;
  highlight?: MerchandisePositionHighlight | null;
  onHoverChange?: (isHovered: boolean) => void;
  onPick?: () => void;
  showTooltip?: boolean;
  sizeClassName?: string;
}

function getPositionDetails(
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

function MerchandiseTooltip({
  className,
  details,
  isMissing,
  style,
}: {
  className: string;
  details: MerchandiseDotDetails;
  isMissing: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      className={`pointer-events-none w-max max-w-48 border border-retail-blue/20 bg-white px-2.5 py-2 text-left text-[0.65rem] font-bold leading-4 text-slate-700 shadow-retail ${className}`}
      style={style}
    >
      <span
        className={`block font-black uppercase tracking-[0.16em] ${
          isMissing ? 'text-red-600' : 'text-retail-blue'
        }`}
      >
        {details.sku}
      </span>
      <span className="block whitespace-nowrap text-retail-ink">{details.name}</span>
      <span className="block text-slate-400">
        {details.rackLabel}
        {isMissing ? ' · Not in stock' : ''}
      </span>
    </span>
  );
}

function MerchandiseDot({
  active,
  details,
  className = '',
  highlight = null,
  onHoverChange,
  onPick,
  showTooltip = true,
  sizeClassName = 'h-3.5 w-3.5',
}: MerchandiseDotProps) {
  const isAvailableHighlight = highlight === 'available';
  const isMissingHighlight = highlight === 'missing';
  const isHighlighted = isAvailableHighlight || isMissingHighlight;
  const activeClassName = isAvailableHighlight
    ? 'border-emerald-900 bg-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.85)]'
    : 'border-slate-800 bg-retail-blue shadow-sm';
  const inactiveClassName = isMissingHighlight
    ? 'border-red-700 bg-white shadow-[0_0_18px_rgba(239,68,68,0.72)]'
    : 'border-slate-800 bg-white/90';
  const canPick = Boolean(onPick);

  return (
    <span
      aria-label={canPick ? `Pick ${details.sku} from ${details.rackLabel}` : undefined}
      className={`group/dot ${className} ${
        canPick
          ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35'
          : ''
      }`}
      role={canPick ? 'button' : undefined}
      tabIndex={canPick ? 0 : undefined}
      onClick={
        canPick
          ? (event) => {
              event.stopPropagation();
              onPick?.();
            }
          : undefined
      }
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onKeyDown={
        canPick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                onPick?.();
              }
            }
          : undefined
      }
    >
      <span
        className={`relative inline-flex ${sizeClassName} items-center justify-center rounded-full`}
      >
        {isHighlighted ? (
          <>
            <span
              className={`pointer-events-none absolute -inset-2 rounded-full animate-ping ${
                isMissingHighlight ? 'bg-red-400/45' : 'bg-emerald-400/45'
              }`}
            />
            <span
              className={`pointer-events-none absolute -inset-1 rounded-full blur-sm ${
                isMissingHighlight ? 'bg-red-300/40' : 'bg-emerald-300/40'
              }`}
            />
          </>
        ) : null}
        <span
          aria-hidden="true"
          className={`relative block ${sizeClassName} rounded-full border-2 ${
            active ? activeClassName : inactiveClassName
          }`}
        />
      </span>

      {showTooltip && (active || isMissingHighlight) ? (
        <MerchandiseTooltip
          className="absolute bottom-full left-1/2 z-[120] mb-2 hidden -translate-x-1/2 group-hover/dot:block"
          details={details}
          isMissing={isMissingHighlight}
        />
      ) : null}
    </span>
  );
}

function DenseMerchandiseCluster({
  centerActive,
  centerHighlight,
  details,
  firstPositionIndex,
  leftActive,
  leftHighlight,
  onHoverPositionChange,
  onPickPosition,
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
  onPickPosition?: (positionIndex: number) => void;
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

  return (
    <span className="relative block h-4 w-7 justify-self-center">
      {lobes.map((lobe) => (
        <MerchandiseDot
          key={lobe.className}
          active={lobe.active}
          className={lobe.className}
          details={details}
          highlight={lobe.highlight}
          onHoverChange={(isHovered) => onHoverPositionChange?.(lobe.positionIndex, isHovered)}
          onPick={onPickPosition ? () => onPickPosition(lobe.positionIndex) : undefined}
          showTooltip={false}
          sizeClassName={lobe.sizeClassName}
        />
      ))}
    </span>
  );
}

function HangingRackModule({
  moduleIndex,
  occupiedPositions,
  onPickPosition,
  positionDetails,
  positionHighlights,
}: {
  moduleIndex: number;
  occupiedPositions: boolean[];
  onPickPosition?: (positionIndex: number) => void;
  positionDetails: MerchandiseDotDetails[];
  positionHighlights: (MerchandisePositionHighlight | null)[];
}) {
  const firstPosition = moduleIndex * 4;

  return (
    <div className="relative z-10 h-full min-h-20">
      <span className="absolute left-1/2 top-2 h-[calc(100%-1rem)] w-1.5 -translate-x-1/2 bg-slate-800" />
      <span className="absolute left-[13%] right-[13%] top-[26%] h-1.5 bg-slate-800" />
      <span className="absolute left-[13%] right-[13%] bottom-[26%] h-1.5 bg-slate-800" />
      <span className="absolute left-[13%] top-[20%] h-4 w-1 bg-slate-800" />
      <span className="absolute right-[13%] top-[20%] h-4 w-1 bg-slate-800" />
      <span className="absolute bottom-[20%] left-[13%] h-4 w-1 bg-slate-800" />
      <span className="absolute bottom-[20%] right-[13%] h-4 w-1 bg-slate-800" />

      <MerchandiseDot
        active={Boolean(occupiedPositions[firstPosition])}
        className="absolute left-[32%] top-[31%] -translate-x-1/2 -translate-y-1/2"
        details={getPositionDetails(positionDetails, firstPosition)}
        highlight={positionHighlights[firstPosition] ?? null}
        onPick={onPickPosition ? () => onPickPosition(firstPosition) : undefined}
      />
      <MerchandiseDot
        active={Boolean(occupiedPositions[firstPosition + 1])}
        className="absolute right-[32%] top-[31%] translate-x-1/2 -translate-y-1/2"
        details={getPositionDetails(positionDetails, firstPosition + 1)}
        highlight={positionHighlights[firstPosition + 1] ?? null}
        onPick={onPickPosition ? () => onPickPosition(firstPosition + 1) : undefined}
      />
      <MerchandiseDot
        active={Boolean(occupiedPositions[firstPosition + 2])}
        className="absolute bottom-[29%] left-[32%] -translate-x-1/2 translate-y-1/2"
        details={getPositionDetails(positionDetails, firstPosition + 2)}
        highlight={positionHighlights[firstPosition + 2] ?? null}
        onPick={onPickPosition ? () => onPickPosition(firstPosition + 2) : undefined}
      />
      <MerchandiseDot
        active={Boolean(occupiedPositions[firstPosition + 3])}
        className="absolute bottom-[29%] right-[32%] translate-x-1/2 translate-y-1/2"
        details={getPositionDetails(positionDetails, firstPosition + 3)}
        highlight={positionHighlights[firstPosition + 3] ?? null}
        onPick={onPickPosition ? () => onPickPosition(firstPosition + 3) : undefined}
      />
    </div>
  );
}

export function HangingRackMerchandise({
  occupiedPositions,
  onPickPosition,
  positionDetails,
  positionHighlights = [],
}: {
  occupiedPositions: boolean[];
  onPickPosition?: (positionIndex: number) => void;
  positionDetails: MerchandiseDotDetails[];
  positionHighlights?: (MerchandisePositionHighlight | null)[];
}) {
  return (
    <div className="relative grid h-full grid-cols-4 gap-2 p-2">
      <span className="absolute left-4 right-4 top-1/2 z-0 h-2 -translate-y-1/2 bg-slate-800" />
      {Array.from({ length: 4 }, (_, moduleIndex) => (
        <HangingRackModule
          key={moduleIndex}
          moduleIndex={moduleIndex}
          occupiedPositions={occupiedPositions}
          onPickPosition={onPickPosition}
          positionDetails={positionDetails}
          positionHighlights={positionHighlights}
        />
      ))}
    </div>
  );
}

interface TieredDisplayTooltipState {
  details: MerchandiseDotDetails;
  isMissing: boolean;
  leftPercent: number;
  positionIndex: number;
  topPercent: number;
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
  onPickPosition,
  positionDetails,
  positionHighlights = [],
}: {
  occupiedPositions: boolean[];
  onPickPosition?: (positionIndex: number) => void;
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
                  onPickPosition={onPickPosition}
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

export function CardboardBoxIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      className={`relative inline-block border border-[#4b2525] bg-[#ffc37d] shadow-sm ${className}`}
    >
      <span className="absolute bottom-0 left-1/3 top-0 w-1/3 border-x border-[#4b2525] bg-[#d19243]" />
    </span>
  );
}

function CardboardBox({ active }: { active: boolean }) {
  if (!active) {
    return <div aria-hidden="true" className="h-5 w-5" />;
  }

  return <CardboardBoxIcon />;
}

function BackroomMetricsPopover({ occupiedBoxes }: { occupiedBoxes: boolean[] }) {
  const availableBoxes = occupiedBoxes.filter(Boolean).length;
  const consumedBoxes = occupiedBoxes.length - availableBoxes;
  const reserveFill = Math.round((availableBoxes / occupiedBoxes.length) * 100);

  return (
    <div className="absolute bottom-full left-1/2 z-[100] mb-2 hidden w-64 -translate-x-1/2 border border-retail-blue/20 bg-white p-3 text-left shadow-retail group-hover:block">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-retail-blue">
            Advanced metrics
          </p>
          <h4 className="mt-1 text-base font-black text-retail-ink">Backroom storage</h4>
        </div>
        <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">
          Reserve
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-retail-blue-light p-2">
          <dt className="font-black uppercase tracking-[0.12em] text-slate-500">Available</dt>
          <dd className="mt-1 text-lg font-black text-retail-ink">{availableBoxes}</dd>
        </div>
        <div className="bg-retail-blue-light p-2">
          <dt className="font-black uppercase tracking-[0.12em] text-slate-500">Fill</dt>
          <dd className="mt-1 text-lg font-black text-retail-ink">{reserveFill}%</dd>
        </div>
        <div className="bg-slate-50 p-2">
          <dt className="font-black uppercase tracking-[0.12em] text-slate-500">Consumed</dt>
          <dd className="mt-1 text-lg font-black text-retail-ink">{consumedBoxes}</dd>
        </div>
        <div className="bg-slate-50 p-2">
          <dt className="font-black uppercase tracking-[0.12em] text-slate-500">Columns</dt>
          <dd className="mt-1 text-lg font-black text-retail-ink">
            {backroomStorageColumns.length}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
        One reserve box is consumed each time the sales floor is replenished. Reset demo restores
        the full backroom reserve.
      </p>
    </div>
  );
}

function BackroomStorageColumn({ className, boxes }: { className: string; boxes: boolean[] }) {
  return (
    <div className={`absolute border-2 border-slate-800 bg-white/95 p-1.5 ${className}`}>
      <div className="grid h-full grid-cols-2 grid-rows-4 place-items-center gap-1">
        {boxes.map((active, index) => (
          <CardboardBox key={index} active={active} />
        ))}
      </div>
    </div>
  );
}

export function BackstockRoom({ occupiedBoxes }: { occupiedBoxes: boolean[] }) {
  return (
    <div className="absolute inset-x-[5%] bottom-[5%] z-30 h-[32%] bg-slate-50/55">
      <div aria-hidden="true" className="absolute inset-x-0 top-[15%] h-1">
        <span className="absolute left-0 top-0 h-full w-[39%] rounded-full bg-slate-800" />
        <span className="absolute right-0 top-0 h-full w-[39%] rounded-full bg-slate-800" />
      </div>

      <div className="group absolute left-1/2 top-[7%] z-40 -translate-x-1/2 bg-slate-50/90 px-3 text-center">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-slate-500 underline decoration-transparent underline-offset-4 transition hover:text-retail-blue hover:decoration-retail-blue">
          Backroom storage
        </p>
        <p className="mt-0.5 text-[0.62rem] font-semibold text-slate-400">Replenishment reserve</p>
        <BackroomMetricsPopover occupiedBoxes={occupiedBoxes} />
      </div>

      {backroomStorageColumns.map((columnClassName, index) => {
        const firstBoxIndex = index * boxesPerStorageColumn;

        return (
          <BackroomStorageColumn
            key={`backroom-column-${index}`}
            boxes={occupiedBoxes.slice(firstBoxIndex, firstBoxIndex + boxesPerStorageColumn)}
            className={columnClassName}
          />
        );
      })}
    </div>
  );
}
