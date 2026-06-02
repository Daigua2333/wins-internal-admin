import { signOut } from "@/app/(dashboard)/settings/actions";
import { hasPermission, getCurrentUser } from "@/lib/auth/session";
import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { PageIntro } from "@/components/layout/page-intro";
import { CurrentRoleCard } from "@/components/ui/current-role-card";
import { ModuleToolbar } from "@/components/ui/module-toolbar";
import { SettingsControlCenter } from "@/components/settings/settings-control-center";
import { RoleManagementPanel } from "@/components/ui/role-management-panel";
import { SupabaseHealthCard } from "@/components/ui/supabase-health-card";
import { SetupNextStepsCard } from "@/components/ui/setup-next-steps-card";
import { SupabaseStatusCard } from "@/components/ui/supabase-status-card";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { getRoleManagementProfiles, getSettingsWorkspaceSnapshot } from "@/lib/loaders/admin";
import { settingsSummary } from "@/lib/mock/data";

type SettingsPageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    detail?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = (await searchParams) ?? {};
  const [canReadSettings, profiles, user, settingsSnapshot] = await Promise.all([
    hasPermission("settings.read"),
    getRoleManagementProfiles(),
    getCurrentUser(),
    getSettingsWorkspaceSnapshot(),
  ]);

  if (!canReadSettings) {
    return <AccessDeniedCard description="系统设置当前仅向管理员开放。请使用管理员账号登录，或在 profiles 中调整当前用户角色。" />;
  }

  const feedback = getSettingsFeedback(params);

  return (
    <>
      <PageIntro
        eyebrow="System Settings"
        title="系统设置页面"
        description="用于管理公司基础信息、角色权限、通知规则、品牌配置与部署相关参数。当前先做出结构，便于后续逐步接入后台配置能力。"
      />

      <SummaryGrid items={settingsSummary} />

      <ModuleToolbar
        searchPlaceholder="搜索配置项、角色名称、通知规则"
        filters={["权限角色", "通知规则", "公司信息", "部署配置"]}
        primaryAction="新增配置项"
      />

      <SupabaseStatusCard />
      <SupabaseHealthCard />
      <CurrentRoleCard />
      <RoleManagementPanel profiles={profiles} currentUserId={user?.id} feedback={feedback} />
      <SetupNextStepsCard />

      <div className="flex justify-end">
        <form action={signOut}>
          <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700">
            退出登录
          </button>
        </form>
      </div>

      <SettingsControlCenter snapshot={settingsSnapshot} />
    </>
  );
}

function getSettingsFeedback(params: { message?: string; error?: string; detail?: string }) {
  if (params.message === "role_updated") {
    return {
      type: "success" as const,
      message: "角色已更新。相关菜单、页面和操作权限会在下次请求时按新角色生效。",
    };
  }

  if (params.message === "account_enabled") {
    return {
      type: "success" as const,
      message: "账号已重新启用。该成员现在可以重新登录并访问被授权的后台页面。",
    };
  }

  if (params.message === "account_disabled") {
    return {
      type: "success" as const,
      message: "账号已停用。该成员即使仍有登录态，也会在进入后台时被阻止访问。",
    };
  }

  if (params.message === "company_profile_updated") {
    return {
      type: "success" as const,
      message: "公司信息已更新。品牌、办公室信息和结算主体设置已经保存。",
    };
  }

  if (params.message === "notification_rules_updated") {
    return {
      type: "success" as const,
      message: "通知规则已更新。后续订单、车辆、报价和授信提醒将以这组参数为准。",
    };
  }

  if (params.message === "operations_policy_updated") {
    return {
      type: "success" as const,
      message: "运营参数已更新。默认货币、毛利率目标和调度策略已经保存。",
    };
  }

  if (params.error === "not_allowed") {
    return {
      type: "error" as const,
      message: "当前账号没有分配角色的权限。",
    };
  }

  if (params.error === "invalid_role") {
    return {
      type: "error" as const,
      message: "提交的角色无效，请重新选择后再保存。",
    };
  }

  if (params.error === "supabase_not_configured") {
    return {
      type: "error" as const,
      message: "当前仍处于预览模式，连接 Supabase 后才能把角色真正写入数据库。",
    };
  }

  if (params.error === "role_update_failed") {
    return {
      type: "error" as const,
      message: "角色更新失败。若刚升级代码，请先在 Supabase 重新执行最新版 schema.sql 以启用管理员更新策略。",
    };
  }

  if (params.error === "invalid_profile") {
    return {
      type: "error" as const,
      message: "未找到要操作的账号，请刷新后重试。",
    };
  }

  if (params.error === "self_disable_forbidden") {
    return {
      type: "error" as const,
      message: "不能停用当前正在操作的登录账号，请使用其他管理员账号执行此操作。",
    };
  }

  if (params.error === "profile_status_update_failed") {
    return {
      type: "error" as const,
      message: "账号状态更新失败。请确认 Supabase 已执行最新版 schema.sql，并检查当前账号是否为管理员。",
    };
  }

  if (params.error === "missing_company_fields") {
    return {
      type: "error" as const,
      message: "请完整填写公司名称、品牌简称、办公室地址、结算主体和支持邮箱。",
    };
  }

  if (params.error === "invalid_reminder_days") {
    return {
      type: "error" as const,
      message: "提前提醒天数无效，请输入 0 到 30 之间的整数。",
    };
  }

  if (params.error === "missing_operations_fields") {
    return {
      type: "error" as const,
      message: "请填写默认货币和一日游默认出发时间。",
    };
  }

  if (params.error === "invalid_margin_target") {
    return {
      type: "error" as const,
      message: "目标毛利率无效，请输入 0 到 100 之间的数值。",
    };
  }

  if (params.error === "settings_update_failed") {
    return {
      type: "error" as const,
      message: "系统设置保存失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 Supabase 已执行最新版 schema.sql，并检查当前账号是否为管理员。",
    };
  }

  return null;
}
