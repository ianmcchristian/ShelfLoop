// ─── Analysis Page ────────────────────────────────────────────────────────────
// RFID antenna test visualization. Upload a scan CSV to map read/missed tags
// across the 8-box rig. Placement DB is pre-loaded with baked data by default.

import { useCallback, useMemo, useState } from 'react';
import { parsePlacementCsv } from './rfidPlacementParser';
import { parseRunCsv } from './rfidRunParser';
import { matchRun } from './rfidMatcher';
import { TEST_PLACEMENTS, TEST_RUN_META, TEST_RUN_READS } from './rfidTestData';
import type { AnalysisRun, ParseIssue, ResolvedTagPlacement, RunMeta } from './rfidTypes';
import { BoxDetailPanel } from './BoxDetailPanel';
import { RigOverview } from './RigOverview';
import { AnalysisActionsPanel } from './AnalysisActionsPanel';
import { CoverageGauge } from './CoverageGauge';
import type { ScanMeta } from './UploadPanel';
import { UploadPanel } from './UploadPanel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_SCAN_META: ScanMeta = { antennaType: '', angle: '', distance: '', timeout: '' };

function toRunMeta(meta: ScanMeta): RunMeta {
  return { name: '', ...meta };
}

// ─── Issue panel ──────────────────────────────────────────────────────────────

function IssuePanel({ issues, label }: { issues: ParseIssue[]; label: string }) {
  if (issues.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
      <p className="mb-2 text-[0.62rem] font-black uppercase tracking-[0.12em] text-amber-700">
        {label} — {issues.length} issue{issues.length !== 1 ? 's' : ''}
      </p>
      <ul className="space-y-0.5">
        {issues.slice(0, 10).map((issue, i) => (
          <li
            key={i}
            className={`text-xs ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-700'}`}
          >
            {issue.severity === 'error' ? '[error]' : '[warn]'} {issue.message}
          </li>
        ))}
        {issues.length > 10 && (
          <li className="text-xs text-amber-500">...and {issues.length - 10} more</li>
        )}
      </ul>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AnalysisPage() {
  // ── Placement state — pre-loaded with baked data so any scan CSV works immediately
  const [placements, setPlacements] = useState<ResolvedTagPlacement[]>(TEST_PLACEMENTS);
  const [placementIssues, setPlacementIssues] = useState<ParseIssue[]>([]);
  const [placementFileName, setPlacementFileName] = useState<string | null>(null);

  // ── Scan state ─────────────────────────────────────────────────────────────
  const [scanMeta, setScanMeta] = useState<ScanMeta>(EMPTY_SCAN_META);
  const [scanReads, setScanReads] = useState<ReturnType<typeof parseRunCsv>['reads'] | null>(null);
  const [scanIssues, setScanIssues] = useState<ParseIssue[]>([]);
  const [scanFileName, setScanFileName] = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [usingTestData, setUsingTestData] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePlacementFile = useCallback((text: string, name: string) => {
    const result = parsePlacementCsv(text);
    setPlacements(result.placements);
    setPlacementIssues(result.issues);
    setPlacementFileName(name);
    setUsingTestData(false);
  }, []);

  const handleScanFile = useCallback((text: string, name: string) => {
    const result = parseRunCsv(text);
    setScanReads(result.reads);
    setScanIssues(result.issues);
    setScanFileName(name);
    setUsingTestData(false);
  }, []);

  const handleScanMetaChange = useCallback((field: string, value: string) => {
    setScanMeta((m) => ({ ...m, [field]: value }));
  }, []);

  const handleUseTestData = useCallback(() => {
    setPlacements(TEST_PLACEMENTS);
    setPlacementIssues([]);
    setPlacementFileName(null);
    setScanReads(TEST_RUN_READS);
    setScanIssues([]);
    setScanFileName(null);
    setScanMeta({
      antennaType: TEST_RUN_META.antennaType,
      angle: TEST_RUN_META.angle,
      distance: TEST_RUN_META.distance,
      timeout: TEST_RUN_META.timeout,
    });
    setSelectedBox(null);
    setUsingTestData(true);
  }, []);

  const handleReset = useCallback(() => {
    // Reset scan only — keep placements (they're stagnant infrastructure)
    setScanReads(null);
    setScanIssues([]);
    setScanFileName(null);
    setScanMeta(EMPTY_SCAN_META);
    setSelectedBox(null);
    setUsingTestData(false);
  }, []);

  // ── Derived result ─────────────────────────────────────────────────────────

  const activePlacements = usingTestData ? TEST_PLACEMENTS : placements;

  const scanResult: AnalysisRun | null = useMemo(() => {
    const reads = usingTestData ? TEST_RUN_READS : scanReads;
    if (!reads || activePlacements.length === 0) return null;
    return matchRun(
      toRunMeta(
        usingTestData
          ? { antennaType: TEST_RUN_META.antennaType, angle: TEST_RUN_META.angle,
              distance: TEST_RUN_META.distance, timeout: TEST_RUN_META.timeout }
          : scanMeta,
      ),
      reads,
      activePlacements,
    );
  }, [activePlacements, scanMeta, scanReads, usingTestData]);

  // ── Selected box result ────────────────────────────────────────────────────

  const selectedBoxResult =
    selectedBox !== null && scanResult !== null
      ? (scanResult.boxResults.find((b) => b.boxNumber === selectedBox) ?? null)
      : null;

  const hasData = scanResult !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-retail-ink">RFID Analysis</h2>
          <p className="mt-1 text-sm text-slate-500">
            Identify and visualize scan results per antenna configuration and test parameters
            across the 8-box rig.
          </p>
        </div>
        <CoverageGauge
          overallPct={scanResult?.overallCoveragePct ?? null}
          totalRead={scanResult?.totalRead ?? 0}
          totalMissed={scanResult?.totalMissed ?? 0}
          totalUnresolved={scanResult?.totalUnresolved ?? 0}
        />
      </div>

      {/* Upload panel + Actions panel */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <UploadPanel
            scanFileName={scanFileName}
            scanMeta={scanMeta}
            usingTestData={usingTestData}
            onScanFile={handleScanFile}
            onScanMetaChange={handleScanMetaChange}
            onUseTestData={handleUseTestData}
          />
        </div>
        <div className="w-[260px] shrink-0">
          <AnalysisActionsPanel
            placementFileName={placementFileName}
            onReset={handleReset}
            onPlacementFile={handlePlacementFile}
          />
        </div>
      </div>

      {/* Parse issues */}
      <IssuePanel issues={placementIssues} label="Placement database issues" />
      <IssuePanel issues={scanIssues} label="Scan file issues" />

      {/* Main visualization — always rendered, idle animation plays when no data */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <RigOverview
          boxResults={scanResult?.boxResults ?? []}
          selectedBox={selectedBox}
          hasData={hasData}
          onBoxSelect={setSelectedBox}
          onDeselect={() => setSelectedBox(null)}
        />

        <div>
          {selectedBoxResult ? (
            <BoxDetailPanel boxResult={selectedBoxResult} />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div>
                <p className="font-black text-slate-400">
                  {hasData ? 'Select a box' : 'Load scan data above'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {hasData
                    ? 'Click any box in the rig to inspect face-level tag coverage'
                    : 'Upload a scan CSV or use test data — the rig will colour up instantly'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
