// ─── Compare Rig Layout ───────────────────────────────────────────────────────
// Two Rig3DCanvas instances side by side with independent (or synced) selection
// and rotation. No BoxDetailPanel — horizontal space is maximised for visuals.

import { useRef, useState } from 'react';
import { Rig3DCanvas } from './Rig3DCanvas';
import type { SyncCameraState } from './Rig3DCanvas';
import type { AnalysisRun } from './rfidTypes';

const COMPARE_CANVAS_HEIGHT = 460;

// ─── Single side pane ────────────────────────────────────────────────────────

interface RigPaneProps {
  side: 'A' | 'B';
  label: string;
  selectedBox: number | null;
  scanResult: AnalysisRun | null;
  suppressHtmlLabels: boolean;
  showAntennaGuide: boolean;
  rssiSuffixMap: Map<string, number>;
  isSyncActive: boolean;
  syncStateRef: React.MutableRefObject<SyncCameraState | null>;
  lastActiveSideRef: React.MutableRefObject<'A' | 'B' | null>;
  onBoxSelect: (n: number) => void;
  onDeselect: () => void;
}

function RigPane({
  side, label, selectedBox, scanResult, suppressHtmlLabels, showAntennaGuide, rssiSuffixMap,
  isSyncActive, syncStateRef, lastActiveSideRef, onBoxSelect, onDeselect,
}: RigPaneProps) {
  const hasData = scanResult !== null;
  const isA     = side === 'A';
  const accent  = isA ? 'bg-amber-400'   : 'bg-retail-blue';
  const textClr = isA ? 'text-amber-500' : 'text-retail-blue';

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.14em] text-white ${accent}`}>
            {side}
          </span>
          <span className="truncate text-sm font-bold text-retail-ink">{label}</span>
        </div>
        {hasData ? (
          <div className="shrink-0 flex items-baseline gap-1">
            <span className={`text-xl font-black ${textClr}`}>{scanResult.overallCoveragePct}%</span>
            <span className="text-[0.65rem] font-semibold text-slate-400">coverage</span>
          </div>
        ) : (
          <span className="text-xs font-semibold text-slate-400">No data</span>
        )}
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────────── */}
      <Rig3DCanvas
        boxResults={scanResult?.boxResults ?? []}
        selectedBox={selectedBox}
        highlightedTagKey={null}
        hasData={hasData}
        canvasHeight={COMPARE_CANVAS_HEIGHT}
        suppressHtmlLabels={suppressHtmlLabels}
        showAntennaGuide={showAntennaGuide}
        rssiSuffixMap={rssiSuffixMap}
        isSyncActive={isSyncActive}
        syncSide={side}
        syncStateRef={syncStateRef}
        lastActiveSideRef={lastActiveSideRef}
        onBoxSelect={onBoxSelect}
        onDeselect={onDeselect}
      />

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      {hasData && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Read',       value: scanResult.totalRead,       color: 'text-emerald-700 bg-emerald-50  border-emerald-200' },
            { label: 'Missed',     value: scanResult.totalMissed,     color: 'text-red-700     bg-red-50      border-red-200'     },
            { label: 'Unresolved', value: scanResult.totalUnresolved, color: 'text-slate-600   bg-slate-100   border-slate-200'   },
          ].map(({ label: lbl, value, color }) => (
            <div key={lbl} className={`rounded-lg border px-2 py-1.5 ${color}`}>
              <p className="text-base font-black">{value}</p>
              <p className="text-[0.58rem] font-black uppercase tracking-[0.1em] opacity-75">{lbl}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface CompareRigLayoutProps {
  scanResultA: AnalysisRun | null;
  scanResultB: AnalysisRun | null;
  labelA: string;
  labelB: string;
  isSyncRotating: boolean;
  suppressHtmlLabels: boolean;
  showAntennaGuide: boolean;
  rssiSuffixMapA: Map<string, number>;
  rssiSuffixMapB: Map<string, number>;
}

export function CompareRigLayout({
  scanResultA,
  scanResultB,
  labelA,
  labelB,
  isSyncRotating,
  suppressHtmlLabels,
  showAntennaGuide,
  rssiSuffixMapA,
  rssiSuffixMapB,
}: CompareRigLayoutProps) {
  // ── Box selection — lifted so sync can mirror across sides ────────────────
  const [selectedBoxA, setSelectedBoxA] = useState<number | null>(null);
  const [selectedBoxB, setSelectedBoxB] = useState<number | null>(null);

  const handleSelectA = (n: number) => {
    setSelectedBoxA(n);
    if (isSyncRotating) setSelectedBoxB(n);
  };
  const handleDeselectA = () => {
    setSelectedBoxA(null);
    if (isSyncRotating) setSelectedBoxB(null);
  };
  const handleSelectB = (n: number) => {
    setSelectedBoxB(n);
    if (isSyncRotating) setSelectedBoxA(n);
  };
  const handleDeselectB = () => {
    setSelectedBoxB(null);
    if (isSyncRotating) setSelectedBoxA(null);
  };

  // ── Shared camera sync refs ───────────────────────────────────────────────
  // Mutable — mutations don't cause re-renders, which is exactly what we want
  const syncStateRef      = useRef<SyncCameraState | null>(null);
  const lastActiveSideRef = useRef<'A' | 'B' | null>(null);

  return (
    <div className="grid grid-cols-2 gap-6">
      <RigPane
        side="A"
        label={labelA}
        selectedBox={selectedBoxA}
        scanResult={scanResultA}
        suppressHtmlLabels={suppressHtmlLabels}
        showAntennaGuide={showAntennaGuide}
        rssiSuffixMap={rssiSuffixMapA}
        isSyncActive={isSyncRotating}
        syncStateRef={syncStateRef}
        lastActiveSideRef={lastActiveSideRef}
        onBoxSelect={handleSelectA}
        onDeselect={handleDeselectA}
      />
      <RigPane
        side="B"
        label={labelB}
        selectedBox={selectedBoxB}
        scanResult={scanResultB}
        suppressHtmlLabels={suppressHtmlLabels}
        showAntennaGuide={showAntennaGuide}
        rssiSuffixMap={rssiSuffixMapB}
        isSyncActive={isSyncRotating}
        syncStateRef={syncStateRef}
        lastActiveSideRef={lastActiveSideRef}
        onBoxSelect={handleSelectB}
        onDeselect={handleDeselectB}
      />
    </div>
  );
}
