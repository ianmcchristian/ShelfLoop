// ─── Rig Overview ─────────────────────────────────────────────────────────────
// 3D interactive rig — always rendered. Idle animation plays when no data.

import type { BoxResult } from './rfidTypes';
import { Rig3DCanvas } from './Rig3DCanvas';

export interface RigOverviewProps {
  boxResults:  BoxResult[];
  selectedBox: number | null;
  hasData:     boolean;
  onBoxSelect: (n: number) => void;
  onDeselect:  () => void;
}

export function RigOverview({ boxResults, selectedBox, hasData, onBoxSelect, onDeselect }: RigOverviewProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">
          Scan Zone
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-[#ef4444]" />
            <span className="text-[0.6rem] font-semibold text-slate-400">&lt;85% reads</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-[#22c55e]" />
            <span className="text-[0.6rem] font-semibold text-slate-400">≥85% reads</span>
          </div>
        </div>
      </div>
      <Rig3DCanvas
        boxResults={boxResults}
        selectedBox={selectedBox}
        hasData={hasData}
        onBoxSelect={onBoxSelect}
        onDeselect={onDeselect}
      />
    </div>
  );
}
