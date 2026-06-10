import { notFound } from "next/navigation";

import { CustomerDetailWorkspace } from "@/components/customers/customer-detail-workspace";
import { DashboardToast } from "@/components/ui/dashboard-toast";
import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { hasPermission } from "@/lib/auth/session";
import { getCustomerOperationsRecords, getRoleManagementProfiles } from "@/lib/loaders/admin";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ message?: string; error?: string; detail?: string }>;
};

export default async function CustomerDetailPage({ params, searchParams }: CustomerDetailPageProps) {
  const [{ id }, query, records, profiles, canReadCustomers, canWriteCustomers] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
    getCustomerOperationsRecords(),
    getRoleManagementProfiles(),
    hasPermission("customers.read"),
    hasPermission("customers.write"),
  ]);

  if (!canReadCustomers) return <AccessDeniedCard description="当前账号没有查看客户档案的权限。" />;

  const customer = records.find((record) => record.id === id);
  if (!customer) notFound();

  return (
    <>
      <DashboardToast feedback={getFeedback(query)} />
      <CustomerDetailWorkspace
        customer={customer}
        canWriteCustomers={canWriteCustomers}
        assigneeOptions={profiles.filter((profile) => profile.active).map((profile) => ({ id: profile.id, label: profile.full_name, hint: profile.email }))}
      />
    </>
  );
}

function getFeedback(params: { message?: string; error?: string; detail?: string }) {
  const success: Record<string, { message: string; detail: string }> = {
    customer_created: { message: "客户档案已建立。", detail: "现在可以继续补充跟进记录和合作需求任务。" },
    customer_updated: { message: "客户详情已更新。", detail: "联系人、客户类型、公司介绍与结算资料已经保存。" },
    customer_status_updated: { message: "客户合作状态已更新。", detail: "一级客户总览会同步显示最新状态。" },
    customer_follow_recorded: { message: "跟进记录已保存。", detail: "沟通结论已经沉淀到客户档案。" },
    task_created: { message: "合作需求任务已添加。", detail: "可以持续更新优先级、截止日期和处理进度。" },
    task_updated: { message: "合作任务进度已更新。", detail: "客户档案已显示最新任务状态。" },
    task_deleted: { message: "合作任务已删除。", detail: "该任务已从客户档案移除。" },
  };
  if (params.message && success[params.message]) return { type: "success" as const, ...success[params.message] };

  const errors: Record<string, string> = {
    not_allowed: "当前账号没有维护客户档案的权限。",
    preview_mode: "当前仍在预览模式，请连接 Supabase 后再保存。",
    missing_fields: "请完整填写客户名称、联系人、业务类型和状态。",
    missing_follow_fields: "请填写跟进内容。",
    missing_task_fields: "请至少填写合作任务标题。",
    invalid_customer_type: "客户类型无效，请重新选择。",
    invalid_credit_limit: "授信额度无效，请输入 0 或正数。",
    invalid_status: "客户合作状态无效，请重新选择。",
    invalid_task_status: "任务状态无效，请重新选择。",
    invalid_task_priority: "任务优先级无效，请重新选择。",
    update_failed: "客户详情更新失败。",
    status_update_failed: "客户状态更新失败。",
    follow_record_failed: "客户跟进记录失败。",
    task_create_failed: "合作任务创建失败。",
    task_update_failed: "合作任务更新失败。",
    task_delete_failed: "合作任务删除失败。",
  };
  if (params.error) return { type: "error" as const, message: errors[params.error] ?? "客户档案操作失败。", detail: params.detail ? decodeURIComponent(params.detail) : undefined };
  return null;
}
