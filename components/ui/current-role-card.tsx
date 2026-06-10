import { getRoleModuleLevel, PERMISSION_GROUPS, ROLE_DEFINITIONS } from "@/lib/auth/roles";
import { getCurrentProfile, getCurrentUser, hasPermission } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";

export async function CurrentRoleCard() {
  const [user, profile, canWriteOrders, canReadProfit] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    hasPermission("orders.write"),
    hasPermission("profit.read"),
  ]);

  return (
    <SectionCard title="我的访问权限" description="查看当前账号的岗位职责和实际可用模块，方便判断是否需要管理员调整角色。">
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-3xl bg-[linear-gradient(135deg,#0f172a,#134e4a)] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">Current User</p>
            <p className="mt-3 break-all text-lg font-semibold tracking-tight">{user?.email ?? "未登录"}</p>
            <p className="mt-2 text-sm text-cyan-50/80">
              {profile ? ROLE_DEFINITIONS[profile.role].description : "尚未建立 profiles 角色档案"}
            </p>
            {profile ? <div className="mt-4"><Badge label={ROLE_DEFINITIONS[profile.role].label} tone="warning" /></div> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">订单操作</p>
              <p className="mt-2 text-base font-medium text-slate-900">{canWriteOrders ? "可创建和编辑订单" : "仅查看或无权限"}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">利润数据</p>
              <p className="mt-2 text-base font-medium text-slate-900">{canReadProfit ? "可查看利润数据" : "不可查看敏感利润"}</p>
            </div>
            {profile ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <p className="text-sm text-slate-500">核心职责</p>
                <p className="mt-2 text-base font-medium text-slate-900">{ROLE_DEFINITIONS[profile.role].responsibility}</p>
              </div>
            ) : null}
          </div>
        </div>

        {profile ? (
          <div className="rounded-3xl border border-dashed border-cyan-200 bg-cyan-50/70 p-4">
            <p className="text-sm font-medium text-cyan-900">当前账号可用模块</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PERMISSION_GROUPS.flatMap((group) => group.modules)
                .map((module) => ({ module, level: getRoleModuleLevel(profile.role, module) }))
                .filter(({ level }) => level !== "none")
                .map(({ module, level }) => (
                  <span key={module.key} className="rounded-full bg-white px-3 py-1 text-xs text-cyan-900 ring-1 ring-cyan-200">
                    {module.label} · {level === "manage" ? "管理" : level === "write" ? "编辑" : "只读"}
                  </span>
                ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            当前登录用户还没有 `profiles` 记录。通常在首次成功登录后会自动创建；如果没有创建，请重新登录一次，或检查 Supabase
            中 `profiles` 的写入策略。
          </div>
        )}
      </div>
    </SectionCard>
  );
}
