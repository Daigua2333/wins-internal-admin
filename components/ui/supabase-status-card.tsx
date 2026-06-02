import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SectionCard } from "@/components/ui/section-card";

export function SupabaseStatusCard() {
  const enabled = isSupabaseConfigured();

  return (
    <SectionCard
      title="Supabase 状态"
      description="用于快速确认当前后台运行在预览模式，还是已经切到真实 Auth / 数据读取模式。"
    >
      <div className="space-y-4">
        <div className={`rounded-2xl px-4 py-4 ${enabled ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          <p className="text-sm font-medium">{enabled ? "已启用真实 Supabase 模式" : "当前仍是本地预览模式"}</p>
          <p className="mt-2 text-sm leading-6">
            {enabled
              ? "环境变量已配置，登录、会话校验和部分数据读取会优先走真实 Supabase。"
              : "尚未检测到有效的 Supabase 环境变量，因此登录与数据读取仍会优先使用本地 fallback。"}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">NEXT_PUBLIC_SUPABASE_URL</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{enabled ? "已配置" : "未配置"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{enabled ? "已配置" : "未配置"}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-4 text-sm leading-6 text-cyan-900">
          接入说明请查看项目文档 `docs/setup-supabase.md`。
        </div>
      </div>
    </SectionCard>
  );
}
