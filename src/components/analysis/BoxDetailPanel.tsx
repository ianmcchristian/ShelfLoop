// ─── Box Detail Panel ─────────────────────────────────────────────────────────
// Shows all 6 faces of a selected box in a flattened cross layout.
// Each face shows 4 tag slots (TL/TR/BL/BR) coloured by read state.

import type { BoxResult, FaceResult, FacePosition, TagReadState } from './rfidTypes';
import { BOX_FACES } from './rfidTypes';
import { rssiToHex, rssiToPct, RSSI_MISSED_COLOR } from './rfidColorUtils';

// ─── Slot dot ────────────────────────────────────────────────────────────────

const STATE_CLASSES: Record<TagReadState, string> = {
  read: 'bg-emerald-500 ring-emerald-600',
  missed: 'bg-red-400 ring-red-500',
  unresolved: 'bg-slate-300 ring-slate-400',
};

const STATE_LABEL: Record<TagReadState, string> = {
  read: 'Read',
  missed: 'Missed',
  unresolved: 'Unresolved',
};

function TagDot({
  state, label, position, rssiColor, rssiPct,
}: {
  state: TagReadState;
  label: string;
  position: FacePosition;
  rssiColor?: string; // RSSI gradient hex — defined when read + RSSI data available
  rssiPct?: number;
}) {
  // Missed / unresolved: always gray. Gray = nothing here.
  // Read + RSSI data:    gradient colour. Read + no data: static green fallback.
  const isMissed = state !== 'read';

  const inlineStyle = isMissed
    ? { backgroundColor: RSSI_MISSED_COLOR, outlineColor: RSSI_MISSED_COLOR }
    : rssiColor
      ? { backgroundColor: rssiColor, outlineColor: rssiColor }
      : undefined;

  const tooltip = isMissed
    ? STATE_LABEL[state]
    : rssiPct !== undefined
      ? `Signal ${rssiPct}%`
      : STATE_LABEL[state];

  return (
    <div className="group relative flex items-center justify-center">
      <div
        className={`h-5 w-5 rounded-full ring-2 ring-offset-1 transition-transform group-hover:scale-125 ${
          isMissed || rssiColor ? 'ring-white/40' : STATE_CLASSES[state]
        }`}
        style={inlineStyle}
        title={`${position}: ${label || 'no label'} — ${tooltip}`}
      />
    </div>
  );
}

// ─── Single face card ─────────────────────────────────────────────────────────

