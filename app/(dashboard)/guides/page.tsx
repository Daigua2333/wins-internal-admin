import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { DashboardToast } from "@/components/ui/dashboard-toast";
import { GuideOperationsWorkbench } from "@/components/guides/guide-operations-workbench";
import { GuideScheduleStudio } from "@/components/guides/guide-schedule-studio";
import { PageIntro } from "@/components/layout/page-intro";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { hasPermission } from "@/lib/auth/session";
import { getGuideOperationsRecords, getGuideScheduleSnapshot, getGuideSummaryItems } from "@/lib/loaders/admin";

type GuidesPageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    detail?: string;
  }>;
};

export default async function GuidesPage({ searchParams }: GuidesPageProps) {
  const params = (await searchParams) ?? {};
  const [operationsRecords, summaryItems, scheduleSnapshot, canReadGuides, canWriteGuides] = await Promise.all([
    getGuideOperationsRecords(),
    getGuideSummaryItems(),
    getGuideScheduleSnapshot(),
    hasPermission("guides.read"),
    hasPermission("guides.write"),
  ]);

  if (!canReadGuides) {
    return <AccessDeniedCard description="导游管理当前仅向管理员、运营与调度角色开放。" />;
  }

  const feedback = getGuidesFeedback(params);

  return (
    <>
      <PageIntro
        eyebrow="Guide Management"
        title="导游管理模块"
        description="维护导游资料、服务语言、专长、资质、评分与排班状态，方便针对东京市区、富士山、企业团与高端定制线路进行派导。"
      />

      <DashboardToast feedback={feedback} />

      <SummaryGrid items={summaryItems} />

      <GuideOperationsWorkbench records={operationsRecords} canWriteGuides={canWriteGuides} />

      <GuideScheduleStudio snapshot={scheduleSnapshot} />
    </>
  );
}

function getGuidesFeedback(params: { message?: string; error?: string; detail?: string }) {
  if (params.message === "guide_created") {
    return {
      type: "success" as const,
      message: "导游已新增。",
      detail: "新导游已经进入导游台账，也会成为排班与订单指派的参考资源。",
    };
  }

  if (params.message === "guide_updated") {
    return {
      type: "success" as const,
      message: "导游资料已更新。",
      detail: "专长、语言、资质、评分和备注已经保存。",
    };
  }

  if (params.message === "guide_status_updated") {
    return {
      type: "success" as const,
      message: "导游状态已更新。",
      detail: "最新状态会同步影响排班视图和订单指派参考。",
    };
  }

  if (params.message === "service_recorded") {
    return {
      type: "success" as const,
      message: "导游服务记录已写入。",
      detail: "这条记录会保留在导游档案里，方便后续安排重点客户或高端团。",
    };
  }

  if (params.message === "guide_schedule_assigned") {
    return {
      type: "success" as const,
      message: "导游排班已写入。",
      detail: "导游日程、带团记录和订单指派信息已经同步刷新。",
    };
  }

  if (params.message === "guide_deleted") {
    return {
      type: "success" as const,
      message: "导游已删除。",
      detail: "导游台账已更新，相关订单里的导游分配也会同步清空。",
    };
  }

  if (params.error === "not_allowed") {
    return {
      type: "error" as const,
      message: "当前账号没有维护导游资料的权限。",
    };
  }

  if (params.error === "preview_mode") {
    return {
      type: "error" as const,
      message: "当前仍在预览模式。要测试真实导游写入，请先连接 Supabase。",
    };
  }

  if (params.error === "missing_fields") {
    return {
      type: "error" as const,
      message: "请至少填写姓名、语言、专长、评分和状态。",
    };
  }

  if (params.error === "missing_service_fields") {
    return {
      type: "error" as const,
      message: "请填写服务记录内容。",
    };
  }

  if (params.error === "missing_schedule_fields") {
    return {
      type: "error" as const,
      message: "请选择要安排的订单和导游。",
    };
  }

  if (params.error === "invalid_rating") {
    return {
      type: "error" as const,
      message: "导游评分无效，请输入 0 到 5 之间的数值。",
    };
  }

  if (params.error === "invalid_status") {
    return {
      type: "error" as const,
      message: "导游状态无效，请重新选择。",
    };
  }

  if (params.error === "create_failed") {
    return {
      type: "error" as const,
      message: "导游新增失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 guides 表写入策略和当前角色权限。",
    };
  }

  if (params.error === "update_failed") {
    return {
      type: "error" as const,
      message: "导游资料更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 guides 表更新策略和当前角色权限。",
    };
  }

  if (params.error === "status_update_failed") {
    return {
      type: "error" as const,
      message: "导游状态更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 guides 表更新策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "service_record_failed") {
    return {
      type: "error" as const,
      message: "导游服务记录失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 guides 表更新策略已经生效。",
    };
  }

  if (params.error === "guide_schedule_conflict") {
    return {
      type: "error" as const,
      message: "导游排班已被阻止。",
      detail: params.detail ? decodeURIComponent(params.detail) : "当前导游在同一天已经有别的带团安排，请先调整排班。",
    };
  }

  if (params.error === "schedule_assign_failed") {
    return {
      type: "error" as const,
      message: "导游排班写入失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 orders 表更新策略和当前角色权限。",
    };
  }

  if (params.error === "delete_failed") {
    return {
      type: "error" as const,
      message: "导游删除失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 guides 表删除策略已经在 Supabase 生效。",
    };
  }

  return null;
}
