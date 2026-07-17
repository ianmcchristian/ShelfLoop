// ─── Upload Panel ─────────────────────────────────────────────────────────────
// Two-column layout: scan source picker (left) + antenna config (right).
// Action Menu lives in its own sibling panel — not here.

import { useRef } from 'react';

// ─── Compare source picker ────────────────────────────────────────────────────

interface CompareSourceProps {
  hasMainScan: boolean;
  compareFileName: string | null;
  compareUsingTestData: boolean;
  onCompareFile: (text: string, name: string) => void;
  onCompareTestData: () => void;
  onCompareClear: () => void;
}

function CompareSource({
  hasMainScan,
  compareFileName,
  compareUsingTestData,
  onCompareFile,
  onCompareTestData,
  onCompareClear,
}: CompareSourceProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') onCompareFile(text, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const activeCompareLabel = compareUsingTestData ? 'demo-scan.csv (test)' : compareFileName;

  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
      <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-slate-400">Compare with</p>

      {activeCompareLabel ? (
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-[0.65rem] font-semibold text-slate-500">
            <span className="mr-1 font-black text-slate-400">Side B:</span>
            {activeCompareLabel}
          </p>
          <button
            type="button"
            onClick={onCompareClear}
            className="shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.1em] text-slate-400 transition hover:bg-slate-100 hover:text-retail-ink"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className={`flex gap-2 ${!hasMainScan ? 'pointer-events-none opacity-40' : ''}`}>
          <button
            type="button"
            disabled={!hasMainScan}
            className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-black text-slate-500 transition hover:border-retail-blue hover:bg-retail-blue-light hover:text-retail-blue focus:outline-none"
            onClick={() => inputRef.current?.click()}
          >
            Compare CSV
          </button>
          <button
            type="button"
            disabled={!hasMainScan}
            className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-black text-slate-500 transition hover:border-retail-blue hover:bg-retail-blue-light hover:text-retail-blue focus:outline-none"
            onClick={onCompareTestData}
          >
            Test data
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
    </div>
  );
}

// ─── Scan source picker ───────────────────────────────────────────────────────

interface ScanSourceProps {
  scanFileName: string | null;
  usingTestData: boolean;
  onScanFile: (text: string, name: string) => void;
  onUseTestData: () => void;
  onScanClear: () => void;
}

function ScanSource({ scanFileName, usingTestData, onScanFile, onUseTestData, onScanClear }: ScanSourceProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') onScanFile(text, file.name);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const activeLabel = usingTestData ? 'demo-scan.csv (test)' : scanFileName;

  return (
    <div className="flex flex-col gap-2">
      {activeLabel ? (
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-[0.65rem] font-semibold text-slate-500">
            <span className="mr-1 font-black text-slate-400">Side A:</span>
            {activeLabel}
          </p>
          <button
            type="button"
            onClick={onScanClear}
            className="shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.1em] text-slate-400 transition hover:bg-slate-100 hover:text-retail-ink"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-black text-slate-500 transition hover:border-retail-blue hover:bg-retail-blue-light hover:text-retail-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35"
          >
            Load CSV file
          </button>
          <button
            type="button"
            onClick={onUseTestData}
            className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-black text-slate-500 transition hover:border-retail-blue hover:bg-retail-blue-light hover:text-retail-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35"
          >
            Load test data
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
    </div>
  );
}

// ─── Antenna config — single-column label + input rows ───────────────────────

export interface ScanMeta {
  antennaType: string;
  angle: string;
  distance: string;
  timeout: string;
}

interface AntennaConfigProps extends ScanMeta {
  disabled: boolean;
  onChange: (field: string, value: string) => void;
}

function AntennaConfig({ antennaType, angle, distance, timeout, disabled, onChange }: AntennaConfigProps) {
  const row = (label: string, key: string, value: string, placeholder: string) => (
    <div key={key} className="flex items-center gap-3">
      <label className="w-24 shrink-0 text-[0.62rem] font-black uppercase tracking-[0.1em] text-slate-400">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-retail-ink outline-none placeholder:text-slate-400 focus:border-retail-blue focus:ring-1 focus:ring-retail-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
        onChange={(e) => onChange(key, e.target.value)}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-2.5">
      {row('Antenna type', 'antennaType', antennaType, 'e.g. 9dBi Directional')}
      {row('Angle', 'angle', angle, 'e.g. 45 deg')}
      {row('Distance', 'distance', distance, 'e.g. 6 ft')}
      {row('Timeout', 'timeout', timeout, 'e.g. 5s')}
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface UploadPanelProps {
  scanFileName: string | null;
  scanMeta: ScanMeta;
  usingTestData: boolean;
  compareFileName: string | null;
  compareUsingTestData: boolean;
  onScanFile: (text: string, name: string) => void;
  onScanMetaChange: (field: string, value: string) => void;
  onUseTestData: () => void;
  onScanClear: () => void;
  onCompareFile: (text: string, name: string) => void;
  onCompareTestData: () => void;
  onCompareClear: () => void;
}

export function UploadPanel({
  scanFileName,
  scanMeta,
  usingTestData,
  compareFileName,
  compareUsingTestData,
  onScanFile,
  onScanMetaChange,
  onUseTestData,
  onScanClear,
  onCompareFile,
  onCompareTestData,
  onCompareClear,
}: UploadPanelProps) {
  const hasMainScan = usingTestData || scanFileName !== null;
  return (
    <div className="panel p-5">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

        {/* Left — scan source + compare */}
        <div className="flex flex-col gap-4">
          <h2 className="eyebrow">Data inputs</h2>
          <ScanSource
            scanFileName={scanFileName}
            usingTestData={usingTestData}
            onScanFile={onScanFile}
            onUseTestData={onUseTestData}
            onScanClear={onScanClear}
          />
          <CompareSource
            hasMainScan={hasMainScan}
            compareFileName={compareFileName}
            compareUsingTestData={compareUsingTestData}
            onCompareFile={onCompareFile}
            onCompareTestData={onCompareTestData}
            onCompareClear={onCompareClear}
          />
        </div>

        {/* Right — antenna config */}
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <h2 className="eyebrow">Antenna configuration</h2>
          <AntennaConfig
            {...scanMeta}
            disabled={usingTestData}
            onChange={onScanMetaChange}
          />
        </div>

      </div>
    </div>
  );
}
