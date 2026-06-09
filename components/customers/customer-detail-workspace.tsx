import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import {
  appendCustomerFollowLog,
  createCustomerCollaborationTask,
  deleteCustomerCollaborationTask,
  updateCustomerBasics,
  updateCustomerCollaborationTask,
  updateCustomerStatus,
} from "@/app/(dashboard)/customers/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { StatStrip } from "@/components/ui/stat-strip";
import type { CustomerCollaborationTaskRecord, CustomerOperationsRecord } from "@/lib/loaders/admin";

type CustomerDetailWorkspaceProps = {
  customer: CustomerOperationsRecord;
  canWriteCustomers: boolean;
};

const statusOptions = [
  { value: "active", label: "合作中" },
  { value: "nurturing", label: "跟进中" },
  { value: "settled", label: "已结清" },
  { value: "inactive", label: "已停用" },
];

export function CustomerDetailWorkspace({ customer, canWriteCustomers }: CustomerDetailWorkspaceProps) {
  const openTasks = customer.collaborationTasks.filter((task) => !["completed", "cancelled"].includes(task.status));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/customers" className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700">
          <ArrowLeft className="mr-2 h-4 w-4" />返回客户档案
        </Link>
        <div className="flex flex-wrap gap-2">
          <Badge label={customer.customerTypeLabel} tone={customer.customerType === "long_term" ? "success" : "info"} />
          <Badge label={customer.statusLabel} tone={resolveCustomerTone(customer.status)} />
          <Badge label={`${openTasks.length} 项合作待办`} tone="warning" />
        </div>
      </div>

      <SectionCard title={customer.companyName} description={customer.companyProfile || "尚未填写公司介绍。"}>
        <StatStrip
          items={[
            { label: "联系人", value: customer.contactName },
            { label: "业务类型", value: customer.marketSegment },
            { label: "历史订单", value: customer.orderCountLabel },
            { label: "合作任务", value: `${openTasks.length} 项进行中` },
            { label: "微信", value: customer.wechatId || "未录入" },
            { label: "LINE", value: customer.lineId || "未录入" },
          ]}
          columnsClassName="md:grid-cols-2 xl:grid-cols-3"
        />
      </SectionCard>

      <section className="grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <SectionCard title="客户详情维护" description="所有联系人、客户类型、公司介绍与结算资料都保存在这份二级档案中。">
            <form action={updateCustomerBasics} className="space-y-4">
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="status" value={customer.status} />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="公司或客户名称"><input name="companyName" defaultValue={customer.companyName} disabled={!canWriteCustomers} className={inputClassName} /></Field>
                <Field label="客户类型">
                  <select name="customerType" defaultValue={customer.customerType} disabled={!canWriteCustomers} className={inputClassName}>
                    <option value="long_term">长期合作</option><option value="short_term">短期合作</option><option value="one_time">一次性客户</option>
                  </select>
                </Field>
                <Field label="联系人"><input name="contactName" defaultValue={customer.contactName} disabled={!canWriteCustomers} className={inputClassName} /></Field>
                <Field label="业务类型 / 市场标签"><input name="marketSegment" defaultValue={customer.marketSegment} disabled={!canWriteCustomers} className={inputClassName} /></Field>
                <Field label="联系邮箱"><input name="contactEmail" defaultValue={customer.contactEmail} disabled={!canWriteCustomers} className={inputClassName} /></Field>
                <Field label="联系电话"><input name="contactPhone" defaultValue={customer.contactPhone} disabled={!canWriteCustomers} className={inputClassName} /></Field>
                <Field label="微信"><input name="wechatId" defaultValue={customer.wechatId} disabled={!canWriteCustomers} className={inputClassName} /></Field>
                <Field label="LINE"><input name="lineId" defaultValue={customer.lineId} disabled={!canWriteCustomers} className={inputClassName} /></Field>
                <Field label="账期说明"><input name="billingTerms" defaultValue={customer.billingTerms} disabled={!canWriteCustomers} className={inputClassName} /></Field>
                <Field label="授信额度 JPY"><input type="number" min="0" step="10000" name="creditLimitJpy" defaultValue={customer.creditLimitJpy} disabled={!canWriteCustomers} className={inputClassName} /></Field>
              </div>
              <Field label="公司介绍"><textarea name="companyProfile" rows={4} defaultValue={customer.companyProfile} disabled={!canWriteCustomers} className={textareaClassName} /></Field>
              <Field label="内部备注"><textarea name="notes" rows={4} defaultValue={customer.notes} disabled={!canWriteCustomers} className={textareaClassName} /></Field>
              <div className="flex justify-end"><Submit disabled={!canWriteCustomers}>保存客户详情</Submit></div>
            </form>
          </SectionCard>

          <SectionCard title="合作状态与跟进" description="状态表达当前合作阶段；跟进留痕记录沟通结论与下一步。">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <form key={option.value} action={updateCustomerStatus}>
                  <input type="hidden" name="customerId" value={customer.id} />
                  <input type="hidden" name="status" value={option.value} />
                  <button disabled={!canWriteCustomers || customer.status === option.value} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-cyan-300 disabled:bg-slate-100 disabled:text-slate-400">
                    {option.label}
                  </button>
                </form>
              ))}
            </div>
            <form action={appendCustomerFollowLog} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="customerId" value={customer.id} />
              <Field label="新增跟进记录"><textarea name="note" rows={3} placeholder="记录客户反馈、下一步动作和等待事项" disabled={!canWriteCustomers} className={textareaClassName} /></Field>
              <div className="flex justify-end"><Submit disabled={!canWriteCustomers}>记录跟进</Submit></div>
            </form>
            <div className="mt-4 space-y-2">
              {customer.followLogs.length ? customer.followLogs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">{log.dateLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{log.note}</p>
                </div>
              )) : <EmptyStateCard title="暂无跟进记录" description="销售与运营的沟通结论会沉淀在这里。" />}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="合作需求与任务进度" description="单独追踪客户提出的服务要求，例如巴士 Wi-Fi、餐食、物料或特殊接待。">
            <form action={createCustomerCollaborationTask} className="space-y-3 rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4">
              <input type="hidden" name="customerId" value={customer.id} />
              <Field label="合作需求 / 任务"><input name="title" placeholder="例如：确认巴士 Wi-Fi 配置" disabled={!canWriteCustomers} className={inputClassName} /></Field>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="状态"><TaskStatusSelect disabled={!canWriteCustomers} /></Field>
                <Field label="优先级"><TaskPrioritySelect disabled={!canWriteCustomers} /></Field>
                <Field label="截止日期"><input type="date" name="dueOn" disabled={!canWriteCustomers} className={inputClassName} /></Field>
              </div>
              <Field label="说明"><textarea name="description" rows={3} disabled={!canWriteCustomers} className={textareaClassName} /></Field>
              <div className="flex justify-end"><Submit disabled={!canWriteCustomers}>添加合作任务</Submit></div>
            </form>
            <div className="mt-4 space-y-3">
              {customer.collaborationTasks.length ? customer.collaborationTasks.map((task) => (
                <TaskEditor key={task.id} customerId={customer.id} task={task} canWrite={canWriteCustomers} />
              )) : <EmptyStateCard title="暂无合作需求任务" description="客户提出特殊要求时，在这里建立任务并持续更新进度。" />}
            </div>
          </SectionCard>

          <SectionCard title="历史订单与报价" description="用客户档案快速回看曾经合作的内容，也方便一次性客户未来再次联络。">
            <div className="space-y-3">
              {customer.orderTimeline.map((entry) => (
                <Link key={entry.id} href={`/orders?focus=${encodeURIComponent(entry.id)}`} className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-300">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-semibold text-slate-950">{entry.orderNo}</p><p className="mt-1 text-sm text-slate-600">{entry.title}</p></div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{entry.serviceDateLabel} · {entry.statusLabel} · {entry.revenueLabel}</p>
                </Link>
              ))}
              {!customer.orderTimeline.length ? <EmptyStateCard title="暂无历史订单" description="客户下单后，订单会自动关联到这里。" /> : null}
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="space-y-3">
                {customer.quoteEntries.map((entry) => (
                  <Link key={entry.id} href={`/pricing?query=${encodeURIComponent(entry.quoteNo)}`} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300">
                    <p className="text-sm font-semibold text-slate-950">{entry.quoteNo}</p>
                    <p className="mt-1 text-sm text-slate-600">{entry.title}</p>
                    <p className="mt-2 text-xs text-slate-500">{entry.statusLabel} · {entry.subtotalLabel}</p>
                  </Link>
                ))}
                {!customer.quoteEntries.length ? <EmptyStateCard title="暂无关联报价" description="报价创建后会自动关联到客户档案。" /> : null}
              </div>
            </div>
          </SectionCard>
        </div>
      </section>
    </section>
  );
}

