import { OrderCreateDialog } from "@/components/orders/order-create-dialog";
import { OrderOperationsWorkbench } from "@/components/orders/order-operations-workbench";
import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { PageIntro } from "@/components/layout/page-intro";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { hasPermission } from "@/lib/auth/session";
import { getNotificationSettings, getOperationsPolicySettings } from "@/lib/settings/runtime";
import {
  getDispatchResourceOptions,
  getOperationsReminderSnapshot,
  getOrderCostEntries,
  getOrderCreateOptions,
  getOrderOperationsRecords,
  getOrderSummaryItems,
} from "@/lib/loaders/admin";

type OrdersPageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    detail?: string;
    orderNo?: string;
    count?: string;
    repeatMode?: string;
    focus?: string;
  }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = (await searchParams) ?? {};
  const [records, costEntries, orderOptions, dispatchOptions, summaryItems, canReadOrders, canWriteOrders, notificationSettings, operationsPolicy] = await Promise.all([
    getOrderOperationsRecords(),
    getOrderCostEntries(),
    getOrderCreateOptions(),
    getDispatchResourceOptions(),
    getOrderSummaryItems(),
    hasPermission("orders.read"),
    hasPermission("orders.write"),
    getNotificationSettings(),
    getOperationsPolicySettings(),
  ]);
  const reminders = await getOperationsReminderSnapshot(notificationSettings.reminderLeadDays);

  if (!canReadOrders) {
    return <AccessDeniedCard description="订单管理仅向具备订单查看权限的角色开放。请使用管理员、运营、销售或调度账号登录。" />;
  }

  const feedback = getOrdersFeedback(params);

  return (
    <>
      <PageIntro
        eyebrow="Order Management"
        title="订单管理模块"
        description="集中管理订单生命周期，从询价、确认、排车、派导游到出团回款。当前以 mock data 呈现结构，后续可接入 Supabase 表与状态流。"
      />

      <SummaryGrid items={summaryItems} />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-[1.75rem] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">Order Pulse</p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">今日订单操作重点</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            先确认待审批、再锁定排车资源、最后补齐成本与执行留痕。订单页现在更适合作为日常运营主工作台。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          {[
            ["重复建单", "支持每天 / 每周 / 每月模板单"],
            ["冲突拦截", "同日车辆、司机、导游撞单直接阻止保存"],
            ["执行留痕", "完成情况与异常记录已接入订单链路"],
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
        defaultStartTime={operationsPolicy.dailyTourDefaultStartTime}
        reminderLeadDays={notificationSettings.reminderLeadDays}
        targetGrossMarginRate={operationsPolicy.targetGrossMarginRate}
        title="订单建单入口"
        description="在主工作台里也改成弹层建单，和运营日历保持同一套入口语言，避免整页被长表单打断。"
      />

      <OrderOperationsWorkbench
        records={records}
        customers={orderOptions.customers}
        assignees={orderOptions.assignees}
        dispatchOptions={dispatchOptions}
        costEntries={costEntries}
        canWriteOrders={canWriteOrders}
        initialSelectedId={params.focus}
        reminders={reminders}
      />
    </>
  );
}

function getOrdersFeedback(params: {
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
      detail: params.detail
        ? decodeURIComponent(params.detail)
        : createdCount > 1
          ? `这批订单已按 ${repeatModeLabel} 规则批量写入 orders 表，并会同步影响 Dashboard、运营日历与利润模块。`
          : "如果当前使用的是真实 Supabase 数据，这条记录已经写入 orders 表，并会同步影响 Dashboard 与利润模块。",
    };
  }

  if (params.error === "not_allowed") {
    return {
      type: "error" as const,
      message: "当前账号没有创建订单的权限。",
    };
  }

  if (params.error === "preview_mode") {
    return {
      type: "error" as const,
      message: "当前仍在预览模式。要测试真实订单写入，请先连接 Supabase。",
    };
  }

  if (params.error === "missing_fields") {
    return {
      type: "error" as const,
      message: "请至少填写客户、行程标题和服务日期。",
    };
  }

  if (params.error === "invalid_amount") {
    return {
      type: "error" as const,
      message: "预计营收金额无效，请输入 0 或正数。",
    };
  }

  if (params.error === "invalid_repeat_mode") {
    return {
      type: "error" as const,
      message: "重复规则无效，请重新选择每天、每周、每月或单次创建。",
    };
  }

  if (params.error === "invalid_repeat_occurrences") {
    return {
      type: "error" as const,
      message: "重复次数无效，请输入 1 到 90 之间的整数。",
    };
  }

  if (params.error === "create_failed") {
    return {
      type: "error" as const,
      message: "订单写入失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 orders 表的写入策略、客户数据和当前登录角色。",
    };
  }

  if (params.message === "order_updated") {
    return {
      type: "success" as const,
      message: "订单基础信息已更新。",
      detail: "客户、负责人、服务日期、预计营收和备注已经同步写回 orders 表。",
    };
  }

  if (params.message === "status_updated") {
    return {
      type: "success" as const,
      message: "订单状态已更新。",
      detail: "列表、Dashboard 和利润模块会在下一次请求时显示最新状态。",
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

  if (params.message === "dispatch_updated") {
    return {
      type: "success" as const,
      message: "订单调度信息已更新。",
      detail: "车辆、司机、导游分配已经写回订单，可继续补资源冲突检测与日历视图。",
    };
  }

  if (params.message === "cost_added") {
    return {
      type: "success" as const,
      message: "成本已录入。",
      detail: "订单总成本与利润已同步刷新。",
    };
  }

  if (params.message === "cost_deleted") {
    return {
      type: "success" as const,
      message: "成本明细已删除。",
      detail: "订单总成本与利润已重新计算。",
    };
  }

  if (params.message === "cost_updated") {
    return {
      type: "success" as const,
      message: "成本明细已更新。",
      detail: "金额、类别和备注已经保存，订单总成本与利润已同步刷新。",
    };
  }

  if (params.error === "dispatch_update_failed") {
    return {
      type: "error" as const,
      message: "调度信息更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 orders 表更新策略、资源主数据以及当前账号权限。",
    };
  }

  if (params.error === "dispatch_conflict") {
    return {
      type: "error" as const,
      message: "调度保存已被阻止。",
      detail: params.detail ? decodeURIComponent(params.detail) : "当前排车或人员指派与同日其他订单冲突，请先调整资源分配。",
    };
  }

  if (params.error === "cost_create_failed") {
    return {
      type: "error" as const,
      message: "成本录入失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 trip_costs 表的写入策略已经启用。",
    };
  }

  if (params.error === "cost_sync_failed") {
    return {
      type: "error" as const,
      message: "成本录入成功，但订单总成本回写失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 orders 表的更新策略。",
    };
  }

  if (params.error === "cost_delete_failed") {
    return {
      type: "error" as const,
      message: "成本删除失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 trip_costs 表的更新/删除策略和当前账号权限。",
    };
  }

  if (params.error === "cost_update_failed") {
    return {
      type: "error" as const,
      message: "成本更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 trip_costs 表的更新策略和当前账号权限。",
    };
  }

  return null;
}
