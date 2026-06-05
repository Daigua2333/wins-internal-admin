import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Stat } from "@/lib/mock/data";

const toneToBadge = {
  positive: "success",
  warning: "warning",
  neutral: "neutral",
} as const;

export function StatCard({ title, value, change, tone, href }: Stat) {
  const content = (
    <div className="panel-hover group relative overflow-hidden rounded-3xl border border-white/70 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] backdrop-blur transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_22px_44px_rgba(15,23,42,0.1)]">
      <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-full bg-cyan-100/40 blur-2xl" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <Badge label={change} tone={toneToBadge[tone]} />
      </div>
      {href ? (
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-cyan-700 opacity-0 transition group-hover:opacity-100">
          点击进入模块
        </p>
      ) : null}
      <div className={cn("mt-6 h-2.5 rounded-full", tone === "warning" ? "bg-amber-100" : "bg-cyan-100")}>
        <div
          className={cn(
            "h-2.5 rounded-full shadow-sm",
            tone === "warning" ? "w-1/2 bg-amber-500" : tone === "neutral" ? "w-2/5 bg-slate-500" : "w-4/5 bg-cyan-600",
          )}
        />
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2">
      {content}
    </Link>
  );
}
