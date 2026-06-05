import { OrderCreateDialog } from "@/components/orders/order-create-dialog";
import { PageIntro } from "@/components/layout/page-intro";
import { OperationsCalendarWorkbench } from "@/components/calendar/operations-calendar-workbench";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { hasPermission } from "@/lib/auth/session";
import { getNotificationSettings, getOperationsPolicySettings } from "@/lib/settings/runtime";
import {
  getCalendarSummaryItems,
  getDispatchResourceOptions,
  getOperationsCalendarSnapshot,
  getOperationsReminderSnapshot,
  getOrderCostEntries,
  getOrderCreateOptions,
} from "@/lib/loaders/admin";

type CalendarPageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    detail?: string;
    orderNo?: string;
    count?: string;
    repeatMode?: string;
  }>;
};

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = (await searchParams) ?? {};
  const [canReadOrders, canWriteOrders, summaryItems, snapshot, orderOptions, dispatchOptions, costEntries, notificationSettings, operationsPolicy] = await Promise.all([
    hasPermission("orders.read"),
    hasPermission("orders.write"),
    getCalendarSummaryItems(),
    getOperationsCalendarSnapshot(),
    getOrderCreateOptions(),
    getDispatchResourceOptions(),
    getOrderCostEntries(),
    getNotificationSettings(),
    getOperationsPolicySettings(),
  ]);
  const reminders = await getOperationsReminderSnapshot(notificationSettings.reminderLeadDays);

  if (!canReadOrders) {
    return <AccessDeniedCard description="运营日历当前仅向能够查看订单的角色开放。" />;
  }

  const feedback = getCalendarOrdersFeedback(params);

  return (
    <>
      <PageIntro
        eyebrow="Operations Calendar"
        title="统一运营日历"
        description="按天查看订单、车辆、司机、导游、负责人、收入和成本，方便整个团队快速追溯每天的运营细节。"
      />

      <SummaryGrid items={summaryItems} />

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="glass-panel rounded-[1.75rem] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">Calendar Control</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">按天调度、按周观察、按月回溯</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            这页现在已经不是纯展示日历，而是订单创建、排班调整、成本录入和运营留痕都能直接完成的统一中控台。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          {[
            ["月视图", "适合回看每一天发生了什么"],
            ["周视图", "适合盯未来 7 天排班密度"],
            ["主动提醒", "T-提醒、报价到期、点检到期集中展示"],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-[1.5rem] border border-slate-200/80 bg-white/88 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-medium text-slate-900">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <OrderCreateDialog
        customers={orderOptions.customers}
        assignees={orderOptions.assignees}
        canWriteOrders={canWriteOrders}
        feedback={feedback}
        defaultServiceDate={snapshot.today}
        redirectTo="/calendar"
        defaultStartTime={operationsPolicy.dailyTourDefaultStartTime}
        reminderLeadDays={notificationSettings.reminderLeadDays}
        targetGrossMarginRate={operationsPolicy.targetGrossMarginRate}
      />

      <OperationsCalendarWorkbench
        snapshot={snapshot}
        customers={orderOptions.customers}
        assignees={orderOptions.assignees}
        dispatchOptions={dispatchOptions}
        costEntries={costEntries}
        canWriteOrders={canWriteOrders}
        reminders={reminders}
        defaultStartTime={operationsPolicy.dailyTourDefaultStartTime}
        reminderLeadDays={notificationSettings.reminderLeadDays}
        targetGrossMarginRate={operationsPolicy.targetGrossMarginRate}
      />
    </>
  );
}

