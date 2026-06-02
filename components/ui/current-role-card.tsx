import { ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/auth/roles";
import { getCurrentProfile, getCurrentUser, hasPermission } from "@/lib/auth/session";
import { SectionCard } from "@/components/ui/section-card";

export async function CurrentRoleCard() {
  const [user, profile, canWriteOrders, canReadProfit] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    hasPermission("orders.write"),
    hasPermission("profit.read"),
  ]);

  return (
    <SectionCard title="当前角色" description="用于确认当前登录账号是否已经建立 profiles 档案，并查看第一版权限映射。">
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current User</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{user?.email ?? "未登录"}</p>
          <p className="mt-1 text-sm text-slate-500">
            {profile ? `角色：${ROLE_LABELS[profile.role]}` : "尚未建立 profiles 角色档案"}
          </p>
        </div>

        {profile ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">订单写权限</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{canWriteOrders ? "已允许" : "未允许"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">利润读取权限</p>
                <p className="mt-2 text-sm font-medium text-slate-900">{canReadProfit ? "已允许" : "未允许"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-4">
              <p className="text-sm font-medium text-cyan-900">角色权限映射</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(ROLE_PERMISSIONS[profile.role] ?? []).map((permission) => (
                  <span key={permission} className="rounded-full bg-white px-3 py-1 text-xs text-cyan-900 ring-1 ring-cyan-200">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </>
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
