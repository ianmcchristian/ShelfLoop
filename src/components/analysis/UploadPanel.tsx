// ─── Upload Panel ─────────────────────────────────────────────────────────────
// Two-column layout: scan source picker (left) + antenna config (right).
// Action Menu lives in its own sibling panel — not here.

import { useEffect, useRef, useState } from 'react';
import type { ScanMeta } from './rfidTypes';
import { scanMetaIsComplete } from './rfidTypes';

// ─── Scenario popover ───────────────────────────────────────────────────────
// Tiny dropdown that appears when the user clicks "Load test data ▾".
// Click-outside closes it via a pointerdown listener.

const SCENARIOS: { key: 'A' | 'B'; label: string; detail: string }[] = [
  { key: 'A', label: 'Strong (A)', detail: 'Large · 45° · 3ft · Max'      },
  { key: 'B', label: 'Weak (B)',   detail: 'Medium · 0° · 6ft · Base' },
];

interface ScenarioPopoverProps {
  onSelect: (s: 'A' | 'B') => void;
  onClose: () => void;
}

function ScenarioPopover({ onSelect, onClose }: ScenarioPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
    >
      <p className="mb-1.5 text-[0.58rem] font-black uppercase tracking-[0.12em] text-slate-400">
        Select scenario
      </p>
      {SCENARIOS.map(({ key, label, detail }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className="flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left transition hover:bg-retail-blue-light"
        >
          <span className="text-xs font-black text-slate-700">{label}</span>
          <span className="text-[0.58rem] text-slate-400">{detail}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Compare source picker ────────────────────────────────────────────────────

interface CompareSourceProps {
  hasMainScan: boolean;
  compareFileName: string | null;
  compareUsingTestData: boolean;
  onCompareFile: (text: string, name: string) => void;
  onCompareTestData: (scenario: 'A' | 'B') => void;
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
  const [showPopover, setShowPopover] = useState(false);

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

  const activeLabel = compareUsingTestData ? compareFileName : compareFileName;

  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
      <p className="text-[0.6rem] font-black uppercase tracking-[0.14em] text-slate-400">Compare with</p>

      {activeLabel ? (
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-[0.65rem] font-semibold text-slate-500">
            <span className="mr-1 font-black text-slate-400">Side B:</span>
            {activeLabel}
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
        <div className={`relative flex items-center gap-2 ${!hasMainScan ? 'pointer-events-none opacity-40' : ''}`}>
          <button
            type="button"
            disabled={!hasMainScan}
            className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-black text-slate-500 transition hover:border-retail-blue hover:bg-retail-blue-light hover:text-retail-blue focus:outline-none"
            onClick={() => inputRef.current?.click()}
          >
            Compare CSV
          </button>
          <span className="shrink-0 text-[0.65rem] font-semibold text-slate-400">or</span>
          <button
            type="button"
            disabled={!hasMainScan}
            className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-black text-slate-500 transition hover:border-retail-blue hover:bg-retail-blue-light hover:text-retail-blue focus:outline-none"
            onClick={() => setShowPopover((v) => !v)}
          >
            Load test data ▾
          </button>
          {showPopover && (
            <ScenarioPopover
              onSelect={(s) => { onCompareTestData(s); setShowPopover(false); }}
              onClose={() => setShowPopover(false)}
            />
          )}
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
  onUseTestData: (scenario: 'A' | 'B') => void;
  onScanClear: () => void;
}

function ScanSource({ scanFileName, onScanFile, onUseTestData, onScanClear }: ScanSourceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPopover, setShowPopover] = useState(false);

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

  return (
    <div className="flex flex-col gap-2">
      {scanFileName ? (
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-[0.65rem] font-semibold text-slate-500">
            <span className="mr-1 font-black text-slate-400">Side A:</span>
            {scanFileName}
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
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-black text-slate-500 transition hover:border-retail-blue hover:bg-retail-blue-light hover:text-retail-blue focus:outline-none"
          >
            Load CSV
          </button>
          <span className="shrink-0 text-[0.65rem] font-semibold text-slate-400">or</span>
          <button
            type="button"
            onClick={() => setShowPopover((v) => !v)}
            className="flex-1 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-black text-slate-500 transition hover:border-retail-blue hover:bg-retail-blue-light hover:text-retail-blue focus:outline-none"
          >
            Load test data ▾
          </button>
          {showPopover && (
            <ScenarioPopover
              onSelect={(s) => { onUseTestData(s); setShowPopover(false); }}
              onClose={() => setShowPopover(false)}
            />
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleChange} />
    </div>
  );
}

// ─── Antenna config — option pickers matching Experiment 2 variables ──────────
// ScanMeta type and scanMetaIsComplete() live in rfidTypes.ts (re-exported from there).

// Rows in display order — label maps directly to ScanMeta key.
const CONFIG_ROWS: { label: string; key: keyof ScanMeta; options: readonly string[] }[] = [
  { label: 'Antenna',     key: 'antenna',     options: ['Medium', 'Large'] },
  { label: 'Orientation', key: 'orientation', options: ['0°', '45°']       },
  { label: 'Range',       key: 'range',       options: ['3ft', '6ft']      },
  { label: 'Power',       key: 'power',       options: ['Base', 'Max']     },
];

interface AntennaConfigProps {
  meta: ScanMeta;
  disabled: boolean;
  onChange: (field: keyof ScanMeta, value: string) => void;
}

function AntennaConfig({ meta, disabled, onChange }: AntennaConfigProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {CONFIG_ROWS.map(({ label, key, options }) => {
        const current = meta[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[0.62rem] font-black uppercase tracking-[0.1em] text-slate-400">
              {label}
            </span>
            <div className="flex flex-1 gap-1.5">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  disabled={disabled}
                  aria-pressed={current === opt}
                  onClick={() => onChange(key, current === opt ? '' : opt)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-retail-blue/35 disabled:cursor-not-allowed disabled:opacity-40 ${
                    current === opt
                      ? 'bg-retail-blue text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-500 hover:border-retail-blue hover:text-retail-blue'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Completion indicator — shows which fields still need a selection */}
      {!disabled && (
        <p className="text-[0.58rem] font-semibold text-slate-400">
          {scanMetaIsComplete(meta)
            ? '✓ Config complete — ready for export'
            : `${Object.values(meta).filter((v) => v === '').length} field${
                Object.values(meta).filter((v) => v === '').length !== 1 ? 's' : ''
              } unset`}
        </p>
      )}
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
  onScanMetaChange: (field: keyof ScanMeta, value: string) => void;
  onUseTestData: (scenario: 'A' | 'B') => void;
  onScanClear: () => void;
  onCompareFile: (text: string, name: string) => void;
  onCompareTestData: (scenario: 'A' | 'B') => void;
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
            meta={scanMeta}
            disabled={usingTestData}
            onChange={onScanMetaChange}
          />
        </div>

      </div>
    </div>
  );
}
