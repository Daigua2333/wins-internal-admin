type StatStripItem = {
  label: string;
  value: string;
  accent?: string;
};

type StatStripProps = {
  items: StatStripItem[];
  columnsClassName?: string;
};

export function StatStrip({ items, columnsClassName = "md:grid-cols-3" }: StatStripProps) {
  return (
    <div className={`grid gap-3 ${columnsClassName}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white/78 px-4 py-3">
          <p className={`text-xs uppercase tracking-[0.18em] ${item.accent ?? "text-slate-500"}`}>{item.label}</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
