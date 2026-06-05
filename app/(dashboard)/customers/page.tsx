import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { CustomerOperationsWorkbench } from "@/components/customers/customer-operations-workbench";
import { DashboardToast } from "@/components/ui/dashboard-toast";
import { PageIntro } from "@/components/layout/page-intro";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { hasPermission } from "@/lib/auth/session";
import { getCustomerOperationsRecords, getCustomerSummaryItems } from "@/lib/loaders/admin";

type CustomersPageProps = {
  searchParams?: Promise<{
    message?: string;
    error?: string;
    detail?: string;
    query?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = (await searchParams) ?? {};
  const [records, summaryItems, canReadCustomers, canWriteCustomers] = await Promise.all([
    getCustomerOperationsRecords(),
    getCustomerSummaryItems(),
    hasPermission("customers.read"),
    hasPermission("customers.write"),
  ]);

  if (!canReadCustomers) {
    return <AccessDeniedCard description="客户信息模块当前仅向管理员、运营、销售与财务角色开放。" />;
  }

  const feedback = getCustomersFeedback(params);

  return (
    <>
      <PageIntro
        eyebrow="Customer CRM"
        title="客户信息模块"
        description="聚合 B2B 客户资料、联系人、市场来源、历史订单与往来余额，作为销售、运营与财务协同的基础数据中心。"
      />

      <DashboardToast feedback={feedback} />

      <SummaryGrid items={summaryItems} />

      <CustomerOperationsWorkbench records={records} canWriteCustomers={canWriteCustomers} initialQuery={params.query} />
    </>
  );
}

function getCustomersFeedback(params: { message?: string; error?: string; detail?: string }) {
  if (params.message === "customer_created") {
    return {
      type: "success" as const,
      message: "客户已新增。",
      detail: "客户档案已经进入客户台账，也会成为订单和报价的可选对象。",
    };
  }

  if (params.message === "customer_updated") {
    return {
      type: "success" as const,
      message: "客户资料已更新。",
      detail: "联系人、账期、授信额度和备注已经保存。",
    };
  }

  if (params.message === "customer_status_updated") {
    return {
      type: "success" as const,
      message: "客户状态已更新。",
      detail: "最新合作状态会同步影响客户统计与跟进视图。",
    };
  }

  if (params.message === "customer_follow_recorded") {
    return {
      type: "success" as const,
      message: "客户跟进已记录。",
      detail: "跟进内容已经作为客户留痕保存在档案中。",
    };
  }

  if (params.error === "not_allowed") {
    return {
      type: "error" as const,
      message: "当前账号没有维护客户资料的权限。",
    };
  }

  if (params.error === "preview_mode") {
    return {
      type: "error" as const,
      message: "当前仍在预览模式。要测试真实客户写入，请先连接 Supabase。",
    };
  }

  if (params.error === "missing_fields") {
    return {
      type: "error" as const,
      message: "请至少填写公司名称、联系人、市场标签和合作状态。",
    };
  }

  if (params.error === "missing_follow_fields") {
    return {
      type: "error" as const,
      message: "请填写客户跟进内容。",
    };
  }

  if (params.error === "invalid_credit_limit") {
    return {
      type: "error" as const,
      message: "授信额度无效，请输入 0 或正数。",
    };
  }

  if (params.error === "invalid_status") {
    return {
      type: "error" as const,
      message: "客户状态无效，请重新选择。",
    };
  }

  if (params.error === "create_failed") {
    return {
      type: "error" as const,
      message: "客户新增失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 customers 表写入策略和当前角色权限。",
    };
  }

  if (params.error === "update_failed") {
    return {
      type: "error" as const,
      message: "客户资料更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请检查 customers 表更新策略和当前角色权限。",
    };
  }

  if (params.error === "status_update_failed") {
    return {
      type: "error" as const,
      message: "客户状态更新失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 customers 表更新策略已经在 Supabase 生效。",
    };
  }

  if (params.error === "follow_record_failed") {
    return {
      type: "error" as const,
      message: "客户跟进记录失败。",
      detail: params.detail ? decodeURIComponent(params.detail) : "请确认 customers 表更新策略已经生效。",
    };
  }

  return null;
}
