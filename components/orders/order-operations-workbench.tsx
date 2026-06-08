"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import {
  addOrderCost,
  archiveOrder,
  deleteOrder,
  deleteOrderCost,
  restoreArchivedOrder,
  updateOrderBasics,
  updateOrderCost,
  updateOrderDispatch,
  updateOrderStatus,
} from "@/app/(dashboard)/orders/actions";
import { OrderCreatePanel } from "@/components/orders/order-create-panel";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { SlideOver } from "@/components/ui/slide-over";
import { StatStrip } from "@/components/ui/stat-strip";
import type { DispatchResourceOptions, OperationsReminderSnapshot, OrderCostEntry, OrderCreateOption, OrderOperationsRecord } from "@/lib/loaders/admin";

type WorkbenchFeedback = {
  type: "success" | "error";
  message: string;
  detail?: string;
} | null;

type OrderOperationsWorkbenchProps = {
  records: OrderOperationsRecord[];
  customers: OrderCreateOption[];
  assignees: OrderCreateOption[];
  dispatchOptions: DispatchResourceOptions;
  costEntries: OrderCostEntry[];
  canWriteOrders: boolean;
  initialSelectedId?: string;
  initialQuery?: string;
  initialFilter?: string;
  reminders: OperationsReminderSnapshot;
  feedback?: WorkbenchFeedback;
  defaultStartTime?: string;
  reminderLeadDays?: number;
  targetGrossMarginRate?: number;
};

const statusFilterItems = ["全部", "草稿", "待确认", "已排车", "进行中", "已完成", "已取消"];
const statusTransitionItems = [
  { value: "pending_confirmation", label: "待确认" },
  { value: "scheduled", label: "已排车" },
  { value: "in_progress", label: "进行中" },
  { value: "completed", label: "已完成" },
];

function resolveInitialStatusFilter(value: string | undefined, allowedFilters: string[]) {
  return value && allowedFilters.includes(value) ? value : "全部";
}

