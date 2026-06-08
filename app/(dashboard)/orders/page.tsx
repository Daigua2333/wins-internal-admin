import { OrderOperationsWorkbench } from "@/components/orders/order-operations-workbench";
import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { hasPermission } from "@/lib/auth/session";
import { getNotificationSettings, getOperationsPolicySettings } from "@/lib/settings/runtime";
import {
  getDispatchResourceOptions,
  getOperationsReminderSnapshot,
  getOrderCostEntries,
  getOrderCreateOptions,
  getOrderOperationsRecords,
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
    query?: string;
    status?: string;
  }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = (await searchParams) ?? {};
  const [records, costEntries, orderOptions, dispatchOptions, canReadOrders, canWriteOrders, notificationSettings, operationsPolicy] = await Promise.all([
    getOrderOperationsRecords(),
    getOrderCostEntries(),
    getOrderCreateOptions(),
    getDispatchResourceOptions(),
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
    <section className="space-y-4">
      <OrderOperationsWorkbench
        records={records}
        customers={orderOptions.customers}
        assignees={orderOptions.assignees}
        dispatchOptions={dispatchOptions}
        costEntries={costEntries}
        canWriteOrders={canWriteOrders}
        initialSelectedId={params.focus}
        initialQuery={params.query}
        initialFilter={params.status}
        reminders={reminders}
        feedback={feedback}
        defaultStartTime={operationsPolicy.dailyTourDefaultStartTime}
        reminderLeadDays={notificationSettings.reminderLeadDays}
        targetGrossMarginRate={operationsPolicy.targetGrossMarginRate}
      />
    </section>
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
  const detail = params.detail ? decodeURIComponent(params.detail) : undefined;

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
      detail: detail
        ? detail
        : createdCount > 1
          ? `这批订单已按 ${repeatModeLabel} 规则批量写入 orders 表，并会同步影响 Dashboard、运营日历与利润模块。`
          : "如果当前使用的是真实 Supabase 数据，这条记录已经写入 orders 表，并会同步影响 Dashboard 与利润模块。",
    };
  }

  if (params.message === "order_updated") {
    return {
      type: "success" as const,
      message: "订单基础信息已更新。",
      detail: "客户、标题、日期、负责人、金额和备注已保存，并会同步影响 Dashboard、日历和利润模块。",
    };
  }

  if (params.message === "status_updated") {
    return {
      type: "success" as const,
      message: "订单状态已更新。",
    };
  }

  if (params.message === "order_deleted") {
    return {
      type: "success" as const,
      message: "订单已删除。",
      detail: "相关成本、回款和供应商付款会按数据库关联规则同步处理。",
    };
  }

  if (params.message === "order_archived") {
    return {
      type: "success" as const,
      message: "订单已归档。",
      detail: "这张订单已从活跃工作台移入历史归档，可通过日期、客户、订单号、行程内容、摘要或关键词继续检索。",
    };
  }

  if (params.message === "archive_restored") {
    return {
      type: "success" as const,
      message: "订单已移出归档。",
      detail: "这张订单已回到活跃订单工作台，现在可以继续编辑、调度或删除。",
    };
  }

  if (params.message === "dispatch_updated") {
    return {
      type: "success" as const,
      message: "订单调度已保存。",
      detail: detail ?? "车辆、司机或导游分配已更新。",
    };
  }

  if (params.message === "cost_added") {
    return {
      type: "success" as const,
      message: "成本已录入。",
    };
  }

  if (params.message === "cost_updated") {
    return {
      type: "success" as const,
      message: "成本明细已更新。",
    };
  }

  if (params.message === "cost_deleted") {
    return {
      type: "success" as const,
      message: "成本明细已删除。",
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

  if (params.error === "invalid_start_time") {
    return {
      type: "error" as const,
      message: "出发 / 集合时间格式无效，请使用 HH:mm 格式。",
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
      detail: detail ?? "请检查 orders 表的写入策略、客户数据和当前登录角色。",
    };
  }

  if (params.error === "update_failed") {
    return {
      type: "error" as const,
      message: "订单更新失败。",
      detail,
    };
  }

  if (params.error === "status_update_failed") {
    return {
      type: "error" as const,
      message: "状态更新失败。",
      detail,
    };
  }

  if (params.error === "delete_failed") {
    return {
      type: "error" as const,
      message: "订单删除失败。",
      detail,
    };
  }

  if (params.error === "archive_not_closed") {
    return {
      type: "error" as const,
      message: "只有已完成或已取消订单可以归档。",
      detail: "请先在订单编辑界面把订单状态推进到已完成，或标记为已取消后再归档。",
    };
  }

  if (params.error === "archive_readonly") {
    return {
      type: "error" as const,
      message: "归档订单当前为只读状态。",
      detail: "为了保留历史核对口径，请先把订单移出归档，再进行编辑、删除、调度或成本修改。",
    };
  }

  if (params.error === "archive_failed") {
    return {
      type: "error" as const,
      message: "订单归档失败。",
      detail: detail ?? "请检查 orders 表是否已执行最新归档字段迁移，以及当前账号是否具备订单写入权限。",
    };
  }

  if (params.error === "archive_restore_failed") {
    return {
      type: "error" as const,
      message: "移出归档失败。",
      detail,
    };
  }

  if (params.error === "dispatch_conflict") {
    return {
      type: "error" as const,
      message: "调度保存被冲突拦截。",
      detail: detail ?? "当前排车或人员指派与同日其他订单冲突，请先调整资源分配。",
    };
  }

  if (params.error === "dispatch_update_failed") {
    return {
      type: "error" as const,
      message: "调度保存失败。",
      detail,
    };
  }

  if (params.error === "cost_create_failed" || params.error === "cost_update_failed" || params.error === "cost_delete_failed" || params.error === "cost_sync_failed") {
    return {
      type: "error" as const,
      message: "成本处理失败。",
      detail,
    };
  }

  return null;
}
