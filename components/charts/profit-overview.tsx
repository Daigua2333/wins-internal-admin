import { monthlyProfit } from "@/lib/mock/data";

type ProfitPoint = {
  label: string;
  revenue: number;
  cost: number;
};

type ProfitOverviewProps = {
  data?: ProfitPoint[];
};

export function ProfitOverview({ data = monthlyProfit }: ProfitOverviewProps) {
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {data.map((item) => (
        <div key={item.label} className="rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,rgba(248,250,252,0.92))] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
              {item.revenue - item.cost}M
            </span>
          </div>
          <div className="flex h-40 items-end gap-2 rounded-[1.25rem] bg-slate-50/90 p-3">
            <div
              className="w-full rounded-t-2xl bg-[linear-gradient(180deg,#0891b2,#0f766e)] shadow-sm"
              style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
            />
            <div
              className="w-full rounded-t-2xl bg-[linear-gradient(180deg,#f59e0b,#d97706)] shadow-sm"
              style={{ height: `${(item.cost / maxRevenue) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-400">
            <span>Revenue</span>
            <span>Cost</span>
          </div>
        </div>
      ))}
    </div>
  );
}
