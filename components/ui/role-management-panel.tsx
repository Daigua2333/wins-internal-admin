"use client";

import { useState } from "react";
import { Check, Eye, KeyRound, LockKeyhole, Search, ShieldCheck, UserRoundCheck, UsersRound, X } from "lucide-react";

import { updateProfileActive, updateProfileRole } from "@/app/(dashboard)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import {
  APP_ROLES,
  getRoleModuleLevel,
  PERMISSION_GROUPS,
  ROLE_DEFINITIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
} from "@/lib/auth/roles";
import type { AppRole, Profile } from "@/lib/types/domain";

type RoleManagementPanelProps = {
  profiles: Profile[];
  currentUserId?: string;
  feedback?: {
    type: "success" | "error";
    message: string;
  } | null;
};

type MemberFilter = "all" | "active" | "inactive";

const accessLabels = {
  manage: { label: "管理", icon: ShieldCheck, className: "bg-amber-50 text-amber-800 ring-amber-200" },
  write: { label: "可编辑", icon: Check, className: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  read: { label: "只读", icon: Eye, className: "bg-cyan-50 text-cyan-800 ring-cyan-200" },
  none: { label: "无权限", icon: X, className: "bg-slate-50 text-slate-400 ring-slate-200" },
};

export function RoleManagementPanel({ profiles, currentUserId, feedback }: RoleManagementPanelProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole>("operations");
  const [memberRoleFilter, setMemberRoleFilter] = useState<AppRole | "all">("all");
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("all");
  const [keyword, setKeyword] = useState("");
  const activeProfiles = profiles.filter((profile) => profile.active);
  const inactiveProfiles = profiles.filter((profile) => !profile.active);
  const activeAdminCount = activeProfiles.filter((profile) => profile.role === "admin").length;
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredProfiles = profiles.filter((profile) => {
    const matchesKeyword =
      !normalizedKeyword ||
      profile.full_name.toLowerCase().includes(normalizedKeyword) ||
      profile.email.toLowerCase().includes(normalizedKeyword);
    const matchesRole = memberRoleFilter === "all" || profile.role === memberRoleFilter;
    const matchesStatus =
      memberFilter === "all" || (memberFilter === "active" && profile.active) || (memberFilter === "inactive" && !profile.active);

    return matchesKeyword && matchesRole && matchesStatus;
  });

  return (
    <section className="space-y-5">
      {feedback ? (
        <div
          className={`rounded-3xl border px-5 py-4 text-sm shadow-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_0.36fr]">
        <SectionCard
          title="角色权限设计"
          description="选择一个岗位角色，快速查看其职责边界、模块访问范围和风险提示。角色权限与数据库 RLS 保持一致。"
          action={<Badge label="固定岗位权限模型" tone="info" />}
        >
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
            {APP_ROLES.map((role) => {
              const definition = ROLE_DEFINITIONS[role];
              const activeCount = activeProfiles.filter((profile) => profile.role === role).length;
              const isSelected = selectedRole === role;

              return (
                <button
                  key={role}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedRole(role)}
                  className={`min-w-0 rounded-3xl border p-4 text-left transition ${
                    isSelected
                      ? `${definition.accentClass} -translate-y-1 shadow-lg`
                      : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`rounded-2xl p-2 ${isSelected ? "bg-white/70" : "bg-slate-100"}`}>
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium">{activeCount} 人启用</span>
                  </div>
                  <p className="mt-4 break-words text-base font-semibold">{definition.label}</p>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 opacity-75">{definition.description}</p>
                </button>
              );
            })}
          </div>

          <RoleDetail role={selectedRole} />
        </SectionCard>

        <SectionCard title="权限健康度" description="快速识别账号覆盖和高权限风险。">
          <div className="space-y-3">
            <HealthCard icon={UsersRound} label="全部内部账号" value={`${profiles.length} 人`} detail={`${activeProfiles.length} 人启用中`} />
            <HealthCard icon={ShieldCheck} label="启用中的管理员" value={`${activeAdminCount} 人`} detail={activeAdminCount > 1 ? "具备管理员冗余" : "建议再配置一名管理员"} warning={activeAdminCount <= 1} />
            <HealthCard icon={LockKeyhole} label="停用账号" value={`${inactiveProfiles.length} 人`} detail="停用后无法进入后台" />
          </div>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            系统会阻止停用或降级最后一个启用中的管理员，也不允许管理员直接修改自己的角色，避免意外锁死后台。
          </div>
        </SectionCard>
      </section>

      <PermissionMatrix />

      <SectionCard
        title="成员与角色分配"
        description="按成员查找账号、分配岗位角色或停用离职账号。角色保存后会立即影响菜单、页面访问和数据写入。"
        action={<Badge label={`${filteredProfiles.length} / ${profiles.length} 名成员`} tone="neutral" />}
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="flex min-h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-600 focus-within:border-cyan-400 focus-within:bg-white">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索姓名或邮箱"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
            />
          </label>
          <select
            value={memberRoleFilter}
            onChange={(event) => setMemberRoleFilter(event.target.value as AppRole | "all")}
            className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-cyan-400"
          >
            <option value="all">全部角色</option>
            {APP_ROLES.map((role) => (
              <option key={role} value={role}>{ROLE_DEFINITIONS[role].label}</option>
            ))}
          </select>
          <div className="flex min-w-0 gap-2 overflow-x-auto">
            {(["all", "active", "inactive"] as MemberFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setMemberFilter(filter)}
                className={`min-h-12 whitespace-nowrap rounded-2xl px-4 text-sm font-medium transition ${
                  memberFilter === filter ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300"
                }`}
              >
                {filter === "all" ? "全部账号" : filter === "active" ? "启用中" : "已停用"}
              </button>
            ))}
          </div>
        </div>

        {filteredProfiles.length ? (
          <div className="grid gap-4 2xl:grid-cols-2">
            {filteredProfiles.map((profile) => (
              <MemberCard key={profile.id} profile={profile} currentUserId={currentUserId} activeAdminCount={activeAdminCount} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            没有找到符合当前筛选条件的成员。
          </div>
        )}
      </SectionCard>
    </section>
  );
}

function RoleDetail({ role }: { role: AppRole }) {
  const definition = ROLE_DEFINITIONS[role];
  const permissionCount = ROLE_PERMISSIONS[role].includes("*") ? "全部模块" : `${ROLE_PERMISSIONS[role].length} 项权限`;

  return (
    <div className={`mt-5 rounded-3xl border p-5 ${definition.accentClass}`}>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-65">Selected Role</p>
          <h3 className="mt-2 text-xl font-semibold">{definition.label}</h3>
          <p className="mt-2 text-sm leading-6 opacity-80">{definition.description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <DetailCell label="核心职责" value={definition.responsibility} />
          <DetailCell label="权限范围" value={permissionCount} />
          <DetailCell label="风险提示" value={definition.riskNote} />
        </div>
      </div>
    </div>
  );
}

function PermissionMatrix() {
  return (
    <SectionCard
      title="模块权限矩阵"
      description="以岗位角色为列，直观看到每个业务模块是无权限、只读、可编辑还是系统管理。"
      action={<Badge label="前端权限 + Supabase RLS" tone="success" />}
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="w-[270px] px-4 py-4 font-medium">业务模块</th>
                {APP_ROLES.map((role) => (
                  <th key={role} className="px-4 py-4 text-center font-medium">{ROLE_LABELS[role]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {PERMISSION_GROUPS.flatMap((group) =>
                group.modules.map((module, index) => (
                  <tr key={module.key}>
                    <td className="px-4 py-4">
                      {index === 0 ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">{group.label}</p> : null}
                      <p className="font-medium text-slate-900">{module.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{module.description}</p>
                    </td>
                    {APP_ROLES.map((role) => <AccessLevel key={role} level={getRoleModuleLevel(role, module)} />)}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}

function AccessLevel({ level }: { level: keyof typeof accessLabels }) {
  const config = accessLabels[level];
  const Icon = config.icon;

  return (
    <td className="px-4 py-4 text-center">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${config.className}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    </td>
  );
}

function MemberCard({ profile, currentUserId, activeAdminCount }: { profile: Profile; currentUserId?: string; activeAdminCount: number }) {
  const isCurrentUser = profile.id === currentUserId;
  const isLastActiveAdmin = profile.active && profile.role === "admin" && activeAdminCount <= 1;
  const nextActive = profile.active ? "false" : "true";
  const definition = ROLE_DEFINITIONS[profile.role];
  const statusFormId = `profile-status-${profile.id}`;

  return (
    <article className={`rounded-3xl border p-5 transition hover:shadow-md ${profile.active ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-75"}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`rounded-2xl border p-2.5 ${definition.accentClass}`}>
            <UserRoundCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="break-words font-semibold text-slate-900">{profile.full_name}</p>
              {isCurrentUser ? <Badge label="当前账号" tone="info" /> : null}
              {isLastActiveAdmin ? <Badge label="最后管理员" tone="warning" /> : null}
            </div>
            <p className="mt-1 break-all text-sm text-slate-500">{profile.email}</p>
            <p className="mt-2 text-xs text-slate-500">加入于 {formatDate(profile.created_at)}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge label={definition.label} tone={profile.role === "admin" ? "warning" : "info"} />
          <Badge label={profile.active ? "启用中" : "已停用"} tone={profile.active ? "success" : "neutral"} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-medium text-slate-500">当前职责</p>
        <p className="mt-1 text-sm text-slate-700">{definition.responsibility}</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <form action={updateProfileRole} className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <input type="hidden" name="profileId" value={profile.id} />
          <select
            name="role"
            defaultValue={profile.role}
            disabled={isCurrentUser}
            className="min-h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            {APP_ROLES.map((role) => <option key={role} value={role}>{ROLE_DEFINITIONS[role].label}</option>)}
          </select>
          <PendingSubmitButton disabled={isCurrentUser} pendingLabel="保存中..." className="min-h-11 px-4">
            保存角色
          </PendingSubmitButton>
        </form>
        <form id={statusFormId} action={updateProfileActive}>
          <input type="hidden" name="profileId" value={profile.id} />
          <input type="hidden" name="active" value={nextActive} />
          {profile.active ? (
            <ConfirmActionButton
              label="停用账号"
              title={`停用 ${profile.full_name}？`}
              description="停用后，该成员即使仍有登录状态也无法继续进入后台。历史操作和业务记录会继续保留。"
              confirmLabel="确认停用"
              formId={statusFormId}
              disabled={isCurrentUser || isLastActiveAdmin}
              className="min-h-11 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            />
          ) : (
            <PendingSubmitButton pendingLabel="启用中..." className="min-h-11 w-full border border-emerald-200 bg-emerald-50 px-4 text-emerald-800 shadow-none hover:bg-emerald-100">
              重新启用
            </PendingSubmitButton>
          )}
        </form>
      </div>
      {isCurrentUser ? <p className="mt-3 text-xs text-cyan-700">为避免失去管理权限，请使用另一名管理员调整当前账号。</p> : null}
      {isLastActiveAdmin ? <p className="mt-3 text-xs text-amber-700">请先启用或分配另一名管理员，再调整此账号。</p> : null}
    </article>
  );
}

function HealthCard({ icon: Icon, label, value, detail, warning = false }: { icon: typeof UsersRound; label: string; value: string; detail: string; warning?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${warning ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
        </div>
        <Icon className={`h-5 w-5 shrink-0 ${warning ? "text-amber-700" : "text-cyan-700"}`} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/65 p-4">
      <p className="text-xs opacity-60">{label}</p>
      <p className="mt-2 text-sm font-medium leading-5">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未记录" : new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
