import { LockKeyhole } from "lucide-react";

type AccessDeniedCardProps = {
  title?: string;
  description?: string;
};

export function AccessDeniedCard({
  title = "当前角色无权访问该页面",
  description = "请使用具备相应权限的账号登录，或在 Supabase 的 profiles 角色配置中调整当前用户权限。",
}: AccessDeniedCardProps) {
  return (
    <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-panel">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-amber-950">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-900">{description}</p>
        </div>
      </div>
    </section>
  );
}