export function OrderOperationsWorkbench({
  records,
  customers,
  assignees,
  dispatchOptions,
  costEntries,
  canWriteOrders,
  initialSelectedId,
  initialQuery,
  initialFilter,
  reminders,
  feedback = null,
  defaultStartTime,
  reminderLeadDays,
  targetGrossMarginRate,
}: OrderOperationsWorkbenchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeFilter, setActiveFilter] = useState(resolveInitialStatusFilter(initialFilter, statusFilterItems));
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    records.some((record) => record.id === initialSelectedId) ? initialSelectedId ?? null : records[0]?.id ?? null,
  );
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [archiveQuery, setArchiveQuery] = useState("");
  const [archiveStartDate, setArchiveStartDate] = useState("");
  const [archiveEndDate, setArchiveEndDate] = useState("");
  const [archiveVisibleCount, setArchiveVisibleCount] = useState(12);

  useEffect(() => {
    if (initialSelectedId && records.some((record) => record.id === initialSelectedId)) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId, records]);

  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  useEffect(() => {
    setActiveFilter(resolveInitialStatusFilter(initialFilter, statusFilterItems));
  }, [initialFilter]);

  const activeRecords = useMemo(() => records.filter((record) => !record.archivedAt), [records]);
  const archivedRecords = useMemo(
    () =>
      records
        .filter((record) => Boolean(record.archivedAt))
        .sort((left, right) => (right.serviceDate || "").localeCompare(left.serviceDate || "")),
    [records],
  );

  const pendingApprovalRecords = useMemo(
    () =>
      activeRecords
        .filter((record) => record.status === "draft" || record.status === "pending_confirmation")
        .sort((left, right) => (left.serviceDate || "9999-12-31").localeCompare(right.serviceDate || "9999-12-31")),
    [activeRecords],
  );

  const filteredRecords = useMemo(() => {
    return activeRecords.filter((record) => {
      const haystack = [record.orderNo, record.customerName, record.title, record.assigneeName, record.statusLabel].join(" ").toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      const matchesFilter = activeFilter === "全部" || record.statusLabel === activeFilter;
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, activeRecords, query]);

  const filteredArchivedRecords = useMemo(() => {
    const normalizedQuery = archiveQuery.trim().toLowerCase();

    return archivedRecords.filter((record) => {
      const haystack = [
        record.archiveCode,
        record.orderNo,
        record.customerName,
        record.title,
        record.archiveSummary,
        record.archiveKeywords,
        record.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesStartDate = !archiveStartDate || Boolean(record.serviceDate && record.serviceDate >= archiveStartDate);
      const matchesEndDate = !archiveEndDate || Boolean(record.serviceDate && record.serviceDate <= archiveEndDate);

      return matchesQuery && matchesStartDate && matchesEndDate;
    });
  }, [archiveEndDate, archiveQuery, archiveStartDate, archivedRecords]);

  useEffect(() => {
    if (!selectedId || !records.some((record) => record.id === selectedId)) {
      setSelectedId(filteredRecords[0]?.id ?? archivedRecords[0]?.id ?? null);
    }
  }, [archivedRecords, filteredRecords, records, selectedId]);

  useEffect(() => {
    setArchiveVisibleCount(12);
  }, [archiveEndDate, archiveQuery, archiveStartDate]);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? null,
    [filteredRecords, records, selectedId],
  );
  const canEditSelectedRecord = Boolean(canWriteOrders && selectedRecord && !selectedRecord.archivedAt);
  const selectedCostEntries = useMemo(
    () => (selectedRecord ? costEntries.filter((entry) => entry.orderId === selectedRecord.id) : []),
    [costEntries, selectedRecord],
  );
  const conflicts = selectedRecord ? detectResourceConflicts(selectedRecord, records) : [];
  const timelineItems = selectedRecord ? buildOrderTimeline(selectedRecord, selectedCostEntries) : [];
  useEffect(() => {
    if (!selectedCostEntries.some((entry) => entry.id === editingCostId)) {
      setEditingCostId(null);
    }
  }, [editingCostId, selectedCostEntries]);

  useEffect(() => {
    if (!selectedRecord) {
      setEditorOpen(false);
    }
  }, [selectedRecord]);

  function openOrderEditor(orderId: string) {
    setSelectedId(orderId);
    setEditorOpen(true);
  }

  return (
    <section className="space-y-4">
      <SectionCard
        title="订单工作台"
        description="优先处理创建、编辑和删除订单。订单详情、调度与成本维护已收进二级编辑界面，主页面保持清爽。"
        action={
          <button
            type="button"
            onClick={() => setCreateOrderOpen(true)}
            disabled={!canWriteOrders}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-4 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            创建订单
          </button>
        }
      >
        <div className="space-y-4">
          {feedback ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              <p className="font-medium">{feedback.message}</p>
              {feedback.detail ? <p className="mt-1 leading-6 opacity-80">{feedback.detail}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索订单号、客户、行程、负责人"
                className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {statusFilterItems.map((filter) => (
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

          <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>当前结果 {filteredRecords.length} 条，归档订单 {archivedRecords.length} 条</span>
            <span>{canWriteOrders ? "每条订单可直接进入编辑或删除" : "当前角色仅可查看订单"}</span>
          </div>

          {filteredRecords.length ? (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <article
                  key={record.id}
                  className={`rounded-[1.35rem] border bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:border-cyan-200 hover:shadow-[0_16px_32px_rgba(15,23,42,0.07)] ${
                    selectedRecord?.id === record.id ? "border-cyan-300 ring-2 ring-cyan-100" : "border-slate-200"
                  }`}
                >
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(160px,0.45fr)_minmax(150px,0.4fr)_minmax(220px,0.55fr)] xl:items-center">
                    <button type="button" onClick={() => openOrderEditor(record.id)} className="min-w-0 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-semibold text-slate-950">{record.orderNo}</p>
                        <Badge label={record.statusLabel} tone={resolveOrderTone(record.status)} />
                      </div>
                      <p className="mt-2 break-words text-base font-medium text-slate-900">{record.title}</p>
                      <p className="mt-1 break-words text-sm text-slate-500">{record.customerName}</p>
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">服务日期</p>
                      <p className="mt-1 break-words text-sm font-medium text-slate-800">{formatOrderDate(record.serviceDate)}</p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">金额</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-950">{record.revenueLabel}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() => openOrderEditor(record.id)}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        编辑
                      </button>
                      <form id={`delete-order-${record.id}`} action={deleteOrder} className="hidden">
                        <input type="hidden" name="orderId" value={record.id} />
                      </form>
                      <ConfirmActionButton
                        formId={`delete-order-${record.id}`}
                        title="确认删除这张订单？"
                        description={`订单 ${record.orderNo} 删除后将从订单工作台、日历、利润和财务视图中移除。`}
                        confirmLabel="确认删除订单"
                        tone="danger"
                        disabled={!canWriteOrders}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </ConfirmActionButton>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyStateCard title="当前筛选下没有订单" description="换一个状态筛选或搜索词，或者直接创建一张新订单。" />
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="订单归档与历史检索"
        description="已完成或已取消的订单可以归档保存。后续核对时，可按服务日期、订单号、客户、行程内容、归档摘要或关键词快速定位。"
        action={<Badge label={`${archivedRecords.length} 条归档`} tone={archivedRecords.length ? "info" : "neutral"} />}
      >
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px]">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={archiveQuery}
                onChange={(event) => setArchiveQuery(event.target.value)}
                placeholder="搜索订单号、客户、行程、归档摘要或关键词"
                className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <input
              type="date"
              value={archiveStartDate}
              onChange={(event) => setArchiveStartDate(event.target.value)}
              aria-label="归档检索开始日期"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white"
            />
            <input
              type="date"
              value={archiveEndDate}
              onChange={(event) => setArchiveEndDate(event.target.value)}
              aria-label="归档检索结束日期"
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>当前命中 {filteredArchivedRecords.length} 条</span>
            <span>归档记录默认只读，如需修改可先移出归档</span>
          </div>

          {filteredArchivedRecords.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {filteredArchivedRecords.slice(0, archiveVisibleCount).map((record) => (
                <article key={record.id} className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge label={record.archiveCode ?? "已归档"} tone="info" />
                        <Badge label={record.statusLabel} tone={resolveOrderTone(record.status)} />
                        <span className="text-xs text-slate-500">{formatArchiveDate(record.archivedAt)}</span>
                      </div>
                      <p className="mt-2 break-words text-base font-semibold text-slate-950">{record.title}</p>
                      <p className="mt-1 break-words text-sm text-slate-500">
                        {record.orderNo} · {record.customerName} · {formatOrderDate(record.serviceDate)}
                      </p>
                      <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-slate-600">
                        {record.archiveSummary || record.notes || "该归档订单暂无摘要。"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openOrderEditor(record.id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                      >
                        查看归档
                      </button>
                      {canWriteOrders ? (
                        <form action={restoreArchivedOrder}>
                          <input type="hidden" name="orderId" value={record.id} />
                          <button className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-800 transition hover:bg-cyan-100">
                            移出归档
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title={archivedRecords.length ? "没有匹配的归档订单" : "还没有归档订单"}
              description={
                archivedRecords.length
                  ? "调整日期范围或关键词，再试着搜索订单号、客户名、行程标题或归档摘要。"
                  : "完成或取消订单后，可以在编辑界面中归档，之后会出现在这里供历史核对。"
              }
            />
          )}
          {filteredArchivedRecords.length > archiveVisibleCount ? (
            <button
              type="button"
              onClick={() => setArchiveVisibleCount((current) => current + 12)}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              加载更多归档订单
            </button>
          ) : null}
        </div>
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <SectionCard
          title="近期运营提醒"
          description="保留近期待出团、报价到期和车辆点检提醒，辅助订单处理但不压过主工作台。"
          action={<Badge label={`${reminders.items.length} 条提醒`} tone={reminders.items.length ? "warning" : "success"} />}
        >
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["出团提醒", `${reminders.counts.order} 条`],
              ["报价提醒", `${reminders.counts.quote} 条`],
              ["车辆提醒", `${reminders.counts.vehicle} 条`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {reminders.items.length ? (
              reminders.items.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  href={item.href as Route}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={item.categoryLabel} tone={item.tone} />
                      <p className="break-words text-sm font-medium text-slate-900">{item.title}</p>
                    </div>
                    <p className="mt-1 break-words text-sm text-slate-600">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">{item.dateLabel}</span>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                当前没有近期待处理提醒，订单队列较为平稳。
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="待审批队列"
          description="只保留草稿和待确认订单，方便快速进入编辑或批准进入排车状态。"
          action={<Badge label={`${pendingApprovalRecords.length} 条待处理`} tone={pendingApprovalRecords.length ? "warning" : "success"} />}
        >
          <div className="space-y-3">
            {pendingApprovalRecords.length ? (
              pendingApprovalRecords.slice(0, 6).map((record) => (
                <div key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-semibold text-slate-900">{record.orderNo}</p>
                        <Badge label={record.statusLabel} tone={resolveOrderTone(record.status)} />
                      </div>
                      <p className="mt-1 break-words text-sm text-slate-700">{record.title}</p>
                      <p className="mt-2 break-words text-sm text-slate-500">
                        {record.customerName} · {record.serviceDate || "未排日期"} · {record.assigneeName}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openOrderEditor(record.id)}
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                      >
                        编辑
                      </button>
                      {canWriteOrders ? (
                        <form action={updateOrderStatus}>
                          <input type="hidden" name="orderId" value={record.id} />
                          <input type="hidden" name="status" value="scheduled" />
                          <button className="rounded-full bg-slate-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-cyan-800">
                            批准并排车
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                当前没有待审批订单，运营队列比较干净。
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <Dialog
        open={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        title="创建订单"
        description="在二级界面中完成一次性建单或重复一日游建单，提交后回到订单工作台继续编辑和调度。"
        eyebrow="Create Order"
        maxWidthClassName="max-w-6xl"
      >
        <OrderCreatePanel
          customers={customers}
          assignees={assignees}
          canWriteOrders={canWriteOrders}
          feedback={feedback ?? undefined}
          redirectTo="/orders"
          defaultStartTime={defaultStartTime}
          reminderLeadDays={reminderLeadDays}
          targetGrossMarginRate={targetGrossMarginRate}
          variant="plain"
        />
      </Dialog>

      <SlideOver
        open={editorOpen && Boolean(selectedRecord)}
        onClose={() => setEditorOpen(false)}
        title={selectedRecord ? `${selectedRecord.archivedAt ? "查看归档" : "编辑订单"} ${selectedRecord.orderNo}` : "编辑订单"}
        description={
          selectedRecord?.archivedAt
            ? "归档订单默认只读，保留历史核对信息。如需修改，请先移出归档。"
            : "订单详情、状态流转、基础资料、排车和成本维护都放在这里，主工作台只保留列表与核心操作。"
        }
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge label={selectedRecord.statusLabel} tone={resolveOrderTone(selectedRecord.status)} />
                    {selectedRecord.archivedAt ? <Badge label={selectedRecord.archiveCode ?? "已归档"} tone="info" /> : null}
                    <span className="text-xs text-slate-500">{selectedRecord.customerName}</span>
                  </div>
                  <h3 className="mt-3 break-words text-xl font-semibold tracking-tight text-slate-950">{selectedRecord.title}</h3>
                  <p className="mt-2 break-words text-sm leading-6 text-slate-600">{selectedRecord.notes || "当前还没有内部备注。"}</p>
                </div>
                <form id={`delete-order-in-editor-${selectedRecord.id}`} action={deleteOrder} className="hidden">
                  <input type="hidden" name="orderId" value={selectedRecord.id} />
                </form>
                <ConfirmActionButton
                  formId={`delete-order-in-editor-${selectedRecord.id}`}
                  title="确认删除这张订单？"
                  description={`订单 ${selectedRecord.orderNo} 删除后将从订单、日历、利润和财务视图中移除。`}
                  confirmLabel="确认删除订单"
                  tone="danger"
                  disabled={!canEditSelectedRecord}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除订单
                </ConfirmActionButton>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 ${
                selectedRecord.archivedAt ? "border-cyan-200 bg-cyan-50/70" : "border-slate-200 bg-white"
              }`}
            >
              {selectedRecord.archivedAt ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-cyan-950">历史归档信息</p>
                      <p className="mt-1 text-sm leading-6 text-cyan-900/75">
                        归档于 {formatArchiveDate(selectedRecord.archivedAt)}，归档编号 {selectedRecord.archiveCode ?? "未生成"}。
                      </p>
                    </div>
                    {canWriteOrders ? (
                      <form action={restoreArchivedOrder}>
                        <input type="hidden" name="orderId" value={selectedRecord.id} />
                        <PendingSubmitButton
                          pendingLabel="正在移出归档..."
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-cyan-950 px-4 text-sm font-medium text-white transition hover:bg-cyan-800"
                        >
                          移出归档并继续编辑
                        </PendingSubmitButton>
                      </form>
                    ) : null}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-cyan-200 bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-cyan-700">归档摘要</p>
                      <p className="mt-2 break-words text-sm leading-6 text-slate-700">{selectedRecord.archiveSummary || "暂无归档摘要。"}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-200 bg-white/80 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-cyan-700">检索关键词</p>
                      <p className="mt-2 break-words text-sm leading-6 text-slate-700">{selectedRecord.archiveKeywords || "暂无检索关键词。"}</p>
                    </div>
                  </div>
                </div>
              ) : canArchiveOrder(selectedRecord) ? (
                <form action={archiveOrder} className="space-y-4">
                  <input type="hidden" name="orderId" value={selectedRecord.id} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">结案归档</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      归档后会从当前订单工作台移入历史检索区，保留日期、内容、成本和执行记录供未来核对。
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">归档摘要</label>
                      <textarea
                        name="archiveSummary"
                        rows={3}
                        placeholder="例如：行程已完成，客户人数、车辆、成本与回款均已核对。"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">检索关键词</label>
                      <textarea
                        name="archiveKeywords"
                        rows={3}
                        placeholder="例如：富士山 一日游 企业团 投诉 已结算"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <PendingSubmitButton
                      disabled={!canWriteOrders}
                      pendingLabel="正在归档订单..."
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      归档订单
                    </PendingSubmitButton>
                  </div>
                </form>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-900">结案归档</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">订单标记为已完成或已取消后，即可归档到历史检索区。</p>
                </div>
              )}
            </div>

            <StatStrip
              items={[
                { label: "服务日期", value: selectedRecord.serviceDate || "未安排" },
                { label: "负责人", value: selectedRecord.assigneeName },
                { label: "预计营收", value: selectedRecord.revenueLabel },
                { label: "总成本", value: selectedRecord.totalCostLabel },
                { label: "毛利", value: selectedRecord.grossProfitLabel },
                { label: "成本明细", value: `${selectedCostEntries.length} 条` },
              ]}
              columnsClassName="md:grid-cols-2 xl:grid-cols-3"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">状态流转</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusTransitionItems.map((item) => (
                  <form key={item.value} action={updateOrderStatus}>
                    <input type="hidden" name="orderId" value={selectedRecord.id} />
                    <input type="hidden" name="status" value={item.value} />
                    <button
                      disabled={!canEditSelectedRecord || selectedRecord.status === item.value}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {item.label}
                    </button>
                  </form>
                ))}
                {canEditSelectedRecord ? (
                  <>
                    <form id={`cancel-order-${selectedRecord.id}`} action={updateOrderStatus}>
                      <input type="hidden" name="orderId" value={selectedRecord.id} />
                      <input type="hidden" name="status" value="cancelled" />
                    </form>
                    <ConfirmActionButton
                      formId={`cancel-order-${selectedRecord.id}`}
                      title="确认取消这张订单？"
                      description="取消后订单会进入已取消状态，但仍会保留在系统里供后续追溯。"
                      confirmLabel="确认取消"
                      tone="danger"
                      disabled={selectedRecord.status === "cancelled"}
                    >
                      标记取消
                    </ConfirmActionButton>
                  </>
                ) : null}
              </div>
            </div>

            <form action={updateOrderBasics} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="orderId" value={selectedRecord.id} />
              <FormSection title="订单基础信息" description="这里是编辑订单的主入口，会同步影响日历、Dashboard 和利润模块。">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">客户</label>
                    <select
                      name="customerId"
                      defaultValue={selectedRecord.customerId}
                      disabled={!canEditSelectedRecord}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.label}{customer.hint ? ` · ${customer.hint}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">行程标题</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedRecord.title}
                      disabled={!canEditSelectedRecord}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">服务日期</label>
                      <input
                        type="date"
                        name="serviceDate"
                        defaultValue={selectedRecord.serviceDate}
                        disabled={!canEditSelectedRecord}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">负责人</label>
                      <select
                        name="assigneeId"
                        defaultValue={selectedRecord.assigneeId ?? ""}
                        disabled={!canEditSelectedRecord}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">待分配</option>
                        {assignees.map((assignee) => (
                          <option key={assignee.id} value={assignee.id}>
                            {assignee.label}{assignee.hint ? ` · ${assignee.hint}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="营收与内部备注" description="预计营收用于利润核算，备注用于运营交接和执行追溯。">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">预计营收 JPY</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      name="revenueJpy"
                      defaultValue={selectedRecord.revenueJpy}
                      disabled={!canEditSelectedRecord}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">内部备注</label>
                    <textarea
                      name="notes"
                      rows={4}
                      defaultValue={selectedRecord.notes}
                      disabled={!canEditSelectedRecord}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>
              </FormSection>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  {selectedRecord.archivedAt
                    ? "归档订单为只读状态，如需修改请先移出归档。"
                    : canWriteOrders
                      ? "保存后将直接更新订单主表。"
                      : "当前账号只能查看，不可修改订单。"}
                </p>
                <PendingSubmitButton
                  disabled={!canEditSelectedRecord}
                  pendingLabel="正在保存订单..."
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  保存订单
                </PendingSubmitButton>
              </div>
            </form>

            <form action={updateOrderDispatch} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="orderId" value={selectedRecord.id} />
              <FormSection title="排车与人员指派" description="车辆、司机、导游冲突会被后端拦截，适合在编辑界面内统一处理。">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">车辆</label>
                    <select
                      name="vehicleId"
                      defaultValue={selectedRecord.vehicleId ?? ""}
                      disabled={!canEditSelectedRecord}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">待分配</option>
                      {dispatchOptions.vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.label}{vehicle.hint ? ` · ${vehicle.hint}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">司机</label>
                    <select
                      name="driverId"
                      defaultValue={selectedRecord.driverId ?? ""}
                      disabled={!canEditSelectedRecord}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">待分配</option>
                      {dispatchOptions.drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.label}{driver.hint ? ` · ${driver.hint}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">导游</label>
                    <select
                      name="guideId"
                      defaultValue={selectedRecord.guideId ?? ""}
                      disabled={!canEditSelectedRecord}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">待分配</option>
                      {dispatchOptions.guides.map((guide) => (
                        <option key={guide.id} value={guide.id}>
                          {guide.label}{guide.hint ? ` · ${guide.hint}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormSection>

              {conflicts.length ? (
                <div className="space-y-2">
                  {conflicts.map((conflict) => (
                    <div key={conflict.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-medium text-amber-900">{conflict.title}</p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">{conflict.description}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  {selectedRecord.archivedAt
                    ? "归档订单的调度信息保持只读。"
                    : canWriteOrders
                      ? "保存后会把资源分配写回订单。"
                      : "当前账号只有查看权限。"}
                </p>
                <PendingSubmitButton
                  disabled={!canEditSelectedRecord}
                  pendingLabel="正在保存调度..."
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  保存调度
                </PendingSubmitButton>
              </div>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">订单推进摘要</p>
                  <p className="mt-1 text-sm text-slate-500">详情不再占据主页面，只在编辑界面内展示。</p>
                </div>
                <Badge label={`${timelineItems.length} 个节点`} tone="info" />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {timelineItems.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.done ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                      <Badge label={item.done ? "已完成" : "待处理"} tone={item.done ? "success" : "warning"} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <form action={addOrderCost} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="orderId" value={selectedRecord.id} />
              <FormSection title="成本录入" description="成本维护收进订单编辑界面，避免主工作台被低频表单占满。">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">成本类别</label>
                    <select
                      name="category"
                      disabled={!canEditSelectedRecord}
                      defaultValue="vehicle"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="vehicle">车辆</option>
                      <option value="driver">司机</option>
                      <option value="guide">导游</option>
                      <option value="hotel">酒店</option>
                      <option value="meal">餐食</option>
                      <option value="ticket">门票</option>
                      <option value="misc">杂费</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">金额 JPY</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      name="amountJpy"
                      placeholder="50000"
                      disabled={!canEditSelectedRecord}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">成本项名称</label>
                    <input
                      type="text"
                      name="label"
                      placeholder="例如：成田接机车辆费"
                      disabled={!canEditSelectedRecord}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">供应商 / 备注对象</label>
                    <input
                      type="text"
                      name="supplierName"
                      placeholder="例如：Tokyo Partner Bus"
                      disabled={!canEditSelectedRecord}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">成本备注</label>
                  <textarea
                    name="costNotes"
                    rows={3}
                    disabled={!canEditSelectedRecord}
                    placeholder="记录结算方式、数量、特殊费用说明"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </FormSection>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  {selectedRecord.archivedAt
                    ? "归档订单的成本明细保持只读。"
                    : canWriteOrders
                      ? "新增后会同步刷新订单总成本与利润。"
                      : "当前账号只有查看权限。"}
                </p>
                <PendingSubmitButton
                  disabled={!canEditSelectedRecord}
                  pendingLabel="正在录入成本..."
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  录入成本
                </PendingSubmitButton>
              </div>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">成本明细</p>
                  <p className="mt-1 text-sm text-slate-500">支持编辑或删除误录成本。</p>
                </div>
                <Badge label={`${selectedCostEntries.length} 条`} tone="info" />
              </div>

              <div className="mt-4 space-y-3">
                {selectedCostEntries.length ? (
                  selectedCostEntries.map((entry) => {
                    const isEditing = editingCostId === entry.id;

                    return (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="break-words text-sm font-medium text-slate-900">{entry.label}</p>
                              <Badge label={entry.categoryLabel} tone="neutral" />
                            </div>
                            <p className="mt-2 break-words text-sm text-slate-600">供应商：{entry.supplierName}</p>
                            {entry.notes ? <p className="mt-1 break-words text-sm text-slate-500">{entry.notes}</p> : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{entry.amountLabel}</p>
                            {canEditSelectedRecord ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingCostId(isEditing ? null : entry.id)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                                >
                                  {isEditing ? "收起" : "编辑"}
                                </button>
                                <form id={`delete-order-cost-${entry.id}`} action={deleteOrderCost} className="hidden">
                                  <input type="hidden" name="costId" value={entry.id} />
                                  <input type="hidden" name="orderId" value={selectedRecord.id} />
                                </form>
                                <ConfirmActionButton
                                  formId={`delete-order-cost-${entry.id}`}
                                  title="确认删除这条成本明细？"
                                  description="删除后会重新计算这张订单的总成本和毛利。"
                                  confirmLabel="确认删除"
                                  tone="danger"
                                >
                                  删除
                                </ConfirmActionButton>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {isEditing && canEditSelectedRecord ? (
                          <form action={updateOrderCost} className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <input type="hidden" name="costId" value={entry.id} />
                            <input type="hidden" name="orderId" value={selectedRecord.id} />
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">成本类别</label>
                                <select
                                  name="category"
                                  defaultValue={entry.category}
                                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white"
                                >
                                  <option value="vehicle">车辆</option>
                                  <option value="driver">司机</option>
                                  <option value="guide">导游</option>
                                  <option value="hotel">酒店</option>
                                  <option value="meal">餐食</option>
                                  <option value="ticket">门票</option>
                                  <option value="misc">杂费</option>
                                </select>
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">金额 JPY</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  name="amountJpy"
                                  defaultValue={entry.amountJpy}
                                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">成本项名称</label>
                                <input
                                  type="text"
                                  name="label"
                                  defaultValue={entry.label}
                                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">供应商 / 备注对象</label>
                                <input
                                  type="text"
                                  name="supplierName"
                                  defaultValue={entry.supplierName === "未记录" ? "" : entry.supplierName}
                                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">成本备注</label>
                              <textarea
                                name="costNotes"
                                rows={3}
                                defaultValue={entry.notes}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white"
                              />
                            </div>
                            <div className="flex justify-end">
                              <PendingSubmitButton
                                pendingLabel="正在保存成本..."
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800"
                              >
                                保存成本
                              </PendingSubmitButton>
                            </div>
                          </form>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <EmptyStateCard
                    title="还没有成本明细"
                    description="先录入车辆、司机、导游或杂费成本，这张订单的毛利就会开始实时可见。"
                  />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </SlideOver>
    </section>
  );
}

function detectResourceConflicts(selectedRecord: OrderOperationsRecord, records: OrderOperationsRecord[]) {
  return records
    .filter((record) => record.id !== selectedRecord.id && record.serviceDate && record.serviceDate === selectedRecord.serviceDate)
    .flatMap((record) => {
      const items: Array<{ id: string; title: string; description: string }> = [];

      if (selectedRecord.vehicleId && record.vehicleId && selectedRecord.vehicleId === record.vehicleId) {
        items.push({
          id: `${record.id}-vehicle`,
          title: "车辆冲突",
          description: `${selectedRecord.vehicleName} 已在同一天分配给订单 ${record.orderNo}（${record.title}）。`,
        });
      }

      if (selectedRecord.driverId && record.driverId && selectedRecord.driverId === record.driverId) {
        items.push({
          id: `${record.id}-driver`,
          title: "司机冲突",
          description: `${selectedRecord.driverName} 已在同一天分配给订单 ${record.orderNo}（${record.title}）。`,
        });
      }

      if (selectedRecord.guideId && record.guideId && selectedRecord.guideId === record.guideId) {
        items.push({
          id: `${record.id}-guide`,
          title: "导游冲突",
          description: `${selectedRecord.guideName} 已在同一天分配给订单 ${record.orderNo}（${record.title}）。`,
        });
      }

      return items;
    });
}

function resolveOrderTone(status: string) {
  if (status === "in_progress" || status === "completed" || status === "scheduled") return "success" as const;
  if (status === "pending_confirmation" || status === "draft") return "warning" as const;
  if (status === "cancelled") return "neutral" as const;
  return "info" as const;
}

function buildOrderTimeline(record: OrderOperationsRecord, costEntries: OrderCostEntry[]) {
  return [
    {
      title: "订单已创建",
      description: `${record.orderNo} 已建立，客户为 ${record.customerName}。`,
      done: true,
    },
    {
      title: "等待确认 / 审批",
      description: "确认行程、日期和预计营收，审批通过后进入可调度状态。",
      done: record.status !== "draft",
    },
    {
      title: "资源分配完成",
      description: `车辆：${record.vehicleName}；司机：${record.driverName}；导游：${record.guideName}。`,
      done: Boolean(record.vehicleId || record.driverId || record.guideId),
    },
    {
      title: "成本资料已录入",
      description: `当前已录入 ${costEntries.length} 条成本明细，总成本 ${record.totalCostLabel}。`,
      done: costEntries.length > 0,
    },
    {
      title: "订单执行中 / 已结案",
      description: `当前状态为 ${record.statusLabel}，可继续推进执行或归档复盘。`,
      done: record.status === "in_progress" || record.status === "completed",
    },
  ];
}

function canArchiveOrder(record: OrderOperationsRecord) {
  return record.status === "completed" || record.status === "cancelled";
}

function formatOrderDate(value: string) {
  if (!value) return "未安排";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatArchiveDate(value: string | null) {
  if (!value) return "未记录";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
