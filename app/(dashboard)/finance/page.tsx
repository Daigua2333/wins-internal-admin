import { PageIntro } from "@/components/layout/page-intro";
import { FinanceOperationsWorkbench } from "@/components/finance/finance-operations-workbench";
import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { DashboardToast } from "@/components/ui/dashboard-toast";
import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { hasPermission } from "@/lib/auth/session";
import {
  getFinanceCustomerStatementRecords,
  getFinanceOrderOptions,
  getFinanceReceivableRecords,
  getFinanceSummaryItems,
  getPaymentReceiptRecords,
  getRecentFinanceAuditLogs,
  getSupplierPaymentRecords,
} from "@/lib/loaders/admin";

type FinancePageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    detail?: string;
  }>;
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const params = (await searchParams) ?? {};
  const feedback = getFinanceFeedback(params);
  const [summaryItems, statements, receivables, receipts, supplierPayments, orderOptions, auditLogs, canReadFinance, canWriteFinance] = await Promise.all([
    getFinanceSummaryItems(),
    getFinanceCustomerStatementRecords(),
    getFinanceReceivableRecords(),
    getPaymentReceiptRecords(),
    getSupplierPaymentRecords(),
    getFinanceOrderOptions(),
    getRecentFinanceAuditLogs(),
    hasPermission("finance.read"),
    hasPermission("finance.write"),
  ]);

  if (!canReadFinance) {
    return <AccessDeniedCard description="回款与对账模块仅向具备财务数据查看权限的角色开放。" />;
  }

  return (
    <>
      <PageIntro
        eyebrow="Receivables"
        title="回款与对账"
        description="把订单回款登记、未回款余额、账龄与客户对账摘要集中到一个工作台，帮助财务和运营一起盯紧现金流。"
      />

      <DashboardToast feedback={feedback} />

      <SummaryGrid items={summaryItems} />

      <FinanceOperationsWorkbench
        statements={statements}
        receivables={receivables}
        receipts={receipts}
        supplierPayments={supplierPayments}
        orderOptions={orderOptions}
        canWriteFinance={canWriteFinance}
      />

      <SectionCard title="最近财务操作记录" description="保留回款与供应商付款的新增、修改和作废轨迹，便于月底复核和责任追溯。">
        <DataTable
          columns={["时间", "操作人", "动作", "对象", "摘要"]}
          rows={auditLogs.map((log) => ({
            time: log.createdAtLabel,
            actor: log.actorLabel,
            action: log.actionLabel,
            entity: log.entityTypeLabel,
            summary: log.summary,
          }))}
          emptyMessage="当前还没有财务操作日志；执行新增、修改或作废后会自动出现。"
        />
      </SectionCard>
    </>
  );
}

function getFinanceFeedback(params: { message?: string; error?: string; detail?: string }) {
  if (params.message === "receipt_created") {
    return {
      type: "success" as const,
      message: "回款记录已登记。",
      detail: "客户到账金额已经写入财务台账，并会同步刷新未回款余额与对账摘要。",
    };
  }

  if (params.message === "receipt_updated") {
    return {
      type: "success" as const,
      message: "回款记录已更新。",
      detail: "到账状态、金额或备注已更新，对账视图已同步刷新。",
    };
  }

  if (params.message === "supplier_payment_created") {
    return {
      type: "success" as const,
      message: "供应商付款已登记。",
      detail: "付款金额已经写入供应商付款台账，并会同步刷新本月已付款和净现金流。",
    };
  }

  if (params.message === "supplier_payment_updated") {
    return {
      type: "success" as const,
      message: "供应商付款记录已更新。",
      detail: "付款状态、金额或备注已更新，现金流摘要已同步刷新。",
    };
  }

  if (params.message === "receipt_voided") {
    return { type: "success" as const, message: "回款记录已作废。", detail: "原始记录和作废原因已保留，应收余额和客户对账摘要已经重新计算。" };
  }

  if (params.message === "supplier_payment_voided") {
    return { type: "success" as const, message: "供应商付款记录已作废。", detail: "原始记录和作废原因已保留，净现金流已经重新计算。" };
  }

  if (params.error === "not_allowed") {
    return { type: "error" as const, message: "当前账号没有维护回款记录的权限。" };
  }

  if (params.error === "preview_mode") {
    return { type: "error" as const, message: "当前仍在预览模式。要测试真实回款写入，请先连接 Supabase。" };
  }

  if (params.error === "missing_fields") {
    return { type: "error" as const, message: "请完整填写订单、到账日期、金额、方式和状态。" };
  }

  if (params.error === "missing_void_reason") {
    return { type: "error" as const, message: "请填写作废原因后再继续。" };
  }

  if (params.error === "record_voided") {
    return { type: "error" as const, message: "该财务记录已经作废，不能继续修改。" };
  }

  if (params.error === "invalid_amount") {
    return { type: "error" as const, message: "回款金额无效，请输入大于 0 的数字。" };
  }

  if (params.error === "invalid_method") {
    return { type: "error" as const, message: "回款方式无效，请重新选择。" };
  }

  if (params.error === "invalid_status") {
    return { type: "error" as const, message: "回款状态无效，请重新选择。" };
  }

  if (params.error === "invalid_category") {
    return { type: "error" as const, message: "付款类别无效，请重新选择车辆、司机、导游、酒店、餐食、门票或杂费。" };
  }

  if (params.error === "invalid_supplier_status") {
    return { type: "error" as const, message: "供应商付款状态无效，请重新选择。" };
  }

  if (params.error === "order_not_found") {
    return {
      type: "error" as const,
      message: "找不到这条回款对应的订单。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认订单仍然存在，或重新选择正确的订单。",
    };
  }

  if (params.error === "create_failed") {
    return {
      type: "error" as const,
      message: "回款登记失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 payment_receipts 表与 RLS 策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "update_failed") {
    return {
      type: "error" as const,
      message: "回款更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认当前账号具备 finance.write 权限，且 Supabase 已执行最新版 schema.sql。",
    };
  }

  if (params.error === "supplier_create_failed") {
    return {
      type: "error" as const,
      message: "供应商付款登记失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 supplier_payments 表与 RLS 策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "supplier_update_failed") {
    return {
      type: "error" as const,
      message: "供应商付款更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认当前账号具备 finance.write 权限，且 Supabase 已执行最新版 schema.sql。",
    };
  }

  if (params.error === "void_failed" || params.error === "supplier_void_failed") {
    return {
      type: "error" as const,
      message: "财务记录作废失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 finance.write 权限，并确认 Supabase 已执行最新版 schema.sql。",
    };
  }

  return null;
}