function TaskEditor({ customerId, task, canWrite }: { customerId: string; task: CustomerCollaborationTaskRecord; canWrite: boolean }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <form action={updateCustomerCollaborationTask} className="space-y-3">
        <input type="hidden" name="customerId" value={customerId} />
        <input type="hidden" name="taskId" value={task.id} />
        <div className="flex flex-wrap items-center gap-2"><Badge label={task.priorityLabel} tone={task.priority === "urgent" || task.priority === "high" ? "warning" : "neutral"} /><Badge label={task.statusLabel} tone={task.status === "completed" ? "success" : "info"} /><span className="text-xs text-slate-500">截止 {task.dueOnLabel}</span></div>
        <Field label="任务"><input name="title" defaultValue={task.title} disabled={!canWrite} className={inputClassName} /></Field>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="状态"><TaskStatusSelect defaultValue={task.status} disabled={!canWrite} /></Field>
          <Field label="优先级"><TaskPrioritySelect defaultValue={task.priority} disabled={!canWrite} /></Field>
          <Field label="截止日期"><input type="date" name="dueOn" defaultValue={task.dueOn} disabled={!canWrite} className={inputClassName} /></Field>
        </div>
        <Field label="说明"><textarea name="description" rows={2} defaultValue={task.description} disabled={!canWrite} className={textareaClassName} /></Field>
        <div className="flex flex-wrap justify-end gap-2"><Submit disabled={!canWrite}>保存进度</Submit></div>
      </form>
      <form id={`delete-customer-task-${task.id}`} action={deleteCustomerCollaborationTask}>
        <input type="hidden" name="customerId" value={customerId} />
        <input type="hidden" name="taskId" value={task.id} />
      </form>
      <div className="flex justify-end">
        <ConfirmActionButton formId={`delete-customer-task-${task.id}`} title="删除这项合作任务？" description="删除后无法恢复。" confirmLabel="确认删除" tone="danger" disabled={!canWrite}>删除任务</ConfirmActionButton>
      </div>
    </div>
  );
}

function TaskStatusSelect({ defaultValue = "todo", disabled }: { defaultValue?: string; disabled: boolean }) {
  return <select name="status" defaultValue={defaultValue} disabled={disabled} className={inputClassName}><option value="todo">待处理</option><option value="in_progress">进行中</option><option value="waiting">等待客户</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select>;
}

function TaskPrioritySelect({ defaultValue = "normal", disabled }: { defaultValue?: string; disabled: boolean }) {
  return <select name="priority" defaultValue={defaultValue} disabled={disabled} className={inputClassName}><option value="low">低</option><option value="normal">普通</option><option value="high">高</option><option value="urgent">紧急</option></select>;
}

function Submit({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  return <PendingSubmitButton disabled={disabled} pendingLabel="保存中..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white disabled:bg-slate-300">{children}</PendingSubmitButton>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function resolveCustomerTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "nurturing") return "warning" as const;
  if (status === "settled") return "info" as const;
  return "neutral" as const;
}

const inputClassName = "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:opacity-60";
const textareaClassName = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:opacity-60";
