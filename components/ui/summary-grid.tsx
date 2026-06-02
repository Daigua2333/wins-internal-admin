type SummaryItem = {
  title: string;
  value: string;
  detail: string;
};

type SummaryGridProps = {
  items: SummaryItem[];
};

export function SummaryGrid({ items }: SummaryGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="panel-hover relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,#fff,rgba(248,250,252,0.92))] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full bg-cyan-100/45 blur-2xl" />
          <p className="text-sm text-slate-500">{item.title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{item.value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
        </div>
      ))}
    </section>
  );
}
