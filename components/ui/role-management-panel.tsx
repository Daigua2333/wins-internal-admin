import { APP_ROLES, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { updateProfileActive, updateProfileRole } from "@/app/(dashboard)/settings/actions";
import type { Profile } from "@/lib/types/domain";

type RoleManagementPanelProps = {
  profiles: Profile[];
  currentUserId?: string;
  feedback?: {
    type: "success" | "error";
    message: string;
  } | null;
};

export function RoleManagementPanel({ profiles, currentUserId, feedback }: RoleManagementPanelProps) {
  const roleCounts = APP_ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    count: profiles.filter((profile) => profile.role === role).length,
  }));
  const activeCount = profiles.filter((profile) => profile.active).length;
  const inactiveCount = profiles.length - activeCount;

  return (
    <SectionCard
      title="角色与账号管理"
      description="管理员可以在这里查看内部账号，并直接分配运营、销售、财务、调度等工作角色。"
      action={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">管理员可编辑</span>}
    >
      <div className="space-y-5">
        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">启用中账号</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{activeCount}</p>
            <p className="mt-1 text-xs text-slate-500">当前可登录后台</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">停用账号</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{inactiveCount}</p>
            <p className="mt-1 text-xs text-slate-500">登录后会被拦截</p>
          </div>
          {roleCounts.map((item) => (
            <div key={item.role} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{item.count}</p>
              <p className="mt-1 text-xs text-slate-500">{ROLE_PERMISSIONS[item.role].includes("*") ? "完整权限" : `${ROLE_PERMISSIONS[item.role].length} 项权限`}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">成员</th>
                  <th className="px-4 py-3 font-medium">当前角色</th>
                  <th className="px-4 py-3 font-medium">账号状态</th>
                  <th className="px-4 py-3 font-medium">加入时间</th>
                  <th className="px-4 py-3 font-medium">角色调整</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {profiles.map((profile) => {
                  const isCurrentUser = profile.id === currentUserId;
                  const nextActive = profile.active ? "false" : "true";

                  return (
                    <tr key={profile.id} className="align-top">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{profile.full_name}</p>
                        <p className="mt-1 text-slate-500">{profile.email}</p>
                        {isCurrentUser ? <p className="mt-2 text-xs text-cyan-700">当前登录账号</p> : null}
                      </td>
                      <td className="px-4 py-4">
                        <Badge label={ROLE_LABELS[profile.role]} tone={profile.role === "admin" ? "warning" : "info"} />
                      </td>
                      <td className="px-4 py-4">
                        <Badge label={profile.active ? "启用中" : "已停用"} tone={profile.active ? "success" : "neutral"} />
                        <form action={updateProfileActive} className="mt-3">
                          <input type="hidden" name="profileId" value={profile.id} />
                          <input type="hidden" name="active" value={nextActive} />
                          <button
                            className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-medium transition ${
                              profile.active
                                ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
                                : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                          >
                            {profile.active ? "停用账号" : "重新启用"}
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(profile.created_at)}</td>
                      <td className="px-4 py-4">
                        <form action={updateProfileRole} className="flex min-w-[250px] flex-col gap-2 md:flex-row md:items-center">
                          <input type="hidden" name="profileId" value={profile.id} />
                          <select
                            name="role"
                            defaultValue={profile.role}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400"
                          >
                            {APP_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                          <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-cyan-800">
                            保存角色
                          </button>
                        </form>
                        <p className="mt-2 text-xs text-slate-500">
                          {isCurrentUser ? "可以修改自己的角色，但建议至少保留一个管理员账号。" : "保存后立即影响导航、页面访问和操作权限。"}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未记录";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
