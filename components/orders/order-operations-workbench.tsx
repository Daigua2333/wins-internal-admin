"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { addOrderCost, deleteOrderCost, updateOrderBasics, updateOrderCost, updateOrderDispatch, updateOrderStatus } from "@/app/(dashboard)/orders/actions";
import type { DispatchResourceOptions, OperationsReminderSnapshot, OrderCostEntry, OrderCreateOption, OrderOperationsRecord } from "@/lib/loaders/admin";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { SlideOver } from "@/components/ui/slide-over";
import { StatStrip } from "@/components/ui/stat-strip";

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
};

const statusFilterItems = ["全部", "待确认", "已排车", "进行中", "已完成"];
const statusTransitionItems = [
  { value: "pending_confirmation", label: "待确认" },
  { value: "scheduled", label: "已排车" },
  { value: "in_progress", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
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
}: OrderOperationsWorkbenchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeFilter, setActiveFilter] = useState(resolveInitialStatusFilter(initialFilter, statusFilterItems));
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    records.some((record) => record.id === initialSelectedId) ? initialSelectedId ?? null : records[0]?.id ?? null,
  );
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

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

  const pendingApprovalRecords = useMemo(
    () =>
      records
        .filter((record) => record.status === "draft" || record.status === "pending_confirmation")
        .sort((left, right) => (left.serviceDate || "9999-12-31").localeCompare(right.serviceDate || "9999-12-31")),
    [records],
  );

  const scheduleBuckets = useMemo(() => buildScheduleBuckets(records), [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const haystack = [record.orderNo, record.customerName, record.title, record.assigneeName, record.statusLabel].join(" ").toLowerCase();
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
      setDetailDrawerOpen(false);
    }
  }, [selectedRecord]);

  const tableRows = filteredRecords.map((record) => ({
    orderNo: record.orderNo,
    customer: record.customerName,
    itinerary: record.title,
    date: record.serviceDate || "未安排",
    assignee: record.assigneeName,
    status: record.statusLabel,
    amount: record.revenueLabel,
  }));

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          title="近期运营提醒"
          description="把近期待出团、报价到期和车辆点检到期集中显示，帮助运营在订单页也能快速发现待处理事项。"
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
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={item.categoryLabel} tone={item.tone} />
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
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
          description="把仍处于草稿和待确认的订单集中到一起，方便销售或运营快速推进到可调度状态。"
          action={<Badge label={`${pendingApprovalRecords.length} 条待处理`} tone={pendingApprovalRecords.length ? "warning" : "success"} />}
        >
          <div className="space-y-3">
            {pendingApprovalRecords.length ? (
              pendingApprovalRecords.slice(0, 6).map((record) => (
                <div key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{record.orderNo}</p>
                        <Badge label={record.statusLabel} tone={resolveOrderTone(record.status)} />
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{record.title}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {record.customerName} · {record.serviceDate || "未排日期"} · {record.assigneeName}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(record.id)}
                        className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                      >
                        查看详情
                      </button>
                      {canWriteOrders ? (
                        <>
                          <form action={updateOrderStatus}>
                            <input type="hidden" name="orderId" value={record.id} />
                            <input type="hidden" name="status" value="scheduled" />
                            <button className="rounded-full bg-slate-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-cyan-800">
                              批准并排车
                            </button>
                          </form>
                          <form action={updateOrderStatus}>
                            <input type="hidden" name="orderId" value={record.id} />
                            <input type="hidden" name="status" value="draft" />
                            <button className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100">
                              退回草稿
                            </button>
                          </form>
                        </>
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

        <SectionCard
          title="七日排班视图"
          description="按服务日期查看未来七天的订单分布，方便运营在一个版面里快速扫到待排车和已排车任务。"
          action={<Badge label={`${scheduleBuckets.totalScheduled} 条已排日期`} tone="info" />}
        >
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {scheduleBuckets.days.map((bucket) => (
              <div key={bucket.date} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{bucket.weekday}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{bucket.label}</p>
                  </div>
                  <Badge label={`${bucket.records.length} 单`} tone={bucket.records.length ? "info" : "neutral"} />
                </div>
                <div className="mt-3 space-y-2">
                  {bucket.records.length ? (
                    bucket.records.map((record) => (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => setSelectedId(record.id)}
                        className="w-full rounded-2xl border border-white bg-white px-3 py-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-900">{record.orderNo}</p>
                          <Badge label={record.statusLabel} tone={resolveOrderTone(record.status)} />
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{record.title}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {record.vehicleName} / {record.driverName} / {record.guideName}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">暂无排班</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {scheduleBuckets.unscheduled.length ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">未排服务日期</p>
              <p className="mt-1 text-sm text-amber-800">这些订单还没有填服务日期，不会出现在日历里，建议优先补齐。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {scheduleBuckets.unscheduled.slice(0, 6).map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setSelectedId(record.id)}
                    className="rounded-full border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
                  >
                    {record.orderNo}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>

      <section className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard
          title="订单工作台"
          description="点击左侧订单后，右侧可直接更新状态与基础信息。这样运营不用跳转页面就能完成日常维护。"
          action={
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                canWriteOrders ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              {canWriteOrders ? "可编辑订单" : "只读模式"}
            </span>
          }
        >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索订单号、客户、行程、负责人"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
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

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>当前结果 {filteredRecords.length} 条</span>
            <span>{canWriteOrders ? "选中后可直接更新状态与订单资料" : "当前角色仅可查看订单详情"}</span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900">
                <ClipboardCheck className="h-4 w-4" />
                <p className="text-sm font-medium">待审批</p>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{pendingApprovalRecords.length}</p>
              <p className="mt-1 text-sm text-slate-500">草稿和待确认订单总数</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900">
                <CalendarDays className="h-4 w-4" />
                <p className="text-sm font-medium">七日排班</p>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{scheduleBuckets.totalScheduled}</p>
              <p className="mt-1 text-sm text-slate-500">未来七天已排日期订单</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">未补日期</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{scheduleBuckets.unscheduled.length}</p>
              <p className="mt-1 text-sm text-slate-500">不会进入调度板的订单数</p>
            </div>
          </div>

          <DataTable
            columns={["订单号", "客户", "行程", "日期", "负责人", "状态", "金额"]}
            rows={tableRows}
            selectedRowIndex={selectedRowIndex}
            onRowClick={(_, rowIndex) => setSelectedId(filteredRecords[rowIndex]?.id ?? null)}
            emptyMessage="当前筛选下没有订单。"
          />
        </div>
        </SectionCard>

        <SectionCard title="订单详情与操作" description="这里先落地最常用的维护动作：看详情、改状态、改基础信息。">
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Order</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.orderNo}</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedRecord.title}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge label={selectedRecord.statusLabel} tone={resolveOrderTone(selectedRecord.status)} />
                    <span className="text-xs text-slate-500">{selectedRecord.customerName}</span>
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
                { label: "负责人", value: selectedRecord.assigneeName },
                { label: "服务日期", value: selectedRecord.serviceDate || "未安排" },
                { label: "预计营收", value: selectedRecord.revenueLabel },
                { label: "已分配车辆", value: selectedRecord.vehicleName },
                { label: "已分配司机", value: selectedRecord.driverName },
                { label: "已分配导游", value: selectedRecord.guideName },
                { label: "当前总成本", value: selectedRecord.totalCostLabel },
                { label: "当前毛利", value: selectedRecord.grossProfitLabel },
              ]}
              columnsClassName="md:grid-cols-2 xl:grid-cols-3"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">状态流转</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusTransitionItems.filter((item) => item.value !== "cancelled").map((item) => (
                  <form key={item.value} action={updateOrderStatus}>
                    <input type="hidden" name="orderId" value={selectedRecord.id} />
                    <input type="hidden" name="status" value={item.value} />
                    <button
                      disabled={!canWriteOrders || selectedRecord.status === item.value}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {item.label}
                    </button>
                  </form>
                ))}
                {canWriteOrders ? (
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

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">资源冲突提醒</p>
              <div className="mt-3 space-y-3">
                {conflicts.length ? (
                  conflicts.map((conflict) => (
                    <div key={conflict.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-medium text-amber-900">{conflict.title}</p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">{conflict.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    当前选中订单没有检测到同日资源冲突，可以继续安排执行。
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">订单推进时间线</p>
                  <p className="mt-1 text-sm text-slate-500">把审批、调度、成本和执行阶段串起来，方便快速判断下一步动作。</p>
                </div>
                <Badge label={`${timelineItems.length} 个节点`} tone="info" />
              </div>
              <div className="mt-4 space-y-3">
                {timelineItems.map((item) => (
                  <div key={item.title} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className={`mt-0.5 h-3 w-3 rounded-full ${item.done ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <Badge label={item.done ? "已完成" : "待处理"} tone={item.done ? "success" : "warning"} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form action={updateOrderBasics} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="orderId" value={selectedRecord.id} />
              <FormSection title="订单基础信息" description="先确定客户、标题和日期，这些字段会直接影响日历、Dashboard 和后续调度。">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">客户</label>
                    <select
                      name="customerId"
                      defaultValue={selectedRecord.customerId}
                      disabled={!canWriteOrders}
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
                      disabled={!canWriteOrders}
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
                        disabled={!canWriteOrders}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">负责人</label>
                      <select
                        name="assigneeId"
                        defaultValue={selectedRecord.assigneeId ?? ""}
                        disabled={!canWriteOrders}
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

              <FormSection title="营收与内部备注" description="预计营收和补充说明会继续影响利润模块、运营交接和异常复盘。">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">预计营收 JPY</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      name="revenueJpy"
                      defaultValue={selectedRecord.revenueJpy}
                      disabled={!canWriteOrders}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">内部备注</label>
                    <textarea
                      name="notes"
                      rows={4}
                      defaultValue={selectedRecord.notes}
                      disabled={!canWriteOrders}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>
              </FormSection>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  {canWriteOrders ? "保存后将直接更新订单主表，并同步影响 Dashboard 与利润模块。" : "当前账号只能查看，不可修改订单。"}
                </p>
                <PendingSubmitButton
                  disabled={!canWriteOrders}
                  pendingLabel="正在保存订单..."
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  保存修改
                </PendingSubmitButton>
              </div>
            </form>

            <form action={updateOrderDispatch} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="orderId" value={selectedRecord.id} />
              <FormSection title="排车与人员指派" description="同一天的车辆、司机、导游冲突会被后端直接拦截，保存前请先处理资源占用。">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">车辆</label>
                    <select
                      name="vehicleId"
                      defaultValue={selectedRecord.vehicleId ?? ""}
                      disabled={!canWriteOrders}
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
                      disabled={!canWriteOrders}
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
                      disabled={!canWriteOrders}
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

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  {canWriteOrders ? "保存后会把车辆、司机、导游分配写回 orders 表。" : "当前账号只有查看权限。"}
                </p>
                <PendingSubmitButton
                  disabled={!canWriteOrders}
                  pendingLabel="正在保存调度..."
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  保存调度
                </PendingSubmitButton>
              </div>
            </form>

            <form action={addOrderCost} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="orderId" value={selectedRecord.id} />
              <FormSection title="成本录入" description="逐条录入车辆、司机、导游、酒店、餐食和杂费，系统会自动回写订单总成本。">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">成本类别</label>
                      <select
                        name="category"
                        disabled={!canWriteOrders}
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
                        disabled={!canWriteOrders}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">成本项名称</label>
                      <input
                        type="text"
                        name="label"
                        placeholder="例如：成田接机车辆费"
                        disabled={!canWriteOrders}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">供应商 / 备注对象</label>
                      <input
                        type="text"
                        name="supplierName"
                        placeholder="例如：Tokyo Partner Bus"
                        disabled={!canWriteOrders}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">成本备注</label>
                    <textarea
                      name="costNotes"
                      rows={3}
                      disabled={!canWriteOrders}
                      placeholder="记录结算方式、数量、特殊费用说明"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>
              </FormSection>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  {canWriteOrders ? "新增后会同步刷新订单总成本与利润。" : "当前账号只有查看权限。"}
                </p>
                <PendingSubmitButton
                  disabled={!canWriteOrders}
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
                  <p className="mt-1 text-sm text-slate-500">支持查看当前订单已录入的成本项，并删除误录项目。</p>
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
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-900">{entry.label}</p>
                              <Badge label={entry.categoryLabel} tone="neutral" />
                            </div>
                            <p className="mt-2 text-sm text-slate-600">供应商：{entry.supplierName}</p>
                            {entry.notes ? <p className="mt-1 text-sm text-slate-500">{entry.notes}</p> : null}
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-slate-900">{entry.amountLabel}</p>
                            {canWriteOrders ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingCostId(isEditing ? null : entry.id)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                                >
                                  {isEditing ? "收起编辑" : "编辑"}
                                </button>
                                <form id={`delete-order-cost-${entry.id}`} action={deleteOrderCost}>
                                  <input type="hidden" name="costId" value={entry.id} />
                                  <input type="hidden" name="orderId" value={selectedRecord.id} />
                                  <ConfirmActionButton
                                    formId={`delete-order-cost-${entry.id}`}
                                    title="确认删除这条成本明细？"
                                    description="删除后会重新计算这张订单的总成本和毛利。"
                                    confirmLabel="确认删除"
                                    tone="danger"
                                  >
                                    删除
                                  </ConfirmActionButton>
                                </form>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {isEditing ? (
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
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm text-slate-500">保存后会重新计算当前订单总成本和毛利。</p>
                              <PendingSubmitButton
                                pendingLabel="正在保存成本..."
                                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800"
                              >
                                保存成本修改
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
        ) : (
          <EmptyStateCard
            title="还没有选中订单"
            description="从左侧订单列表里点选一条记录，右侧就会展开这张订单的基础信息、调度、成本和推进情况。"
          />
        )}
        </SectionCard>
      </section>

      <SlideOver
        open={detailDrawerOpen && Boolean(selectedRecord)}
        onClose={() => setDetailDrawerOpen(false)}
        title={selectedRecord ? `${selectedRecord.orderNo} 侧边详情` : "订单详情"}
        description="把当前订单的关键信息、冲突提醒和推进节点收进一个独立面板，方便边看列表边追细节。"
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge label={selectedRecord.statusLabel} tone={resolveOrderTone(selectedRecord.status)} />
                <span className="text-xs text-slate-500">{selectedRecord.customerName}</span>
              </div>
              <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{selectedRecord.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedRecord.notes || "当前还没有内部备注。"}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["服务日期", selectedRecord.serviceDate || "未安排"],
                ["负责人", selectedRecord.assigneeName],
                ["车辆", selectedRecord.vehicleName],
                ["司机", selectedRecord.driverName],
                ["导游", selectedRecord.guideName],
                ["毛利", selectedRecord.grossProfitLabel],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">资源冲突提醒</p>
                <Badge label={conflicts.length ? `${conflicts.length} 项风险` : "状态正常"} tone={conflicts.length ? "warning" : "success"} />
              </div>
              <div className="mt-4 space-y-3">
                {conflicts.length ? (
                  conflicts.map((conflict) => (
                    <div key={conflict.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-medium text-amber-900">{conflict.title}</p>
                      <p className="mt-1 text-sm leading-6 text-amber-800">{conflict.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    当前没有检测到同日资源冲突。
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">推进节点</p>
                <Badge label={`${timelineItems.length} 个节点`} tone="info" />
              </div>
              <div className="mt-4 space-y-3">
                {timelineItems.map((item) => (
                  <div key={item.title} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className={`mt-0.5 h-3 w-3 rounded-full ${item.done ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <Badge label={item.done ? "已完成" : "待处理"} tone={item.done ? "success" : "warning"} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    </div>
                  </div>
                ))}
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
  if (status === "pending_confirmation") return "warning" as const;
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

function buildScheduleBuckets(records: OrderOperationsRecord[]) {
  const datedRecords = records
    .filter((record) => record.serviceDate)
    .sort((left, right) => left.serviceDate.localeCompare(right.serviceDate));

  const uniqueDates = Array.from(new Set(datedRecords.map((record) => record.serviceDate))).slice(0, 7);

  const days = uniqueDates.map((date) => {
    const dayRecords = datedRecords.filter((record) => record.serviceDate === date);
    const day = new Date(`${date}T00:00:00`);

    return {
      date,
      label: formatDateLabel(day),
      weekday: formatWeekdayLabel(day),
      records: dayRecords,
    };
  });

  return {
    days,
    totalScheduled: datedRecords.length,
    unscheduled: records.filter((record) => !record.serviceDate),
  };
}

function formatDateLabel(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(value);
}

function formatWeekdayLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(value);
}
