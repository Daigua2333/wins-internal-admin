"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import {
  appendCustomerFollowLog,
  createCustomer,
  updateCustomerBasics,
  updateCustomerStatus,
} from "@/app/(dashboard)/customers/actions";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { SlideOver } from "@/components/ui/slide-over";
import { StatStrip } from "@/components/ui/stat-strip";
import type { CustomerOperationsRecord } from "@/lib/loaders/admin";

type CustomerOperationsWorkbenchProps = {
  records: CustomerOperationsRecord[];
  canWriteCustomers: boolean;
  initialQuery?: string;
};

const filterItems = ["全部", "长期合作", "跟进中", "已结清", "已停用"];
const statusOptions = [
  { value: "active", label: "长期合作" },
  { value: "nurturing", label: "跟进中" },
  { value: "settled", label: "已结清" },
  { value: "inactive", label: "已停用" },
] as const;

export function CustomerOperationsWorkbench({ records, canWriteCustomers, initialQuery }: CustomerOperationsWorkbenchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeFilter, setActiveFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const haystack = [record.companyName, record.contactName, record.marketSegment, record.statusLabel].join(" ").toLowerCase();
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
    company: record.companyName,
    contact: record.contactName,
    market: record.marketSegment,
    orders: record.orderCountLabel,
    balance: record.creditLimitLabel,
    status: record.statusLabel,
  }));

  const createCustomerForm = (
    <form action={createCustomer} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(248,250,252,0.92))] px-4 py-4">
        <StatStrip
          items={[
            { label: "合作目标", value: "B2B 客户主数据", accent: "text-cyan-700" },
            { label: "关键维度", value: "联系人 / 账期 / 授信", accent: "text-cyan-700" },
            { label: "后续影响", value: "报价 / 建单 / 对账", accent: "text-cyan-700" },
          ]}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <FormSection title="客户主体信息" description="先把公司、联系人和市场标签录完整，作为后续建单、报价和跟进的入口。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="公司名称">
              <input name="companyName" placeholder="Asia Incentive Co." disabled={!canWriteCustomers} className={inputClassName} />
            </Field>
            <Field label="联系人">
              <input name="contactName" placeholder="陈经理" disabled={!canWriteCustomers} className={inputClassName} />
            </Field>
            <Field label="联系邮箱">
              <input name="contactEmail" placeholder="contact@example.com" disabled={!canWriteCustomers} className={inputClassName} />
            </Field>
            <Field label="联系电话">
              <input name="contactPhone" placeholder="+81-90-xxxx-xxxx" disabled={!canWriteCustomers} className={inputClassName} />
            </Field>
            <Field label="市场标签">
              <input name="marketSegment" placeholder="企业会奖 / 教育游学 / FIT" disabled={!canWriteCustomers} className={inputClassName} />
            </Field>
            <Field label="合作状态">
              <select name="status" defaultValue="active" disabled={!canWriteCustomers} className={inputClassName}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>
        <FormSection title="结算与运营参考" description="账期、授信和备注会贯穿报价、订单和后续财务对账的执行链路。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="账期说明">
              <input name="billingTerms" placeholder="月末締め翌月末払い" disabled={!canWriteCustomers} className={inputClassName} />
            </Field>
            <Field label="授信额度 JPY">
              <input type="number" min="0" step="10000" name="creditLimitJpy" placeholder="1000000" disabled={!canWriteCustomers} className={inputClassName} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="备注">
              <textarea name="notes" rows={4} disabled={!canWriteCustomers} placeholder="记录客户偏好、常用语种、结算要求或重点团型" className={textareaClassName} />
            </Field>
          </div>
        </FormSection>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {canWriteCustomers ? "新增后客户会进入客户台账，也会出现在订单创建与报价单管理的客户选项中。" : "当前账号只能查看客户资料。"}
        </p>
        <PendingSubmitButton disabled={!canWriteCustomers} pendingLabel="正在保存客户..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          保存客户
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
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">新增客户入口</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">把客户建档收进弹层后，主工作台可以更专注于筛选客户、回看历史订单和处理跟进。</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canWriteCustomers}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建客户
          </button>
        </div>
      </div>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="客户建档工作台"
        description="在弹层里录入 B2B 客户主数据，不打断当前 CRM 视角。"
        eyebrow="Create Customer"
        maxWidthClassName="max-w-5xl"
      >
        {createCustomerForm}
      </Dialog>

      <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="客户真实工作台" description="在这里直接搜索、筛选、查看订单体量、维护联系人与合作状态。">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索公司、联系人、市场标签"
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
              <span>当前结果 {filteredRecords.length} 家</span>
              <span>{canWriteCustomers ? "选中后可更新客户状态、联系人、账期和跟进记录" : "当前角色仅可查看客户详情"}</span>
            </div>

            <DataTable
              columns={["公司", "联系人", "市场", "订单数", "授信额度", "合作状态"]}
              rows={tableRows}
              selectedRowIndex={selectedRowIndex}
              onRowClick={(_, rowIndex) => setSelectedId(filteredRecords[rowIndex]?.id ?? null)}
              emptyMessage="当前筛选下没有客户。"
            />
          </div>
        </SectionCard>

        <SectionCard title="客户详情与跟进" description="把联系人、账期、授信、状态切换和跟进留痕都集中在一侧。">
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Customer</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.companyName}</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedRecord.contactName}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge label={selectedRecord.statusLabel} tone={resolveCustomerTone(selectedRecord.status)} />
                      <span className="text-xs text-slate-500">{selectedRecord.marketSegment}</span>
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
                  { label: "联系人邮箱", value: selectedRecord.contactEmail || "未设置" },
                  { label: "联系电话", value: selectedRecord.contactPhone || "未设置" },
                  { label: "账期", value: selectedRecord.billingTerms || "未设置" },
                  { label: "授信额度", value: selectedRecord.creditLimitLabel },
                  { label: "历史订单", value: selectedRecord.orderCountLabel },
                  { label: "市场标签", value: selectedRecord.marketSegment },
                ]}
                columnsClassName="md:grid-cols-2 xl:grid-cols-3"
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">合作状态切换</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <form key={option.value} action={updateCustomerStatus}>
                      <input type="hidden" name="customerId" value={selectedRecord.id} />
                      <input type="hidden" name="status" value={option.value} />
                      <button
                        disabled={!canWriteCustomers || selectedRecord.status === option.value}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {option.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>

              <form action={updateCustomerBasics} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <input type="hidden" name="customerId" value={selectedRecord.id} />
                <Field label="公司名称">
                  <input name="companyName" defaultValue={selectedRecord.companyName} disabled={!canWriteCustomers} className={inputClassName} />
                </Field>
                <Field label="联系人">
                  <input name="contactName" defaultValue={selectedRecord.contactName} disabled={!canWriteCustomers} className={inputClassName} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="联系邮箱">
                    <input name="contactEmail" defaultValue={selectedRecord.contactEmail} disabled={!canWriteCustomers} className={inputClassName} />
                  </Field>
                  <Field label="联系电话">
                    <input name="contactPhone" defaultValue={selectedRecord.contactPhone} disabled={!canWriteCustomers} className={inputClassName} />
                  </Field>
                  <Field label="市场标签">
                    <input name="marketSegment" defaultValue={selectedRecord.marketSegment} disabled={!canWriteCustomers} className={inputClassName} />
                  </Field>
                  <Field label="账期说明">
                    <input name="billingTerms" defaultValue={selectedRecord.billingTerms} disabled={!canWriteCustomers} className={inputClassName} />
                  </Field>
                  <Field label="授信额度 JPY">
                    <input type="number" min="0" step="10000" name="creditLimitJpy" defaultValue={selectedRecord.creditLimitJpy} disabled={!canWriteCustomers} className={inputClassName} />
                  </Field>
                </div>
                <input type="hidden" name="status" value={selectedRecord.status} />
                <Field label="备注">
                  <textarea name="notes" rows={4} defaultValue={selectedRecord.notes} disabled={!canWriteCustomers} className={textareaClassName} />
                </Field>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {canWriteCustomers ? "保存后会同步影响订单建单、报价选择和客户统计。" : "当前账号只有查看权限。"}
                  </p>
                  <PendingSubmitButton disabled={!canWriteCustomers} pendingLabel="正在保存客户资料..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                    保存客户资料
                  </PendingSubmitButton>
                </div>
              </form>

              <form action={appendCustomerFollowLog} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <input type="hidden" name="customerId" value={selectedRecord.id} />
                <div>
                  <p className="text-sm font-medium text-slate-900">跟进记录</p>
                  <p className="mt-1 text-sm text-slate-500">把销售沟通、预算反馈、客户偏好和下一步计划沉淀下来，方便团队协同。</p>
                </div>
                <textarea
                  name="note"
                  rows={4}
                  disabled={!canWriteCustomers}
                  placeholder="例如：客户确认 7 月有 3 批一日游团，等待最终人数与预算。"
                  className={textareaClassName}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">{canWriteCustomers ? "提交后会作为客户跟进留痕追加保存。" : "当前账号只有查看权限。"}</p>
                  <PendingSubmitButton disabled={!canWriteCustomers} pendingLabel="正在记录跟进..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                    记录跟进
                  </PendingSubmitButton>
                </div>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">跟进留痕</p>
                    <p className="mt-1 text-sm text-slate-500">把销售和运营对客户的跟进过程留在档案里，后续更容易交接和追踪。</p>
                  </div>
                  <Badge label={`${selectedRecord.followLogs.length} 条`} tone="info" />
                </div>
                <div className="mt-4 space-y-3">
                  {selectedRecord.followLogs.length ? (
                    selectedRecord.followLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-900">{log.dateLabel}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{log.note}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyStateCard title="还没有跟进记录" description="销售和运营的跟进纪要会沉淀在这里，方便团队交接和追踪客户状态。" />
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">历史订单时间线</p>
                    <p className="mt-1 text-sm text-slate-500">快速回看这家客户最近的出团、服务日期和成交金额，方便销售和运营判断合作节奏。</p>
                  </div>
                  <Badge label={`${selectedRecord.orderTimeline.length} 条`} tone="info" />
                </div>
                <div className="mt-4 space-y-3">
                  {selectedRecord.orderTimeline.length ? (
                    selectedRecord.orderTimeline.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{entry.orderNo}</p>
                            <p className="mt-1 text-sm text-slate-600">{entry.title}</p>
                          </div>
                          <Badge label={entry.statusLabel} tone={resolveOrderTone(entry.statusLabel)} />
                        </div>
                        <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">服务日期</p>
                            <p className="mt-1 font-medium text-slate-900">{entry.serviceDateLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">订单营收</p>
                            <p className="mt-1 font-medium text-slate-900">{entry.revenueLabel}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link
                            href={`/orders?focus=${encodeURIComponent(entry.id)}`}
                            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                          >
                            打开订单详情
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyStateCard title="还没有历史订单" description="这家客户一旦开始下单，这里会按时间线展示最近的订单状态、服务日期和营收。" />
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">报价单关联视图</p>
                    <p className="mt-1 text-sm text-slate-500">把同一客户的报价往来和有效期放在一起，方便追踪未转单和待确认项目。</p>
                  </div>
                  <Badge label={`${selectedRecord.quoteEntries.length} 份`} tone="info" />
                </div>
                <div className="mt-4 space-y-3">
                  {selectedRecord.quoteEntries.length ? (
                    selectedRecord.quoteEntries.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{entry.quoteNo}</p>
                            <p className="mt-1 text-sm text-slate-600">{entry.title}</p>
                          </div>
                          <Badge label={entry.statusLabel} tone={resolveQuoteTone(entry.statusLabel)} />
                        </div>
                        <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">服务日期</p>
                            <p className="mt-1 font-medium text-slate-900">{entry.serviceDateLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">有效期</p>
                            <p className="mt-1 font-medium text-slate-900">{entry.validUntilLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">报价金额</p>
                            <p className="mt-1 font-medium text-slate-900">{entry.subtotalLabel}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyStateCard title="还没有关联报价单" description="后续这个客户一旦有报价往来，这里会集中显示有效期、状态和报价金额。" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyStateCard title="还没有选中客户" description="从左侧客户列表里点选一家客户，右侧就会展开联系人、账期、历史订单和报价关联信息。" />
          )}
        </SectionCard>
      </section>

      <SlideOver
        open={detailDrawerOpen && !!selectedRecord}
        onClose={() => setDetailDrawerOpen(false)}
        title={selectedRecord?.companyName ?? "客户详情"}
        description="把客户合作状态、订单关系和销售跟进放到一个抽屉里，方便在不离开当前工作台的情况下快速查看。"
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Customer Brief</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.companyName}</p>
              <p className="mt-1 text-sm text-slate-600">{selectedRecord.contactName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={selectedRecord.statusLabel} tone={resolveCustomerTone(selectedRecord.status)} />
                <span className="text-xs text-slate-500">{selectedRecord.marketSegment}</span>
              </div>
            </div>

            <StatStrip
              items={[
                { label: "授信额度", value: selectedRecord.creditLimitLabel },
                { label: "历史订单", value: selectedRecord.orderCountLabel },
                { label: "联系人邮箱", value: selectedRecord.contactEmail || "未设置" },
                { label: "联系电话", value: selectedRecord.contactPhone || "未设置" },
              ]}
              columnsClassName="md:grid-cols-2"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">最近跟进</p>
              <div className="mt-3 space-y-3">
                {selectedRecord.followLogs.length ? (
                  selectedRecord.followLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-900">{log.dateLabel}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{log.note}</p>
                    </div>
                  ))
                ) : (
                  <EmptyStateCard title="还没有跟进记录" description="后续提交的销售或运营跟进会优先显示在这里。" />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">最近订单</p>
                <Badge label={`${selectedRecord.orderTimeline.length} 条`} tone="info" />
              </div>
              <div className="mt-3 space-y-3">
                {selectedRecord.orderTimeline.length ? (
                  selectedRecord.orderTimeline.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{entry.orderNo}</p>
                          <p className="mt-1 text-sm text-slate-600">{entry.title}</p>
                        </div>
                        <Badge label={entry.statusLabel} tone={resolveOrderTone(entry.statusLabel)} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span>{entry.serviceDateLabel}</span>
                        <span>{entry.revenueLabel}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyStateCard title="还没有历史订单" description="订单成交后，这里的客户关系时间线会更完整。" />
                )}
              </div>
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

function resolveCustomerTone(status: string) {
  if (status === "active") return "success" as const;
  if (status === "nurturing") return "warning" as const;
  if (status === "settled") return "info" as const;
  return "neutral" as const;
}

function resolveOrderTone(statusLabel: string) {
  if (statusLabel === "已完成") return "success";
  if (statusLabel === "已取消") return "neutral";
  if (statusLabel === "进行中") return "warning";
  return "info";
}

function resolveQuoteTone(statusLabel: string) {
  if (statusLabel === "已接受") return "success";
  if (statusLabel === "已拒绝" || statusLabel === "已过期") return "neutral";
  if (statusLabel === "待确认") return "warning";
  return "info";
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";
