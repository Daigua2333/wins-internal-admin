"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { convertQuotationToOrder, createQuotation, deleteQuotation, updateQuotationBasics, updateQuotationStatus } from "@/app/(dashboard)/pricing/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { SlideOver } from "@/components/ui/slide-over";
import { StatStrip } from "@/components/ui/stat-strip";
import type { OrderCreateOption, PricingOperationsRecord } from "@/lib/loaders/admin";

type QuotationOperationsWorkbenchProps = {
  records: PricingOperationsRecord[];
  customers: OrderCreateOption[];
  canWriteQuotations: boolean;
  canConvertToOrder: boolean;
  initialQuery?: string;
  initialFilter?: string;
};

const filterItems = ["全部", "待确认", "已发送", "已接受", "已过期"];
const statusOptions = [
  { value: "draft", label: "待确认" },
  { value: "sent", label: "已发送" },
  { value: "accepted", label: "已接受" },
  { value: "expired", label: "已过期" },
  { value: "rejected", label: "已拒绝" },
] as const;

function resolveInitialStatusFilter(value: string | undefined, allowedFilters: string[]) {
  return value && allowedFilters.includes(value) ? value : "全部";
}

export function QuotationOperationsWorkbench({
  records,
  customers,
  canWriteQuotations,
  canConvertToOrder,
  initialQuery,
  initialFilter,
}: QuotationOperationsWorkbenchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeFilter, setActiveFilter] = useState(resolveInitialStatusFilter(initialFilter, filterItems));
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  useEffect(() => {
    setActiveFilter(resolveInitialStatusFilter(initialFilter, filterItems));
  }, [initialFilter]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const haystack = [record.quoteNo, record.customerName, record.title, record.statusLabel].join(" ").toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      const matchesFilter = activeFilter === "全部" || record.statusLabel === activeFilter;
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, query, records]);

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !filteredRecords.some((record) => record.id === selectedId)) {
      setSelectedId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedId]);

  const selectedRecord = useMemo(
    () => filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? null,
    [filteredRecords, selectedId],
  );
  const selectedRowIndex = selectedRecord ? filteredRecords.findIndex((record) => record.id === selectedRecord.id) : undefined;

  useEffect(() => {
    if (!selectedRecord) {
      setDetailDrawerOpen(false);
    }
  }, [selectedRecord]);

  const tableRows = filteredRecords.map((record) => ({
    quoteNo: record.quoteNo,
    client: record.customerName,
    product: record.title,
    issueDate: record.serviceDateLabel,
    validUntil: record.validUntilLabel,
    status: record.statusLabel,
    subtotal: record.subtotalLabel,
  }));

  const createQuotationForm = (
    <form action={createQuotation} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(248,250,252,0.92))] px-4 py-4">
        <StatStrip
          items={[
            { label: "报价目标", value: "商机转订单前置环节", accent: "text-cyan-700" },
            { label: "关键维度", value: "客户 / 金额 / 有效期", accent: "text-cyan-700" },
            { label: "后续影响", value: "转单 / 毛利预测", accent: "text-cyan-700" },
          ]}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <FormSection title="报价主体信息" description="先确定客户、标题和服务日期，让这份报价先具备明确的业务指向。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="客户">
              <select name="customerId" disabled={!canWriteQuotations} className={inputClassName} defaultValue="">
                <option value="" disabled>
                  选择客户
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="报价标题">
              <input name="title" placeholder="富士山一日游 / 东京 3 天 2 夜" disabled={!canWriteQuotations} className={inputClassName} />
            </Field>
            <Field label="服务日期">
              <input type="date" name="serviceDate" disabled={!canWriteQuotations} className={inputClassName} />
            </Field>
            <Field label="有效期">
              <input type="date" name="validUntil" disabled={!canWriteQuotations} className={inputClassName} />
            </Field>
          </div>
        </FormSection>
        <FormSection title="金额结构与补充说明" description="状态、金额和成本预测决定这份报价是否能快速进入订单执行链。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="报价状态">
              <select name="status" defaultValue="draft" disabled={!canWriteQuotations} className={inputClassName}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="报价金额 JPY">
              <input type="number" min="0" step="10000" name="subtotalJpy" placeholder="320000" disabled={!canWriteQuotations} className={inputClassName} />
            </Field>
            <Field label="预计成本 JPY">
              <input type="number" min="0" step="10000" name="totalCostJpy" placeholder="214000" disabled={!canWriteQuotations} className={inputClassName} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="备注">
              <textarea name="notes" rows={4} disabled={!canWriteQuotations} placeholder="记录客户反馈、版本说明或有效期变更" className={textareaClassName} />
            </Field>
          </div>
        </FormSection>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {canWriteQuotations ? "创建后会进入报价台账，也会在客户页的报价关联视图里立即出现。" : "当前账号只能查看报价资料。"}
        </p>
        <PendingSubmitButton disabled={!canWriteQuotations} pendingLabel="正在保存报价..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          保存报价单
        </PendingSubmitButton>
      </div>
    </form>
  );

  return (
    <section className="space-y-4">
      <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">Quick Create</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">新增报价入口</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">把报价创建收进弹层后，主工作台可以更专注于跟进状态、金额结构和转单关系。</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canWriteQuotations}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建报价
          </button>
        </div>
      </div>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="报价创建工作台"
        description="在弹层里完成客户报价录入，不打断当前报价跟进与转单视角。"
        eyebrow="Create Quotation"
        maxWidthClassName="max-w-5xl"
      >
        {createQuotationForm}
      </Dialog>

      <section className="grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="报价单真实工作台" description="集中查看报价状态、有效期、客户与金额，并在右侧持续维护报价内容。">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索报价号、客户、产品名称"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {filterItems.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      activeFilter === filter
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>当前结果 {filteredRecords.length} 份</span>
              <span>{canWriteQuotations ? "选中后可更新报价状态、金额、有效期与备注" : "当前角色仅可查看报价详情"}</span>
            </div>

            <DataTable
              columns={["报价号", "客户", "产品", "出单日期", "有效期", "状态", "金额"]}
              rows={tableRows}
              selectedRowIndex={selectedRowIndex}
              onRowClick={(_, rowIndex) => setSelectedId(filteredRecords[rowIndex]?.id ?? null)}
              emptyMessage="当前筛选下没有报价单。"
            />
          </div>
        </SectionCard>

        <SectionCard title="报价详情与维护" description="在一个侧栏里持续维护有效期、状态、金额结构和备注。">
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Quote</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.quoteNo}</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedRecord.title}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge label={selectedRecord.statusLabel} tone={resolveQuoteTone(selectedRecord.status)} />
                      <span className="text-xs text-slate-500">{selectedRecord.customerName}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/customers/${selectedRecord.customerId}`}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                      >
                        打开客户档案
                      </Link>
                      {selectedRecord.linkedOrderId && selectedRecord.linkedOrderNo ? (
                        <>
                          <Badge label={`已转订单 ${selectedRecord.linkedOrderNo}`} tone="success" />
                          <Link
                            href={`/orders?focus=${encodeURIComponent(selectedRecord.linkedOrderId)}`}
                            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                          >
                            打开订单
                          </Link>
                        </>
                      ) : (
                        <form action={convertQuotationToOrder}>
                          <input type="hidden" name="quotationId" value={selectedRecord.id} />
                          <PendingSubmitButton
                            disabled={!canConvertToOrder}
                            pendingLabel="正在转为订单..."
                            className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            转为订单
                          </PendingSubmitButton>
                        </form>
                      )}
                      <form id={`delete-quotation-${selectedRecord.id}`} action={deleteQuotation}>
                        <input type="hidden" name="quotationId" value={selectedRecord.id} />
                      </form>
                      <ConfirmActionButton
                        formId={`delete-quotation-${selectedRecord.id}`}
                        title="确认删除这份报价？"
                        description="未转为订单的报价可以删除；已关联订单的报价建议保留用于追溯。"
                        confirmLabel="确认删除"
                        disabled={!canWriteQuotations || Boolean(selectedRecord.linkedOrderId)}
                      >
                        删除报价
                      </ConfirmActionButton>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailDrawerOpen(true)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                  >
                    打开侧边详情
                  </button>
                </div>
              </div>

              <StatStrip
                items={[
                  { label: "客户", value: selectedRecord.customerName },
                  { label: "服务日期", value: selectedRecord.serviceDateLabel },
                  { label: "有效期", value: selectedRecord.validUntilLabel },
                  { label: "报价金额", value: selectedRecord.subtotalLabel },
                  { label: "预计成本", value: selectedRecord.totalCostLabel },
                  { label: "预计毛利", value: selectedRecord.grossProfitLabel },
                  { label: "毛利率", value: selectedRecord.grossMarginLabel },
                ]}
                columnsClassName="md:grid-cols-2 xl:grid-cols-3"
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">状态切换</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <form key={option.value} action={updateQuotationStatus}>
                      <input type="hidden" name="quotationId" value={selectedRecord.id} />
                      <input type="hidden" name="status" value={option.value} />
                      <button
                        disabled={!canWriteQuotations || selectedRecord.status === option.value}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {option.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>

              <form action={updateQuotationBasics} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <input type="hidden" name="quotationId" value={selectedRecord.id} />
                <Field label="客户">
                  <select name="customerId" defaultValue={selectedRecord.customerId} disabled={!canWriteQuotations} className={inputClassName}>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="报价标题">
                  <input name="title" defaultValue={selectedRecord.title} disabled={!canWriteQuotations} className={inputClassName} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="服务日期">
                    <input type="date" name="serviceDate" defaultValue={selectedRecord.serviceDate} disabled={!canWriteQuotations} className={inputClassName} />
                  </Field>
                  <Field label="有效期">
                    <input type="date" name="validUntil" defaultValue={selectedRecord.validUntil} disabled={!canWriteQuotations} className={inputClassName} />
                  </Field>
                  <Field label="报价状态">
                    <select name="status" defaultValue={selectedRecord.status} disabled={!canWriteQuotations} className={inputClassName}>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="报价金额 JPY">
                    <input type="number" min="0" step="10000" name="subtotalJpy" defaultValue={selectedRecord.subtotalJpy} disabled={!canWriteQuotations} className={inputClassName} />
                  </Field>
                  <Field label="预计成本 JPY">
                    <input type="number" min="0" step="10000" name="totalCostJpy" defaultValue={selectedRecord.totalCostJpy} disabled={!canWriteQuotations} className={inputClassName} />
                  </Field>
                </div>
                <Field label="备注">
                  <textarea name="notes" rows={4} defaultValue={selectedRecord.notes} disabled={!canWriteQuotations} className={textareaClassName} />
                </Field>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {canWriteQuotations
                      ? "保存后会同步影响客户页报价关联和报价统计。"
                      : canConvertToOrder
                        ? "当前账号可转订单，但不能修改报价资料。"
                        : "当前账号只有查看权限。"}
                  </p>
                  <PendingSubmitButton disabled={!canWriteQuotations} pendingLabel="正在保存报价资料..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                    保存报价资料
                  </PendingSubmitButton>
                </div>
              </form>
            </div>
          ) : (
            <EmptyStateCard title="还没有选中报价" description="从左侧报价列表里点选一份报价，右侧就会展开状态、金额结构和转订单动作。" />
          )}
        </SectionCard>
      </section>

      <SlideOver
        open={detailDrawerOpen && !!selectedRecord}
        onClose={() => setDetailDrawerOpen(false)}
        title={selectedRecord?.quoteNo ?? "报价详情"}
        description="把报价状态、金额结构和转订单关系集中到一个抽屉里，方便在不离开当前页的情况下快速判断下一步动作。"
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quote Brief</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.quoteNo}</p>
              <p className="mt-1 text-sm text-slate-600">{selectedRecord.title}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={selectedRecord.statusLabel} tone={resolveQuoteTone(selectedRecord.status)} />
                <span className="text-xs text-slate-500">{selectedRecord.customerName}</span>
              </div>
            </div>

            <StatStrip
              items={[
                { label: "服务日期", value: selectedRecord.serviceDateLabel },
                { label: "有效期", value: selectedRecord.validUntilLabel },
                { label: "报价金额", value: selectedRecord.subtotalLabel },
                { label: "预计毛利", value: selectedRecord.grossProfitLabel },
              ]}
              columnsClassName="md:grid-cols-2"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">转单关系</p>
              <div className="mt-3">
                {selectedRecord.linkedOrderId && selectedRecord.linkedOrderNo ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={`已转订单 ${selectedRecord.linkedOrderNo}`} tone="success" />
                      <span className="text-sm text-emerald-900">这份报价已经进入订单执行链。</span>
                    </div>
                    <Link
                      href={`/orders?focus=${encodeURIComponent(selectedRecord.linkedOrderId)}`}
                      className="mt-3 inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                    >
                      打开对应订单
                    </Link>
                  </div>
                ) : (
                  <EmptyStateCard title="还没有转单" description="报价被客户确认后，可以从主工作台直接转成订单。" />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">补充说明</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{selectedRecord.notes || "当前没有备注说明。"}</p>
            </div>
          </div>
        ) : null}
      </SlideOver>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function resolveQuoteTone(status: string) {
  if (status === "accepted") return "success" as const;
  if (status === "draft") return "warning" as const;
  if (status === "expired" || status === "rejected") return "neutral" as const;
  return "info" as const;
}

const inputClassName =
  "min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white";

const textareaClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white";
