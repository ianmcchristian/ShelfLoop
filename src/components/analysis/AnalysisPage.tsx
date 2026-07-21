// ─── Analysis Page ────────────────────────────────────────────────────────────
// RFID antenna test visualization. Upload a scan CSV to map read/missed tags
// across the 8-box rig. Placement DB is pre-loaded with baked data by default.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseRunCsv } from './rfidRunParser';
import { matchRun } from './rfidMatcher';
import { TEST_PLACEMENTS, SCENARIO_A, SCENARIO_B } from './rfidTestData';
import type { AnalysisRun, ParseIssue, ResolvedTagPlacement, RunMeta, RunTagRead, ScanMeta } from './rfidTypes';
import { BoxDetailPanel } from './BoxDetailPanel';
import { RigOverview } from './RigOverview';
import { AnalysisActionsPanel } from './AnalysisActionsPanel';
import { CoverageGauge } from './CoverageGauge';
import { CompareRigLayout } from './CompareRigLayout';
import { ExceptionsPanel } from './ExceptionsPanel';
import { UploadPanel } from './UploadPanel';
import { buildRssiMap } from './rfidColorUtils';

interface AnalysisSearchRequest {
  nonce: number;
  query: string;
}

interface AnalysisPageProps {
  searchRequest: AnalysisSearchRequest | null;
  onSearchEntriesChange: (entries: { value: string; badge: string; subtitle: string }[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_SCAN_META: ScanMeta = { antenna: '', orientation: '', range: '', power: '' };

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

export function AnalysisPage({ searchRequest, onSearchEntriesChange }: AnalysisPageProps) {
  // ── Placement state — pre-loaded with baked data so any scan CSV works immediately
  const [placements, setPlacements] = useState<ResolvedTagPlacement[]>(TEST_PLACEMENTS);
  const [placementIssues, setPlacementIssues] = useState<ParseIssue[]>([]);

  // ── Scan state ─────────────────────────────────────────────────────────────
  const [scanMeta, setScanMeta] = useState<ScanMeta>(EMPTY_SCAN_META);
  const [scanReads, setScanReads] = useState<ReturnType<typeof parseRunCsv>['reads'] | null>(null);
  const [scanIssues, setScanIssues] = useState<ParseIssue[]>([]);
  const [scanFileName, setScanFileName] = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [highlightedTagKey, setHighlightedTagKey] = useState<string | null>(null);
  const [usingTestData, setUsingTestData] = useState(false);
  const [shouldScrollToRig, setShouldScrollToRig] = useState(false);
  const [placementEditorOpen, setPlacementEditorOpen] = useState(false);
  const [isSyncRotating, setIsSyncRotating] = useState(false);
  const [showAntennaGuide, setShowAntennaGuide] = useState(false);
  const [showCompassGuide, setShowCompassGuide] = useState(false);
  const [antennaGuideAngleDeg, setAntennaGuideAngleDeg] = useState<0 | 45>(45);
  const rigSectionRef = useRef<HTMLDivElement>(null);

  // ── Compare state ──────────────────────────────────────────────────────────
  const [compareScanReads, setCompareScanReads] = useState<RunTagRead[] | null>(null);
  const [compareScanFileName, setCompareScanFileName] = useState<string | null>(null);
  const [compareUsingTestData, setCompareUsingTestData] = useState(false);

  // Placement override when a test scenario is loaded — null = use default (TEST_PLACEMENTS)
  const [scenarioPlacements, setScenarioPlacements] = useState<ResolvedTagPlacement[] | null>(null);

  // ── RSSI derived ───────────────────────────────────────────────────────────
  // scanReads is always set (by file upload or handleUseTestData), so no branch needed.
  const activeReads        = useMemo(() => scanReads ?? [],        [scanReads]);
  const compareActiveReads = useMemo(() => compareScanReads ?? [], [compareScanReads]);

  const rssiSuffixMap        = useMemo(() => buildRssiMap(activeReads),         [activeReads]);
  const compareRssiSuffixMap = useMemo(() => buildRssiMap(compareActiveReads), [compareActiveReads]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handlePlacementsChange = useCallback((next: ResolvedTagPlacement[]) => {
    setPlacements(next);
    setPlacementIssues([]);
    setUsingTestData(false);
  }, []);

  const handleScanFile = useCallback((text: string, name: string) => {
    const result = parseRunCsv(text);
    setScanReads(result.reads);
    setScanIssues(result.issues);
    setScanFileName(name);
    setUsingTestData(false);
    setScenarioPlacements(null); // Back to real placement DB when loading a CSV
    setShouldScrollToRig(true);
  }, []);

  const handleScanMetaChange = useCallback((field: keyof ScanMeta, value: string) => {
    setScanMeta((m) => ({ ...m, [field]: value }));
  }, []);

  const handleUseTestData = useCallback((scenario: 'A' | 'B') => {
    const s = scenario === 'A' ? SCENARIO_A : SCENARIO_B;
    setPlacements(TEST_PLACEMENTS);
    setPlacementIssues([]);
    setScanReads(s.reads);
    setScanIssues([]);
    setScanFileName(s.label);
    setScanMeta({
      antenna:     s.meta.antenna     as ScanMeta['antenna'],
      orientation: s.meta.orientation as ScanMeta['orientation'],
      range:       s.meta.range       as ScanMeta['range'],
      power:       s.meta.power       as ScanMeta['power'],
    });
    setScenarioPlacements(s.placements); // Use clean synthetic placement DB
    setSelectedBox(null);
    setHighlightedTagKey(null);
    setUsingTestData(true);
    setShouldScrollToRig(true);
  }, []);

  const handleCompareFile = useCallback((text: string, name: string) => {
    const result = parseRunCsv(text);
    setCompareScanReads(result.reads);
    setCompareScanFileName(name);
    setCompareUsingTestData(false);
  }, []);

  const handleCompareTestData = useCallback((scenario: 'A' | 'B') => {
    const s = scenario === 'A' ? SCENARIO_A : SCENARIO_B;
    setCompareScanReads(s.reads);
    setCompareScanFileName(s.label);
    setCompareUsingTestData(true);
  }, []);

  const handleCompareClear = useCallback(() => {
    setCompareScanReads(null);
    setCompareScanFileName(null);
    setCompareUsingTestData(false);
  }, []);

  const handleReset = useCallback(() => {
    // Reset scan only — keep placements (they're stagnant infrastructure)
    setScanReads(null);
    setScanIssues([]);
    setScanFileName(null);
    setScanMeta(EMPTY_SCAN_META);
    setSelectedBox(null);
    setHighlightedTagKey(null);
    setUsingTestData(false);
    setScenarioPlacements(null);
    // Also clear compare when main scan is reset
    setCompareScanReads(null);
    setCompareScanFileName(null);
    setCompareUsingTestData(false);
  }, []);

  // ── Derived result ─────────────────────────────────────────────────────────

  // scenarioPlacements takes priority when a test scenario is loaded;
  // falls back to the regular placements state (default = TEST_PLACEMENTS).
  const activePlacements = scenarioPlacements ?? placements;

  const scanResult: AnalysisRun | null = useMemo(() => {
    if (!scanReads || activePlacements.length === 0) return null;
    return matchRun(
      toRunMeta(scanMeta),
      scanReads,
      activePlacements,
    );
  }, [activePlacements, scanMeta, scanReads]);

  // ── Selected box result ────────────────────────────────────────────────────

  const selectedBoxResult =
    selectedBox !== null && scanResult !== null
      ? (scanResult.boxResults.find((b) => b.boxNumber === selectedBox) ?? null)
      : null;

  const hasData = scanResult !== null;

  // ── Compare derived ────────────────────────────────────────────────────────
  const compareActive = compareScanReads !== null || compareUsingTestData;

  const compareScanResult = useMemo((): AnalysisRun | null => {
    if (!compareScanReads || activePlacements.length === 0) return null;
    return matchRun(toRunMeta(EMPTY_SCAN_META), compareScanReads, activePlacements);
  }, [compareScanReads, activePlacements]);

  const mainLabel: string | null =
    usingTestData ? 'Test data' : (scanFileName ?? null);

  const compareLabelB: string =
    compareUsingTestData ? 'Test data' : (compareScanFileName ?? 'Side B');

  useEffect(() => {
    const seen = new Set<string>();
    const entries = activePlacements.flatMap((placement) => {
      const value = (placement.fullEpc ?? placement.label).trim();
      if (!value) return [];
      const key = value.toUpperCase();
      if (seen.has(key)) return [];
      seen.add(key);
      return [{
        value,
        badge: `Box ${placement.boxNumber}`,
        subtitle: placement.fullEpc ? `suffix ${placement.label}` : 'unresolved tag label',
      }];
    });
    onSearchEntriesChange(entries);
  }, [activePlacements, onSearchEntriesChange]);

  useEffect(() => {
    if (!searchRequest || !scanResult) return;

    const term = searchRequest.query.trim().toUpperCase();
    if (!term) return;

    const matches = scanResult.boxResults.flatMap((box) =>
      box.faces.flatMap((face) =>
        face.slots.map((slot) => {
          const full = (slot.fullEpc ?? '').toUpperCase();
          const label = slot.label.toUpperCase();
          const suffix = (slot.fullEpc ?? slot.label).slice(-7).toUpperCase();
          let score = -1;

          if (full === term || label === term || suffix === term) score = 5;
          else if (full.endsWith(term) || label.endsWith(term)) score = 4;
          else if (full.startsWith(term) || label.startsWith(term)) score = 3;
          else if (full.includes(term) || label.includes(term)) score = 2;

          return score >= 0
            ? {
                boxNumber: box.boxNumber,
                score,
                tagKey: `${box.boxNumber}-${slot.face}-${slot.position}`,
              }
            : null;
        }),
      ),
    ).filter((match): match is { boxNumber: number; score: number; tagKey: string } => match !== null);

    if (matches.length === 0) return;

    matches.sort((a, b) => b.score - a.score || a.boxNumber - b.boxNumber);
    const nextBox = matches[0]!.boxNumber;
    const nextTagKey = matches[0]!.tagKey;
    const id = window.requestAnimationFrame(() => {
      setSelectedBox(nextBox);
      setHighlightedTagKey(nextTagKey);
      setShouldScrollToRig(true);
    });
    return () => window.cancelAnimationFrame(id);
  }, [scanResult, searchRequest]);

  useEffect(() => {
    if (!shouldScrollToRig || !hasData) return;
    const id = window.requestAnimationFrame(() => {
      rigSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScrollToRig(false);
    });
    return () => window.cancelAnimationFrame(id);
  }, [hasData, shouldScrollToRig]);

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
        {!compareActive && (
          <CoverageGauge
            overallPct={scanResult?.overallCoveragePct ?? null}
            totalRead={scanResult?.totalRead ?? 0}
            totalMissed={scanResult?.totalMissed ?? 0}
            totalUnresolved={scanResult?.totalUnresolved ?? 0}
          />
        )}
      </div>

      {/* Upload panel + Actions panel */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <UploadPanel
            scanFileName={scanFileName}
            scanMeta={scanMeta}
            usingTestData={usingTestData}
            compareFileName={compareScanFileName}
            compareUsingTestData={compareUsingTestData}
            onScanFile={handleScanFile}
            onScanMetaChange={handleScanMetaChange}
            onUseTestData={handleUseTestData}
            onScanClear={handleReset}
            onCompareFile={handleCompareFile}
            onCompareTestData={handleCompareTestData}
            onCompareClear={handleCompareClear}
          />
        </div>
        <div className="w-[260px] shrink-0">
          <AnalysisActionsPanel
            placements={activePlacements}
            editorOpen={placementEditorOpen}
            isSyncRotating={isSyncRotating}
            showAntennaGuide={showAntennaGuide}
            showCompassGuide={showCompassGuide}
            onReset={handleReset}
            onPlacementsChange={handlePlacementsChange}
            onEditorOpenChange={setPlacementEditorOpen}
            onSyncRotatingToggle={() => setIsSyncRotating((v) => !v)}
            onAntennaGuideToggle={() => setShowAntennaGuide((v) => !v)}
            onCompassGuideToggle={() => setShowCompassGuide((v) => !v)}
          />
        </div>
      </div>

      {compareActive ? (
        /* ── Compare mode: two full-width canvases, no BoxDetailPanel ───── */
        <div ref={rigSectionRef}>
          <CompareRigLayout
            scanResultA={scanResult}
            scanResultB={compareScanResult}
            labelA={mainLabel ?? 'Side A'}
            labelB={compareLabelB}
            isSyncRotating={isSyncRotating}
            suppressHtmlLabels={placementEditorOpen}
            showAntennaGuide={showAntennaGuide}
            showCompassGuide={showCompassGuide}
            antennaGuideAngleDeg={antennaGuideAngleDeg}
            onAntennaGuideAngleChange={setAntennaGuideAngleDeg}
            rssiSuffixMapA={rssiSuffixMap}
            rssiSuffixMapB={compareRssiSuffixMap}
          />
        </div>
      ) : (
        /* ── Normal mode: single rig + BoxDetailPanel + Exceptions ──────── */
        <>
          {/* Parse issues */}
          <IssuePanel issues={placementIssues} label="Placement database issues" />
          <IssuePanel issues={scanIssues} label="Scan file issues" />

          <div ref={rigSectionRef} className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <RigOverview
              boxResults={scanResult?.boxResults ?? []}
              selectedBox={selectedBox}
              highlightedTagKey={highlightedTagKey}
              hasData={hasData}
              suppressHtmlLabels={placementEditorOpen}
              showAntennaGuide={showAntennaGuide}
              showCompassGuide={showCompassGuide}
              antennaGuideAngleDeg={antennaGuideAngleDeg}
              onAntennaGuideAngleChange={setAntennaGuideAngleDeg}
              rssiSuffixMap={rssiSuffixMap}
              onBoxSelect={(boxNumber) => {
                setSelectedBox(boxNumber);
                setHighlightedTagKey(null);
              }}
              onDeselect={() => {
                setSelectedBox(null);
                setHighlightedTagKey(null);
              }}
            />

            <div>
              {selectedBoxResult ? (
                <BoxDetailPanel boxResult={selectedBoxResult} rssiSuffixMap={rssiSuffixMap} />
              ) : (
                <div className="flex h-full min-h-[560px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
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

          <ExceptionsPanel
            placements={activePlacements}
            placementIssues={placementIssues}
            scanIssues={scanIssues}
            scanResult={scanResult}
          />
        </>
      )}
    </div>
  );
}