function getCalendarOrdersFeedback(params: {
  message?: string;
  error?: string;
  detail?: string;
  orderNo?: string;
  count?: string;
  repeatMode?: string;
}) {
  if (params.message === "order_created") {
    const createdCount = Number(params.count ?? "1");
    const repeatModeLabel =
      params.repeatMode === "daily"
        ? "按每天"
        : params.repeatMode === "weekly"
          ? "按每周"
          : params.repeatMode === "monthly"
            ? "按每月"
            : "单次";

    return {
      type: "success" as const,
      message:
        createdCount > 1
          ? `重复订单已创建，共 ${createdCount} 条${params.orderNo ? `，首单号 ${params.orderNo}` : ""}。`
          : `订单已创建${params.orderNo ? `：${params.orderNo}` : ""}。`,
      detail:
        createdCount > 1
          ? `这批订单已按 ${repeatModeLabel} 规则批量写入，并会立刻出现在运营日历里。`
          : "新订单已经写入系统，并会立刻出现在对应日期的运营日历里。",
    };
  }

  if (params.message === "order_updated") {
    return {
      type: "success" as const,
      message: "订单基础信息已更新。",
      detail: "客户、负责人、服务日期、预计营收和备注已经更新，日历视图会同步反映。",
    };
  }

  if (params.message === "status_updated") {
    return {
      type: "success" as const,
      message: "订单状态已更新。",
      detail: "当前日期卡片和订单细节追溯都会显示最新状态。",
    };
  }

  if (params.message === "dispatch_updated") {
    return {
      type: "success" as const,
      message: "订单调度信息已更新。",
      detail: "车辆、司机和导游分配已经写回，并会立刻反映到当天日历。",
    };
  }

  if (params.message === "cost_added") {
    return {
      type: "success" as const,
      message: "成本已录入。",
      detail: "订单成本与毛利已经同步刷新。",
    };
  }

  if (params.message === "cost_deleted") {
    return {
      type: "success" as const,
      message: "成本明细已删除。",
      detail: "订单总成本与毛利已重新计算。",
    };
  }

  if (params.message === "order_deleted") {
    return {
      type: "success" as const,
      message: "订单已删除。",
      detail: "订单已经从运营日历、订单工作台、成本和财务关联视图中移除。",
    };
  }

  if (params.message === "ops_log_added") {
    return {
      type: "success" as const,
      message: "运营留痕已记录。",
      detail: "完成情况或异常记录已经写入当前订单，并可在运营日历中直接回看。",
    };
  }

  if (params.error === "not_allowed") {
    return { type: "error" as const, message: "当前账号没有创建或管理订单的权限。" };
  }

  if (params.error === "preview_mode") {
    return { type: "error" as const, message: "当前仍在预览模式。要测试真实订单写入，请先连接 Supabase。" };
  }

  if (params.error === "missing_fields") {
    return { type: "error" as const, message: "请至少填写客户、行程标题和服务日期。" };
  }

  if (params.error === "invalid_amount") {
    return { type: "error" as const, message: "预计营收金额无效，请输入 0 或正数。" };
  }

  if (params.error === "invalid_start_time") {
    return { type: "error" as const, message: "出发 / 集合时间无效，请使用 HH:mm 格式。" };
  }

  if (params.error === "invalid_repeat_mode") {
    return { type: "error" as const, message: "重复规则无效，请重新选择每天、每周、每月或单次创建。" };
  }

  if (params.error === "invalid_repeat_occurrences") {
    return { type: "error" as const, message: "重复次数无效，请输入 1 到 90 之间的整数。" };
  }

  if (params.error === "create_failed") {
    return {
      type: "error" as const,
      message: "订单写入失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 orders 表的写入策略、客户数据和当前登录角色。",
    };
  }

  if (params.error === "update_failed") {
    return {
      type: "error" as const,
      message: "订单更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认当前账号具备 orders.write 权限，且 Supabase 已执行最新版 schema.sql。",
    };
  }

  if (params.error === "status_update_failed") {
    return {
      type: "error" as const,
      message: "订单状态更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 orders 表的更新策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "dispatch_conflict") {
    return {
      type: "error" as const,
      message: "调度保存已被阻止。",
      detail: params.detail ? decodeURIComponent(params.detail) : "当前排车或人员指派与同日其他订单冲突，请先调整资源分配。",
    };
  }

  if (params.error === "dispatch_update_failed") {
    return {
      type: "error" as const,
      message: "调度信息更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 orders 表更新策略、资源主数据以及当前账号权限。",
    };
  }

  if (params.error === "cost_create_failed") {
    return {
      type: "error" as const,
      message: "成本录入失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 trip_costs 表的写入策略已经启用。",
    };
  }

  if (params.error === "cost_delete_failed") {
    return {
      type: "error" as const,
      message: "成本删除失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 trip_costs 表删除策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "cost_sync_failed") {
    return {
      type: "error" as const,
      message: "成本同步失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "成本动作已执行，但订单总成本回写失败，请检查 orders 表更新策略。",
    };
  }

  if (params.error === "delete_failed") {
    return {
      type: "error" as const,
      message: "订单删除失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 orders 表删除策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "missing_log_fields") {
    return {
      type: "error" as const,
      message: "请填写完整的运营留痕内容。",
    };
  }

  if (params.error === "invalid_log_type") {
    return {
      type: "error" as const,
      message: "留痕类型无效，请重新提交完成情况或异常记录。",
    };
  }

  if (params.error === "ops_log_failed") {
    return {
      type: "error" as const,
      message: "运营留痕写入失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 orders 表更新策略已经生效。",
    };
  }

  return null;
}
