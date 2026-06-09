import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { DashboardToast } from "@/components/ui/dashboard-toast";
import { PageIntro } from "@/components/layout/page-intro";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { VehicleOperationsWorkbench } from "@/components/fleet/vehicle-operations-workbench";
import { DriverScheduleStudio } from "@/components/drivers/driver-schedule-studio";
import { hasPermission } from "@/lib/auth/session";
import { getDriverScheduleSnapshot, getFleetSummaryItems, getVehicleOperationsRecords } from "@/lib/loaders/admin";

type FleetPageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    detail?: string;
    query?: string;
    status?: string;
    month?: string;
  }>;
};

export default async function FleetPage({ searchParams }: FleetPageProps) {
  const params = (await searchParams) ?? {};
  const [records, summaryItems, scheduleSnapshot, canReadVehicles, canWriteVehicles, canWriteOrders] = await Promise.all([
    getVehicleOperationsRecords(),
    getFleetSummaryItems(),
    getDriverScheduleSnapshot(params.month),
    hasPermission("vehicles.read"),
    hasPermission("vehicles.write"),
    hasPermission("orders.write"),
  ]);

  if (!canReadVehicles) {
    return <AccessDeniedCard description="车辆管理当前仅向管理员、运营与调度角色开放。" />;
  }

  const feedback = getFleetFeedback(params);

  return (
    <>
      <PageIntro
        eyebrow="Fleet Management"
        title="车辆管理模块"
        description="维护自有车辆与合作车队信息，并通过月度司机排班查看每天由哪位司机驾驶哪台车执行哪条线路。"
      />

      <DashboardToast feedback={feedback} />

      <SummaryGrid items={summaryItems} />

      <VehicleOperationsWorkbench
        records={records}
        canWriteVehicles={canWriteVehicles}
        initialQuery={params.query}
        initialFilter={params.status}
      />

      <DriverScheduleStudio snapshot={scheduleSnapshot} canManageMatching={canWriteOrders} redirectTo="/fleet" />
    </>
  );
}

function getFleetFeedback(params: { message?: string; error?: string; detail?: string }) {
  if (params.message === "vehicle_created") {
    return {
      type: "success" as const,
      message: "车辆已新增。",
      detail: "新车辆已经进入车辆台账，也会出现在订单排车的可选资源里。",
    };
  }

  if (params.message === "vehicle_updated") {
    return {
      type: "success" as const,
      message: "车辆资料已更新。",
      detail: "车牌、车型、点检日期和备注已经保存。",
    };
  }

  if (params.message === "vehicle_status_updated") {
    return {
      type: "success" as const,
      message: "车辆状态已更新。",
      detail: "最新状态会同步影响调度视图和订单排车选择。",
    };
  }

  if (params.message === "vehicle_deleted") {
    return {
      type: "success" as const,
      message: "车辆已删除。",
      detail: "车辆台账已更新，相关订单里的车辆引用也会同步清空。",
    };
  }

  if (params.message === "driver_vehicle_matched") {
    return {
      type: "success" as const,
      message: "司机与车辆匹配已更新。",
      detail: "车辆月度排班、司机视图和订单调度信息已经同步刷新。",
    };
  }

  if (params.error === "not_allowed") {
    return {
      type: "error" as const,
      message: "当前账号没有维护车辆资料的权限。",
    };
  }

  if (params.error === "preview_mode") {
    return {
      type: "error" as const,
      message: "当前仍在预览模式。要测试真实车辆写入，请先连接 Supabase。",
    };
  }

  if (params.error === "missing_fields") {
    return {
      type: "error" as const,
      message: "请至少填写车牌、车辆名称、车型、座位数、归属和状态。",
    };
  }

  if (params.error === "invalid_seat_capacity") {
    return {
      type: "error" as const,
      message: "座位数无效，请输入大于 0 的整数。",
    };
  }

  if (params.error === "invalid_owner_type") {
    return {
      type: "error" as const,
      message: "车辆归属无效，请选择自有车辆或合作车队。",
    };
  }

  if (params.error === "invalid_status") {
    return {
      type: "error" as const,
      message: "车辆状态无效，请重新选择状态。",
    };
  }

  if (params.error === "duplicate_plate") {
    return {
      type: "error" as const,
      message: "这个车牌已经存在。",
      detail: "请换一个新的车牌，或者在右侧详情区直接编辑那台已有车辆。",
    };
  }

  if (params.error === "create_failed") {
    return {
      type: "error" as const,
      message: "车辆新增失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 vehicles 表写入策略、车牌唯一性和当前角色权限。",
    };
  }

  if (params.error === "update_failed") {
    return {
      type: "error" as const,
      message: "车辆资料更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 vehicles 表更新策略、车牌唯一性和当前角色权限。",
    };
  }

  if (params.error === "status_update_failed") {
    return {
      type: "error" as const,
      message: "车辆状态更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 vehicles 表更新策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "delete_failed") {
    return {
      type: "error" as const,
      message: "车辆删除失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 vehicles 表删除策略已经在 Supabase 生效。",
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

  return null;
}
