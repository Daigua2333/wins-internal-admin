import { SectionCard } from "@/components/ui/section-card";

export function SetupNextStepsCard() {
  return (
    <SectionCard
      title="真实接入下一步"
      description="如果你准备把当前后台从预览模式切到真实 Supabase，这里是最短路径。"
    >
      <div className="space-y-3">
        {[
          "1. 在 Supabase SQL Editor 依次执行 `supabase/schema.sql` 和 `supabase/seed.sql`。",
          "2. 在项目根目录创建 `.env.local`，填入 URL 与 Publishable Key。",
          "3. 重启本地开发服务器。",
          "4. 回到登录页确认按钮已切换为“登录并进入后台”。",
          "5. 用 Supabase Auth 测试账号登录，并检查 Dashboard / 订单 / 客户等页面是否读取真实数据。",
        ].map((text) => (
          <div key={text} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            {text}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