function FaceCard({ result, rssiSuffixMap }: {
  result: FaceResult | null;
  faceName: string;
  rssiSuffixMap: Map<string, number>;
}) {
  if (!result) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
        <p className="text-[0.55rem] font-black uppercase tracking-[0.12em] text-slate-300">—</p>
        <div className="grid grid-cols-2 gap-1.5 opacity-20">
          {(['TL', 'TR', 'BL', 'BR'] as FacePosition[]).map((pos) => (
            <div key={pos} className="h-5 w-5 rounded-full bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const eligible = result.readCount + result.missCount;
  const coverageLabel = eligible > 0 ? `${result.coveragePct}%` : 'N/A';

  const slotByPos = Object.fromEntries(result.slots.map((s) => [s.position, s]));

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-1.5">
        {(['TL', 'TR', 'BL', 'BR'] as FacePosition[]).map((pos) => {
          const slot = slotByPos[pos];
          if (!slot) return <div key={pos} className="h-5 w-5 rounded-full bg-slate-100 ring-2 ring-slate-200 ring-offset-1" />;
          const lookupKey = (slot.fullEpc ?? slot.label).slice(-7).toUpperCase();
          const rssiDbm   = slot.state === 'read' ? (rssiSuffixMap.get(lookupKey) ?? undefined) : undefined;
          return (
            <TagDot
              key={pos}
              state={slot.state}
              label={slot.label}
              position={pos}
              rssiColor={rssiDbm !== undefined ? rssiToHex(rssiDbm) : undefined}
              rssiPct={rssiDbm !== undefined ? rssiToPct(rssiDbm) : undefined}
            />
          );
        })}
      </div>
      <span
        className={`mt-0.5 text-[0.55rem] font-black tabular-nums ${
          result.coveragePct === 100
            ? 'text-emerald-600'
            : result.coveragePct >= 50
              ? 'text-amber-600'
              : 'text-red-500'
        }`}
      >
        {coverageLabel}
      </span>
    </div>
  );
}

// ─── Cross layout ─────────────────────────────────────────────────────────────
// Visual unfolded net of a box:
//
//         [ Top  ]
//  [Left] [Front] [Right] [Back]
//         [Bottom]

interface CrossLayoutProps {
  faceMap: Record<string, FaceResult>;
  rssiSuffixMap: Map<string, number>;
}

function CrossLayout({ faceMap, rssiSuffixMap }: CrossLayoutProps) {
  const FaceLabel = ({ name }: { name: string }) => (
    <p className="mb-1 text-center text-[0.55rem] font-black uppercase tracking-[0.1em] text-slate-400">
      {name}
    </p>
  );

  const face = (name: string) => (
    <div key={name}>
      <FaceLabel name={name} />
      <FaceCard result={faceMap[name] ?? null} faceName={name} rssiSuffixMap={rssiSuffixMap} />
    </div>
  );

  return (
    <div className="inline-grid w-full grid-cols-4 gap-2">
      {/* Row 1: empty / Top / empty / empty */}
      <div />
      {face('Top')}
      <div />
      <div />
      {/* Row 2: Left / Front / Right / Back */}
      {face('Left')}
      {face('Front')}
      {face('Right')}
      {face('Back')}
      {/* Row 3: empty / Bottom / empty / empty */}
      <div />
      {face('Bottom')}
      <div />
      <div />
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend({ hasRssiData }: { hasRssiData: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-[#16a34a] ring-1 ring-emerald-600 ring-offset-1" />
        Strong signal
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-[#ef4444] ring-1 ring-red-500 ring-offset-1" />
        Marginal
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-full bg-slate-400 ring-1 ring-slate-400 ring-offset-1" />
        Not read
      </div>
      <span className="text-slate-400">
        {hasRssiData ? '· hover a dot for signal %' : '· load a data CSV for signal strength'}
      </span>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface BoxDetailPanelProps {
  boxResult: BoxResult;
  rssiSuffixMap: Map<string, number>;
}

export function BoxDetailPanel({ boxResult, rssiSuffixMap }: BoxDetailPanelProps) {
  const faceMap     = Object.fromEntries(boxResult.faces.map((f) => [f.face, f]));
  const hasRssiData = rssiSuffixMap.size > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-retail-ink">Box {boxResult.boxNumber}</h3>
          <p className="text-xs text-slate-500">
            {boxResult.readCount} read &middot; {boxResult.missCount} missed
            {boxResult.unresolvedCount > 0 && ` · ${boxResult.unresolvedCount} unresolved`}
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-3xl font-black tabular-nums ${
              boxResult.coveragePct === 100
                ? 'text-emerald-600'
                : boxResult.coveragePct >= 60
                  ? 'text-amber-600'
                  : 'text-red-500'
            }`}
          >
            {boxResult.coveragePct}%
          </span>
          <span className="text-xs font-semibold text-slate-400">coverage</span>
        </div>
      </div>

      {/* Box net */}
      <CrossLayout faceMap={faceMap} rssiSuffixMap={rssiSuffixMap} />

      <div className="mt-4">
        <Legend hasRssiData={hasRssiData} />
      </div>

      {/* Per-face breakdown table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[0.6rem] font-black uppercase tracking-[0.1em] text-slate-400">
              <th className="px-3 py-2 text-left">Face</th>
              <th className="px-3 py-2 text-right">Read</th>
              <th className="px-3 py-2 text-right">Missed</th>
              <th className="px-3 py-2 text-right">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {BOX_FACES.map((face) => {
              const f = faceMap[face];
              if (!f) return null;
              return (
                <tr key={face} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-1.5 font-semibold text-slate-700">{face}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-emerald-600">{f.readCount}</td>
                  <td className="px-3 py-1.5 text-right font-semibold text-red-400">{f.missCount}</td>
                  <td className="px-3 py-1.5 text-right font-black">
                    <span
                      className={
                        f.coveragePct === 100
                          ? 'text-emerald-600'
                          : f.coveragePct >= 50
                            ? 'text-amber-600'
                            : 'text-red-500'
                      }
                    >
                      {f.coveragePct > 0 || f.readCount + f.missCount > 0 ? `${f.coveragePct}%` : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
