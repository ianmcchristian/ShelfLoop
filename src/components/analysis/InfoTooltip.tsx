interface InfoTooltipProps {
  label: string;
  text: string;
}

export function InfoTooltip({ label, text }: InfoTooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex items-center gap-1">
      <span>{label}</span>
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[0.62rem] font-black text-slate-400">
        ?
      </span>
      <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-56 rounded-lg bg-slate-900 px-2.5 py-2 text-[0.68rem] font-medium leading-snug text-white shadow-lg group-hover/tooltip:block">
        {text}
      </span>
    </span>
  );
}
