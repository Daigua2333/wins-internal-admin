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
    month?: string;
  }>;
};

export default async function DriversPage({ searchParams }: DriversPageProps) {
  const params = (await searchParams) ?? {};
  const [operationsRecords, summaryItems, scheduleSnapshot, canReadDrivers, canWriteDrivers, canWriteOrders] = await Promise.all([
    getDriverOperationsRecords(),
    getDriverSummaryItems(),
    getDriverScheduleSnapshot(params.month),
    hasPermission("drivers.read"),
    hasPermission("drivers.write"),
    hasPermission("orders.write"),
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
        description="维护司机资料、联系方式、月出勤、默认车辆、事故记录与月度排班，清楚追踪每一天由谁驾驶哪台车执行哪条线路。"
      />

      <DashboardToast feedback={feedback} />

      <SummaryGrid items={summaryItems} />

      <DriverOperationsWorkbench
        records={operationsRecords}
        vehicleOptions={scheduleSnapshot.vehicleOptions}
        orderOptions={scheduleSnapshot.dispatchCandidates}
        canWriteDrivers={canWriteDrivers}
        initialQuery={params.query}
      />

      <DriverScheduleStudio snapshot={scheduleSnapshot} canManageMatching={canWriteOrders} redirectTo="/drivers" />
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
      detail: "联系方式、月出勤天数、自定义颜色、默认车辆和备注已经保存。",
    };
  }

  if (params.message === "driver_status_updated") {
    return {
      type: "success" as const,
      message: "司机状态已更新。",
      detail: "最新状态会同步影响排班视图和订单指派参考。",
    };
  }

  if (params.message === "incident_recorded") {
    return {
      type: "success" as const,
      message: "司机事故记录已写入。",
      detail: "事故日期、严重程度、关联订单和处理说明已经保存。",
    };
  }

  if (params.message === "driver_vehicle_matched") {
    return {
      type: "success" as const,
      message: "司机与车辆匹配已更新。",
      detail: "司机月度排班、车辆视图、每日线路记录和订单调度信息已经同步刷新。",
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
      message: "请至少填写姓名、语言、合同类型、月出勤天数和状态。",
    };
  }

  if (params.error === "missing_incident_fields") {
    return {
      type: "error" as const,
      message: "请填写事故日期、标题和事故说明。",
    };
  }

  if (params.error === "missing_match_fields") {
    return {
      type: "error" as const,
      message: "请选择需要匹配司机与车辆的订单。",
    };
  }

  if (params.error === "invalid_attendance_days") {
    return {
      type: "error" as const,
      message: "月出勤天数无效，请输入 0 或正整数。",
    };
  }

  if (params.error === "invalid_display_color") {
    return {
      type: "error" as const,
      message: "司机颜色格式无效，请重新选择颜色。",
    };
  }

  if (params.error === "default_vehicle_in_use") {
    return {
      type: "error" as const,
      message: "这台车辆已经绑定了其他司机。",
      detail: "默认司机与默认车辆采用一对一绑定；如需临时换车，请在月度排班的当日匹配中修改。",
    };
  }

  if (params.error === "invalid_incident_severity") {
    return {
      type: "error" as const,
      message: "事故严重程度无效，请重新选择。",
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

  if (params.error === "incident_record_failed") {
    return {
      type: "error" as const,
      message: "司机事故记录失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 driver_incidents 表和写入策略已经生效。",
    };
  }

  if (params.error === "driver_vehicle_conflict") {
    return {
      type: "error" as const,
      message: "司机与车辆匹配存在冲突。",
      detail: params.detail ? decodeURIComponent(params.detail) : "同一天的司机或车辆已经被其他订单占用。",
    };
  }

  if (params.error === "match_update_failed") {
    return {
      type: "error" as const,
      message: "司机与车辆匹配保存失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查订单更新权限和司机、车辆数据。",
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
