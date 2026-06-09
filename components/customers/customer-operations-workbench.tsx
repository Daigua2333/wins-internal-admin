"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Building2, Plus, Search } from "lucide-react";

import { createCustomer } from "@/app/(dashboard)/customers/actions";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import type { CustomerOperationsRecord } from "@/lib/loaders/admin";

type CustomerOperationsWorkbenchProps = {
  records: CustomerOperationsRecord[];
  canWriteCustomers: boolean;
  initialQuery?: string;
};

const typeFilters = ["全部", "长期合作", "短期合作", "一次性客户"];

export function CustomerOperationsWorkbench({ records, canWriteCustomers, initialQuery }: CustomerOperationsWorkbenchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeType, setActiveType] = useState("全部");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesType = activeType === "全部" || record.customerTypeLabel === activeType;
      const matchesQuery =
        !normalized ||
        [
          record.companyName,
          record.companyProfile,
          record.contactName,
          record.marketSegment,
          record.wechatId,
          record.lineId,
          record.statusLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      return matchesType && matchesQuery;
    });
  }, [activeType, query, records]);

  const tableRows = filteredRecords.map((record) => ({
    company: record.companyName,
    type: record.customerTypeLabel,
    contact: record.contactName,
    market: record.marketSegment,
    orders: record.orderCountLabel,
    tasks: `${record.collaborationTasks.filter((task) => !["completed", "cancelled"].includes(task.status)).length} 项`,
    status: record.statusLabel,
  }));

  return (
    <section className="space-y-4">
      <SectionCard
        title="客户档案总览"
        description="一级页面只负责快速识别客户类型、公司背景、订单体量与待办需求；详情和跟进统一进入客户二级档案。"
        action={
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canWriteCustomers}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            建立客户档案
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索公司、联系人、微信、LINE 或业务类型"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {typeFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveType(filter)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeType === filter
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredRecords.length ? (
            <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredRecords.slice(0, 6).map((record) => (
                <Link
                  key={record.id}
                  href={`/customers/${record.id}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><Building2 className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-950">{record.companyName}</p>
                        <p className="mt-1 text-sm text-slate-500">{record.contactName} · {record.marketSegment}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-cyan-700" />
                  </div>
                  <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">
                    {record.companyProfile || "尚未填写公司介绍，可进入客户详情补充。"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge label={record.customerTypeLabel} tone={record.customerType === "long_term" ? "success" : "info"} />
                    <Badge label={record.statusLabel} tone={resolveCustomerTone(record.status)} />
                    <Badge label={record.orderCountLabel} tone="neutral" />
                    <Badge
                      label={`${record.collaborationTasks.filter((task) => !["completed", "cancelled"].includes(task.status)).length} 项待办`}
                      tone="warning"
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyStateCard title="没有匹配的客户档案" description="调整搜索或类型筛选，也可以建立新的长期、短期或一次性客户档案。" />
          )}

          <DataTable columns={["公司", "客户类型", "联系人", "业务类型", "订单数", "合作待办", "当前状态"]} rows={tableRows} emptyMessage="当前筛选下没有客户。" />

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRecords.map((record) => (
              <Link key={record.id} href={`/customers/${record.id}`} className="inline-flex min-h-11 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700">
                <span className="min-w-0 truncate">{record.companyName}</span>
                <span className="ml-3 shrink-0 text-xs">打开档案 →</span>
              </Link>
            ))}
          </div>
        </div>
      </SectionCard>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="建立客户档案"
        description="无论长期合作、短期项目还是一次性客户，都先留下完整档案，未来可以随时检索和再次合作。"
        eyebrow="Create Customer"
        maxWidthClassName="max-w-5xl"
      >
        <CustomerCreateForm canWrite={canWriteCustomers} />
      </Dialog>
    </section>
  );
}

function CustomerCreateForm({ canWrite }: { canWrite: boolean }) {
  return (
    <form action={createCustomer} className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <FormSection title="公司与合作分类" description="客户类型用于长期归档和快速筛选，合作状态用于表达当前推进阶段。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="公司或客户名称"><input name="companyName" disabled={!canWrite} className={inputClassName} /></Field>
            <Field label="客户类型">
              <select name="customerType" defaultValue="long_term" disabled={!canWrite} className={inputClassName}>
                <option value="long_term">长期合作</option><option value="short_term">短期合作</option><option value="one_time">一次性客户</option>
              </select>
            </Field>
            <Field label="业务类型 / 市场标签"><input name="marketSegment" placeholder="中文一日游 / 企业会奖 / FIT" disabled={!canWrite} className={inputClassName} /></Field>
            <Field label="合作状态">
              <select name="status" defaultValue="active" disabled={!canWrite} className={inputClassName}>
                <option value="active">合作中</option><option value="nurturing">跟进中</option><option value="settled">已结清</option><option value="inactive">已停用</option>
              </select>
            </Field>
          </div>
          <div className="mt-4"><Field label="公司介绍"><textarea name="companyProfile" rows={4} placeholder="业务背景、合作特点、常见团型或未来机会" disabled={!canWrite} className={textareaClassName} /></Field></div>
        </FormSection>
        <FormSection title="联系人与结算资料" description="微信和 LINE 会与邮箱、电话一起保存在客户二级档案中。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="联系人"><input name="contactName" disabled={!canWrite} className={inputClassName} /></Field>
            <Field label="联系电话"><input name="contactPhone" disabled={!canWrite} className={inputClassName} /></Field>
            <Field label="联系邮箱"><input type="email" name="contactEmail" disabled={!canWrite} className={inputClassName} /></Field>
            <Field label="微信"><input name="wechatId" disabled={!canWrite} className={inputClassName} /></Field>
            <Field label="LINE"><input name="lineId" disabled={!canWrite} className={inputClassName} /></Field>
            <Field label="账期说明"><input name="billingTerms" disabled={!canWrite} className={inputClassName} /></Field>
            <Field label="授信额度 JPY"><input type="number" min="0" step="10000" name="creditLimitJpy" disabled={!canWrite} className={inputClassName} /></Field>
          </div>
          <div className="mt-4"><Field label="备注"><textarea name="notes" rows={3} disabled={!canWrite} className={textareaClassName} /></Field></div>
        </FormSection>
      </div>
      <div className="flex justify-end">
        <PendingSubmitButton disabled={!canWrite} pendingLabel="正在建立档案..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white disabled:bg-slate-300">
          保存并打开客户档案
        </PendingSubmitButton>
      </div>
    </form>
  );
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

const inputClassName = "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:opacity-60";
const textareaClassName = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:opacity-60";
