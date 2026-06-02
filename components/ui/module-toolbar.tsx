import { Plus, SlidersHorizontal } from "lucide-react";

type ModuleToolbarProps = {
  searchPlaceholder: string;
  filters: string[];
  primaryAction: string;
  canCreate?: boolean;
  readOnlyHint?: string;
};

export function ModuleToolbar({
  searchPlaceholder,
  filters,
  primaryAction,
  canCreate = true,
  readOnlyHint = "当前角色为只读模式",
}: ModuleToolbarProps) {
  return (
    <section className="glass-panel rounded-[1.75rem] p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-h-12 flex-1 items-center rounded-2xl border border-slate-200/90 bg-white/80 px-4 text-sm text-slate-500 shadow-sm">
            {searchPlaceholder}
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="rounded-full border border-slate-200/90 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700"
              >
                {filter}
              </button>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700"
            >
              <SlidersHorizontal className="h-4 w-4" />
              更多筛选
            </button>
          </div>
        </div>

        {canCreate ? (
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15">
            <Plus className="h-4 w-4" />
            {primaryAction}
          </button>
        ) : (
          <div className="inline-flex h-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/90 px-5 text-sm font-medium text-amber-800 shadow-sm">
            {readOnlyHint}
          </div>
        )}
      </div>
    </section>
  );
}
