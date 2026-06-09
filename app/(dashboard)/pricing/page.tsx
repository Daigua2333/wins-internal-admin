import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { DashboardToast } from "@/components/ui/dashboard-toast";
import { PageIntro } from "@/components/layout/page-intro";
import { QuotationOperationsWorkbench } from "@/components/pricing/quotation-operations-workbench";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { hasPermission } from "@/lib/auth/session";
import { getOrderCreateOptions, getPricingOperationsRecords, getPricingSummaryItems } from "@/lib/loaders/admin";

type PricingPageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    detail?: string;
    quoteNo?: string;
    query?: string;
    status?: string;
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = (await searchParams) ?? {};
  const [records, customerOptions, summaryItems, canReadQuotations, canWriteQuotations, canConvertToOrder] = await Promise.all([
    getPricingOperationsRecords(),
    getOrderCreateOptions(),
    getPricingSummaryItems(),
    hasPermission("quotations.read"),
    hasPermission("quotations.write"),
    hasPermission("orders.write"),
  ]);

  if (!canReadQuotations) {
    return <AccessDeniedCard description="报价单模块当前仅向管理员、运营、销售与财务角色开放。" />;
  }

  const feedback = getPricingFeedback(params);

  return (
    <>
      <PageIntro
        eyebrow="Quotation Management"
        title="报价单管理模块"
        description="集中维护客户报价、有效期、金额结构和确认状态，为客户跟进与转订单提供统一工作台。"
      />

      <DashboardToast feedback={feedback} />

      <SummaryGrid items={summaryItems} />

      <QuotationOperationsWorkbench
        records={records}
        customers={customerOptions.customers}
        canWriteQuotations={canWriteQuotations}
        canConvertToOrder={canConvertToOrder}
        initialQuery={params.query}
        initialFilter={params.status}
      />
    </>
  );
}

function getPricingFeedback(params: { message?: string; error?: string; detail?: string; quoteNo?: string }) {
  if (params.message === "quotation_created") {
    return {
      type: "success" as const,
      message: `报价单已创建${params.quoteNo ? `：${params.quoteNo}` : ""}。`,
      detail: "这份报价已进入报价台账，也会同步出现在客户页的报价关联视图里。",
    };
  }

  if (params.message === "quotation_updated") {
    return {
      type: "success" as const,
      message: "报价资料已更新。",
      detail: "客户、有效期、金额和备注已经保存。",
    };
  }

  if (params.message === "quotation_status_updated") {
    return {
      type: "success" as const,
      message: "报价状态已更新。",
      detail: "报价统计和客户关联视图会在下一次请求时同步刷新。",
    };
  }

  if (params.message === "quotation_deleted") {
    return {
      type: "success" as const,
      message: "报价单已删除。",
      detail: "报价台账和客户关联视图已经同步刷新。",
    };
  }

  if (params.error === "not_allowed") {
    return {
      type: "error" as const,
      message: "当前账号没有维护报价单的权限。",
    };
  }

  if (params.error === "not_allowed_to_convert") {
    return {
      type: "error" as const,
      message: "当前账号没有把报价转为订单的权限。",
    };
  }

  if (params.error === "preview_mode") {
    return {
      type: "error" as const,
      message: "当前仍在预览模式。要测试真实报价写入，请先连接 Supabase。",
    };
  }

  if (params.error === "missing_fields") {
    return {
      type: "error" as const,
      message: "请至少填写客户、报价标题和报价状态。",
    };
  }

  if (params.error === "invalid_status") {
    return {
      type: "error" as const,
      message: "报价状态无效，请重新选择。",
    };
  }

  if (params.error === "invalid_amount") {
    return {
      type: "error" as const,
      message: "报价金额或预计成本无效，请输入 0 或正数。",
    };
  }

  if (params.error === "create_failed") {
    return {
      type: "error" as const,
      message: "报价单新增失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 quotations 表写入策略和当前角色权限。",
    };
  }

  if (params.error === "update_failed") {
    return {
      type: "error" as const,
      message: "报价资料更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 quotations 表更新策略和当前角色权限。",
    };
  }

  if (params.error === "status_update_failed") {
    return {
      type: "error" as const,
      message: "报价状态更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 quotations 表更新策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "convert_failed") {
    return {
      type: "error" as const,
      message: "报价转订单失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 orders 表写入策略、报价数据完整性和当前账号权限。",
    };
  }

  if (params.error === "delete_failed") {
    return {
      type: "error" as const,
      message: "报价单删除失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查报价删除权限和关联数据。",
    };
  }

  return null;
}
