import { useState } from 'react';

import {
  MerchandiseDot,
  type MerchandiseDotDetails,
  type MerchandisePositionHighlight,
} from './StoreMapMerchandise';
import { getPositionDetails } from './storeMapMerchandiseDetails';

export { TieredDisplayMerchandise } from './TieredDisplayMerchandise';
export type { MerchandiseDotDetails, MerchandisePositionHighlight } from './StoreMapMerchandise';

const boxesPerStorageColumn = 8;

const backroomStorageColumns = [
  'left-[6.5%] top-[32%] h-[61%] w-[9%]',
  'left-[26%] top-[32%] h-[61%] w-[9%]',
  'left-[45.5%] top-[32%] h-[61%] w-[9%]',
  'left-[65%] top-[32%] h-[61%] w-[9%]',
  'left-[84.5%] top-[32%] h-[61%] w-[9%]',
];

export const backroomBoxCount = backroomStorageColumns.length * boxesPerStorageColumn;

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
  const [isTooltipLayerActive, setIsTooltipLayerActive] = useState(false);
  const firstPosition = moduleIndex * 4;

  return (
    <div className={`relative h-full min-h-20 ${isTooltipLayerActive ? 'z-40' : 'z-10'}`}>
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
        onHoverChange={setIsTooltipLayerActive}
        onPick={onPickPosition ? () => onPickPosition(firstPosition) : undefined}
      />
      <MerchandiseDot
        active={Boolean(occupiedPositions[firstPosition + 1])}
        className="absolute right-[32%] top-[31%] translate-x-1/2 -translate-y-1/2"
        details={getPositionDetails(positionDetails, firstPosition + 1)}
        highlight={positionHighlights[firstPosition + 1] ?? null}
        onHoverChange={setIsTooltipLayerActive}
        onPick={onPickPosition ? () => onPickPosition(firstPosition + 1) : undefined}
      />
      <MerchandiseDot
        active={Boolean(occupiedPositions[firstPosition + 2])}
        className="absolute bottom-[29%] left-[32%] -translate-x-1/2 translate-y-1/2"
        details={getPositionDetails(positionDetails, firstPosition + 2)}
        highlight={positionHighlights[firstPosition + 2] ?? null}
        onHoverChange={setIsTooltipLayerActive}
        onPick={onPickPosition ? () => onPickPosition(firstPosition + 2) : undefined}
      />
      <MerchandiseDot
        active={Boolean(occupiedPositions[firstPosition + 3])}
        className="absolute bottom-[29%] right-[32%] translate-x-1/2 translate-y-1/2"
        details={getPositionDetails(positionDetails, firstPosition + 3)}
        highlight={positionHighlights[firstPosition + 3] ?? null}
        onHoverChange={setIsTooltipLayerActive}
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
    <div className="absolute inset-x-[5%] bottom-[4%] z-30 h-[35%] bg-slate-50/55">
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
