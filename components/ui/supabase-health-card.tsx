import { SectionCard } from "@/components/ui/section-card";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type HealthState = {
  title: string;
  description: string;
  tone: "green" | "amber" | "slate";
};

export async function SupabaseHealthCard() {
  const state = await getHealthState();

  const toneClass =
    state.tone === "green"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : state.tone === "amber"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <SectionCard title="连接健康检查" description="用于确认当前是预览模式、已配置未登录，还是已进入真实 Supabase 会话。">
      <div className={`rounded-2xl border px-4 py-4 ${toneClass}`}>
        <p className="text-sm font-medium">{state.title}</p>
        <p className="mt-2 text-sm leading-6">{state.description}</p>
      </div>
    </SectionCard>
  );
}

async function getHealthState(): Promise<HealthState> {
  if (!isSupabaseConfigured()) {
    return {
      title: "预览模式运行中",
      description: "尚未检测到有效的 Supabase 环境变量。当前页面仍会使用本地 mock fallback。",
      tone: "slate",
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        title: "Supabase 已配置，等待登录验证",
        description: "环境变量已生效，但当前请求没有有效登录用户。配置完成后请从登录页用真实账号登录。",
        tone: "amber",
      };
    }

    return {
      title: "Supabase 会话已生效",
      description: `当前已检测到真实登录用户：${user.email ?? "unknown user"}。后续页面将优先尝试读取真实数据。`,
      tone: "green",
    };
  } catch {
    return {
      title: "Supabase 已配置，但当前无法完成会话检查",
      description: "请确认环境变量、项目状态与本地开发服务是否已正确重启，然后再次刷新页面。",
      tone: "amber",
    };
  }
}
