import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { DashboardToast } from "@/components/ui/dashboard-toast";
import { DriverOperationsWorkbench } from "@/components/drivers/driver-operations-workbench";
import { DriverScheduleStudio } from "@/components/drivers/driver-schedule-studio";
import { PageIntro } from "@/components/layout/page-intro";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { hasPermission } from "@/lib/auth/session";
import { getDriverOperationsRecords, getDriverScheduleSnapshot, getDriverSummaryItems } from "@/lib/loaders/admin";

type DriversPageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    detail?: string;
    query?: string;
  }>;
};

export default async function DriversPage({ searchParams }: DriversPageProps) {
  const params = (await searchParams) ?? {};
  const [operationsRecords, summaryItems, scheduleSnapshot, canReadDrivers, canWriteDrivers] = await Promise.all([
    getDriverOperationsRecords(),
    getDriverSummaryItems(),
    getDriverScheduleSnapshot(),
    hasPermission("drivers.read"),
    hasPermission("drivers.write"),
  ]);

  if (!canReadDrivers) {
    return <AccessDeniedCard description="司机管理当前仅向管理员、运营与调度角色开放。" />;
  }

  const feedback = getDriversFeedback(params);

  return (
    <>
      <PageIntro
        eyebrow="Driver Management"
        title="司机管理模块"
        description="维护司机资料、语言能力、工时、安全评分与排班状态，方便针对入境团接机、包车和商务接待进行快速派单。"
      />

      <DashboardToast feedback={feedback} />

      <SummaryGrid items={summaryItems} />

      <DriverOperationsWorkbench records={operationsRecords} canWriteDrivers={canWriteDrivers} initialQuery={params.query} />

      <DriverScheduleStudio snapshot={scheduleSnapshot} />
    </>
  );
}

function getDriversFeedback(params: { message?: string; error?: string; detail?: string }) {
  if (params.message === "driver_created") {
    return {
      type: "success" as const,
      message: "司机已新增。",
      detail: "新司机已经进入司机台账，也会成为排班与订单指派的参考资源。",
    };
  }

  if (params.message === "driver_updated") {
    return {
      type: "success" as const,
      message: "司机资料已更新。",
      detail: "语言能力、工时、安全评分和备注已经保存。",
    };
  }

  if (params.message === "driver_status_updated") {
    return {
      type: "success" as const,
      message: "司机状态已更新。",
      detail: "最新状态会同步影响排班视图和订单指派参考。",
    };
  }

  if (params.message === "safety_recorded") {
    return {
      type: "success" as const,
      message: "安全评分记录已写入。",
      detail: "当前评分已更新，并追加了一条可回看的安全记录。",
    };
  }

  if (params.message === "driver_schedule_assigned") {
    return {
      type: "success" as const,
      message: "司机排班已写入。",
      detail: "司机日程、每日线路记录和订单指派信息已经同步刷新。",
    };
  }

  if (params.message === "driver_deleted") {
    return {
      type: "success" as const,
      message: "司机已删除。",
      detail: "司机台账已更新，相关订单里的司机分配也会同步清空。",
    };
  }

  if (params.error === "not_allowed") {
    return {
      type: "error" as const,
      message: "当前账号没有维护司机资料的权限。",
    };
  }

  if (params.error === "preview_mode") {
    return {
      type: "error" as const,
      message: "当前仍在预览模式。要测试真实司机写入，请先连接 Supabase。",
    };
  }

  if (params.error === "missing_fields") {
    return {
      type: "error" as const,
      message: "请至少填写姓名、语言、合同类型、月工时、安全评分和状态。",
    };
  }

  if (params.error === "missing_safety_fields") {
    return {
      type: "error" as const,
      message: "请填写安全评分和记录说明。",
    };
  }

  if (params.error === "missing_schedule_fields") {
    return {
      type: "error" as const,
      message: "请选择要安排的订单和司机。",
    };
  }

  if (params.error === "invalid_duty_hours") {
    return {
      type: "error" as const,
      message: "月工时无效，请输入 0 或正数。",
    };
  }

  if (params.error === "invalid_safety_score") {
    return {
      type: "error" as const,
      message: "安全评分无效，请输入 0 到 100 之间的数值。",
    };
  }

  if (params.error === "invalid_contract_type") {
    return {
      type: "error" as const,
      message: "合同类型无效，请重新选择。",
    };
  }

  if (params.error === "invalid_status") {
    return {
      type: "error" as const,
      message: "司机状态无效，请重新选择。",
    };
  }

  if (params.error === "create_failed") {
    return {
      type: "error" as const,
      message: "司机新增失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 drivers 表写入策略和当前角色权限。",
    };
  }

  if (params.error === "update_failed") {
    return {
      type: "error" as const,
      message: "司机资料更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 drivers 表更新策略和当前角色权限。",
    };
  }

  if (params.error === "status_update_failed") {
    return {
      type: "error" as const,
      message: "司机状态更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 drivers 表更新策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "safety_record_failed") {
    return {
      type: "error" as const,
      message: "安全评分记录失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 drivers 表更新策略已经生效。",
    };
  }

  if (params.error === "driver_schedule_conflict") {
    return {
      type: "error" as const,
      message: "司机排班已被阻止。",
      detail: params.detail ? decodeURIComponent(params.detail) : "当前司机在同一天已经有别的线路安排，请先调整排班。",
    };
  }

  if (params.error === "schedule_assign_failed") {
    return {
      type: "error" as const,
      message: "司机排班写入失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 orders 表更新策略和当前角色权限。",
    };
  }

  if (params.error === "delete_failed") {
    return {
      type: "error" as const,
      message: "司机删除失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 drivers 表删除策略已经在 Supabase 生效。",
    };
  }

  return null;
}
