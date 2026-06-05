import { cn } from "@/lib/utils/cn";

const toneMap = {
  success: "bg-emerald-50/90 text-emerald-700 ring-emerald-200/80 shadow-sm",
  warning: "bg-amber-50/90 text-amber-700 ring-amber-200/80 shadow-sm",
  neutral: "bg-slate-100/90 text-slate-700 ring-slate-200/80 shadow-sm",
  info: "bg-cyan-50/90 text-cyan-700 ring-cyan-200/80 shadow-sm",
};

type BadgeProps = {
  label: string;
  tone?: keyof typeof toneMap;
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <span className={cn("inline-flex max-w-full min-w-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset backdrop-blur", toneMap[tone])}>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
