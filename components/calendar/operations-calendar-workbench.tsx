"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, SquarePen } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { addOrderCost, appendOrderOperationsLog, deleteOrderCost, updateOrderBasics, updateOrderDispatch, updateOrderStatus } from "@/app/(dashboard)/orders/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { StatStrip } from "@/components/ui/stat-strip";
import type {
  DispatchResourceOptions,
  OperationsCalendarEvent,
  OperationsReminderSnapshot,
  OperationsCalendarSnapshot,
  OrderCostEntry,
  OrderCreateOption,
} from "@/lib/loaders/admin";

type OperationsCalendarWorkbenchProps = {
  snapshot: OperationsCalendarSnapshot;
  customers: OrderCreateOption[];
  assignees: OrderCreateOption[];
  dispatchOptions: DispatchResourceOptions;
  costEntries: OrderCostEntry[];
  canWriteOrders: boolean;
  reminders: OperationsReminderSnapshot;
};

const statusFilters = ["全部", "待确认", "已排车", "进行中", "已完成", "已取消"];
const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const viewModes = [
  { value: "month", label: "月视图" },
  { value: "week", label: "周视图" },
] as const;
const statusTransitionItems = [
  { value: "pending_confirmation", label: "待确认" },
  { value: "scheduled", label: "已排车" },
  { value: "in_progress", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

export function OperationsCalendarWorkbench({
  snapshot,
  customers,
  assignees,
  dispatchOptions,
  costEntries,
  canWriteOrders,
  reminders,
}: OperationsCalendarWorkbenchProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [selectedMonth, setSelectedMonth] = useState(snapshot.defaultMonth);
  const [selectedDate, setSelectedDate] = useState(snapshot.today);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<(typeof viewModes)[number]["value"]>("month");

  const monthOptions = useMemo(() => {
    const monthSet = new Set<string>();

    for (const event of snapshot.events) {
      monthSet.add(event.date.slice(0, 7));
    }

    monthSet.add(snapshot.defaultMonth);

    return Array.from(monthSet)
      .sort()
      .map((value) => ({
        value,
        label: formatMonthLabel(value),
      }));
  }, [snapshot.defaultMonth, snapshot.events]);

  const filteredEvents = useMemo(() => {
    return snapshot.events.filter((event) => {
      const matchesMonth = event.date.startsWith(selectedMonth);
      const haystack = [event.orderNo, event.title, event.customerName, event.assigneeName, event.driverName, event.guideName]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === "全部" || event.statusLabel === statusFilter;

      return matchesMonth && matchesQuery && matchesStatus;
    });
  }, [query, selectedMonth, snapshot.events, statusFilter]);

  const dailyMap = useMemo(() => {
    const map = new Map<string, OperationsCalendarEvent[]>();

    for (const event of filteredEvents) {
      const current = map.get(event.date) ?? [];
      current.push(event);
      map.set(event.date, current);
    }

    return map;
  }, [filteredEvents]);

  const monthCells = useMemo(() => buildMonthCells(selectedMonth, dailyMap, snapshot.today), [dailyMap, selectedMonth, snapshot.today]);
  const weekDays = useMemo(() => buildWeekDays(selectedDate, dailyMap, snapshot.today), [dailyMap, selectedDate, snapshot.today]);

  useEffect(() => {
    const availableDates = monthCells.filter((cell) => cell.type === "day").map((cell) => cell.date);

    if (!availableDates.length) {
      return;
    }

    if (!selectedDate.startsWith(selectedMonth) || !availableDates.includes(selectedDate)) {
      const fallback = availableDates.includes(snapshot.today) ? snapshot.today : availableDates[0];
      setSelectedDate(fallback);
    }
  }, [monthCells, selectedDate, selectedMonth, snapshot.today]);

  const selectedDayEvents = useMemo(() => dailyMap.get(selectedDate) ?? [], [dailyMap, selectedDate]);
  const selectedDayRevenue = selectedDayEvents.reduce((sum, event) => sum + event.revenueJpy, 0);
  const selectedDayCost = selectedDayEvents.reduce((sum, event) => sum + event.totalCostJpy, 0);
  const selectedDayProfit = selectedDayRevenue - selectedDayCost;
  const expandedCostEntries = useMemo(
    () => costEntries.filter((entry) => entry.orderId === expandedOrderId),
    [costEntries, expandedOrderId],
  );

  useEffect(() => {
    if (!selectedDayEvents.some((event) => event.id === expandedOrderId)) {
      setExpandedOrderId(selectedDayEvents[0]?.id ?? null);
    }
  }, [expandedOrderId, selectedDayEvents]);

  const upcomingDates = useMemo(() => {
    return Array.from(dailyMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(0, 5)
      .map(([date, events]) => ({
        date,
        label: formatDateDetail(date),
        count: events.length,
        statuses: Array.from(new Set(events.map((event) => event.statusLabel))).slice(0, 2),
      }));
  }, [dailyMap]);

  return (
    <section className="space-y-4">
      <SectionCard
        title="统一运营日历"
        description="把每天的订单、车辆、司机、导游、负责人、收入和成本放到一个日历视图里，方便按天追溯业务细节。"
        action={
          <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
            当前月份：{formatMonthLabel(selectedMonth)}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-[0.85fr_0.5fr_0.7fr]">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索订单号、客户、行程、负责人"
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    statusFilter === filter
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {viewModes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setViewMode(mode.value)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    viewMode === mode.value
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-500">
              {viewMode === "month" ? "适合按月回溯运营节奏" : "适合当天调度和一周内排班观察"}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">主动提醒中心</p>
                  <p className="mt-1 text-sm text-slate-500">把 T-提醒、报价到期和车辆点检到期集中到一个版面里。</p>
                </div>
                <Badge label={`${reminders.items.length} 条`} tone={reminders.items.length ? "warning" : "success"} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ["出团提醒", `${reminders.counts.order} 条`],
                  ["报价提醒", `${reminders.counts.quote} 条`],
                  ["车辆提醒", `${reminders.counts.vehicle} 条`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">近期运营提醒</p>
                  <p className="mt-1 text-sm text-slate-500">点击后可快速跳到订单、报价或车辆页面继续处理。</p>
                </div>
                <span className="text-xs text-slate-500">按最早日期排序</span>
              </div>
              <div className="mt-4 space-y-3">
                {reminders.items.length ? (
                  reminders.items.slice(0, 6).map((item) => (
                      <Link
                      key={item.id}
                      href={item.href as Route}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge label={item.categoryLabel} tone={item.tone} />
                          <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">{item.dateLabel}</span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    当前提醒队列很干净，近几天没有待处理的出团、报价或点检提醒。
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              {viewMode === "month" ? (
                <>
                  <div className="grid grid-cols-7 gap-2">
                    {weekdayLabels.map((label) => (
                      <div key={label} className="px-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {monthCells.map((cell, index) =>
                      cell.type === "empty" ? (
                        <div key={`empty-${index}`} className="min-h-32 rounded-3xl border border-dashed border-slate-100 bg-slate-50/40" />
                      ) : (
                        <button
                          key={cell.date}
                          type="button"
                          onClick={() => setSelectedDate(cell.date)}
                          className={`min-h-32 rounded-3xl border p-3 text-left transition ${
                            selectedDate === cell.date
                              ? "border-cyan-400 bg-cyan-50 shadow-panel"
                              : cell.isToday
                                ? "border-emerald-200 bg-emerald-50/70 hover:border-cyan-300"
                                : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{cell.dayNumber}</p>
                              <p className="mt-1 text-xs text-slate-500">{cell.eventCount ? `${cell.eventCount} 个日程` : "无日程"}</p>
                            </div>
                            {cell.isToday ? <Badge label="Today" tone="success" /> : null}
                          </div>
                          <div className="mt-4 space-y-2">
                            {cell.events.slice(0, 2).map((event) => (
                              <div key={event.id} className="rounded-2xl bg-slate-50 px-3 py-2">
                                <p className="text-xs font-medium text-slate-900">{event.orderNo}</p>
                                <p className="mt-1 line-clamp-1 text-xs text-slate-500">{event.title}</p>
                              </div>
                            ))}
                            {cell.events.length > 2 ? <p className="text-xs text-slate-500">+{cell.events.length - 2} 条更多安排</p> : null}
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                  {weekDays.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => setSelectedDate(day.date)}
                      className={`min-h-48 rounded-3xl border p-4 text-left transition ${
                        selectedDate === day.date
                          ? "border-cyan-400 bg-cyan-50 shadow-panel"
                          : day.isToday
                            ? "border-emerald-200 bg-emerald-50/70 hover:border-cyan-300"
                            : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{day.weekday}</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{day.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{day.eventCount ? `${day.eventCount} 个日程` : "无日程"}</p>
                        </div>
                        {day.isToday ? <Badge label="Today" tone="success" /> : null}
                      </div>
                      <div className="mt-4 space-y-2">
                        {day.events.length ? (
                          day.events.slice(0, 4).map((event) => (
                            <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium text-slate-900">{event.orderNo}</p>
                                <Badge label={event.statusLabel} tone={resolveStatusTone(event.status)} />
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{event.title}</p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-400">暂无安排</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">选中日期</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{formatDateDetail(selectedDate)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/95 p-3 text-white">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    ["日程数", `${selectedDayEvents.length} 条`],
                    ["当日营收", formatCurrency(selectedDayRevenue)],
                    ["当日毛利", formatCurrency(selectedDayProfit)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">即将到来的重点日期</p>
                    <span className="text-xs text-slate-500">当前筛选</span>
                  </div>
                  <div className="mt-3 space-y-3">
                    {upcomingDates.length ? (
                      upcomingDates.map((item) => (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(item.date.slice(0, 7));
                            setSelectedDate(item.date);
                          }}
                          className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-cyan-50"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.statuses.join(" / ") || "待安排"}</p>
                          </div>
                          <span className="text-sm text-slate-600">{item.count} 条</span>
                        </button>
                      ))
                    ) : (
                      <EmptyStateCard
                        title="还没有匹配的重点日期"
                        description="换一个月份、状态或关键词后，这里会重新列出当前筛选下最值得先处理的日程。"
                      />
                    )}
                  </div>
                </div>
              </div>

              <SectionCard title="当日细节追溯" description="这里按订单逐条展开当天的客户、负责人、车辆、司机、导游、营收、成本和备注。">
                <div className="space-y-3">
                  {selectedDayEvents.length ? (
                    selectedDayEvents.map((event) => (
                      <div key={event.id} className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#fff,rgba(248,250,252,0.92))] p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-slate-900">{event.orderNo}</p>
                              <Badge label={event.statusLabel} tone={resolveStatusTone(event.status)} />
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-800">{event.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{event.customerName}</p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <StatPill label="营收" value={event.revenueLabel} />
                            <StatPill label="成本" value={event.totalCostLabel} />
                            <StatPill label="毛利" value={event.grossProfitLabel} />
                          </div>
                        </div>

                        <div className="mt-4">
                          <StatStrip
                            items={[
                              { label: "负责人", value: event.assigneeName },
                              { label: "车辆", value: event.vehicleName },
                              { label: "司机", value: event.driverName },
                              { label: "导游", value: event.guideName },
                            ]}
                            columnsClassName="md:grid-cols-2 xl:grid-cols-4"
                          />
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                          <p className="text-sm font-medium text-slate-900">内部备注</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{event.notes || "当前没有补充备注。"}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(expandedOrderId === event.id ? null : event.id)}
                            className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                          >
                            <SquarePen className="mr-2 h-4 w-4" />
                            {expandedOrderId === event.id ? "收起管理" : "管理这条订单"}
                          </button>
                        </div>

                        {expandedOrderId === event.id ? (
                          <div className="mt-4 space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-medium text-slate-900">状态流转</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {statusTransitionItems.map((item) => (
                                  <form key={item.value} action={updateOrderStatus}>
                                    <input type="hidden" name="redirectTo" value="/calendar" />
                                    <input type="hidden" name="orderId" value={event.id} />
                                    <input type="hidden" name="status" value={item.value} />
                                    <button
                                      disabled={!canWriteOrders || event.status === item.value}
                                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                      {item.label}
                                    </button>
                                  </form>
                                ))}
                              </div>
                            </div>

                            <form action={updateOrderBasics} className="space-y-4">
                              <input type="hidden" name="redirectTo" value="/calendar" />
                              <input type="hidden" name="orderId" value={event.id} />
                              <FormSection title="订单基础信息" description="直接在日历里调整客户、标题、日期和负责人，保存后会留在当天视图继续追溯。">
                                <div className="space-y-4">
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">客户</label>
                                    <select
                                      name="customerId"
                                      defaultValue={event.customerId}
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
                                      defaultValue={event.title}
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
                                        defaultValue={event.date}
                                        disabled={!canWriteOrders}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium text-slate-700">负责人</label>
                                      <select
                                        name="assigneeId"
                                        defaultValue={event.assigneeId ?? ""}
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

                              <FormSection title="营收与内部备注" description="在当天排班上下文里同步调整预计营收和运营说明，避免信息散落。">
                                <div className="space-y-4">
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">预计营收 JPY</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1000"
                                      name="revenueJpy"
                                      defaultValue={event.revenueJpy}
                                      disabled={!canWriteOrders}
                                      className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">内部备注</label>
                                    <textarea
                                      name="notes"
                                      rows={4}
                                      defaultValue={event.notes}
                                      disabled={!canWriteOrders}
                                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                  </div>
                                </div>
                              </FormSection>

                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-slate-500">
                                  {canWriteOrders ? "保存后会留在运营日历，并同步刷新这一天的追溯信息。" : "当前账号只有查看权限。"}
                                </p>
                                <PendingSubmitButton
                                  disabled={!canWriteOrders}
                                  pendingLabel="正在保存订单..."
                                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  保存订单修改
                                </PendingSubmitButton>
                              </div>
                            </form>

                            <form action={updateOrderDispatch} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <input type="hidden" name="redirectTo" value="/calendar" />
                              <input type="hidden" name="orderId" value={event.id} />
                              <FormSection title="排车与人员指派" description="直接在日历里处理当天的车辆、司机和导游安排，保存后当天视图会立即更新。">
                                <div className="grid gap-4 md:grid-cols-3">
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">车辆</label>
                                    <select
                                      name="vehicleId"
                                      defaultValue={event.vehicleId ?? ""}
                                      disabled={!canWriteOrders}
                                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                                      defaultValue={event.driverId ?? ""}
                                      disabled={!canWriteOrders}
                                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                                      defaultValue={event.guideId ?? ""}
                                      disabled={!canWriteOrders}
                                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                                  {canWriteOrders ? "保存后会留在日历页，并同步刷新当天安排。" : "当前账号只有查看权限。"}
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

                            <form action={addOrderCost} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <input type="hidden" name="redirectTo" value="/calendar" />
                              <input type="hidden" name="orderId" value={event.id} />
                              <FormSection title="成本录入" description="直接在日历页补齐当天的车辆、司机、导游或其他执行成本，方便按天回看盈亏。">
                                <div className="space-y-4">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                      <label className="mb-2 block text-sm font-medium text-slate-700">成本类别</label>
                                      <select
                                        name="category"
                                        defaultValue="vehicle"
                                        disabled={!canWriteOrders}
                                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                                      <input type="number" min="0" step="1000" name="amountJpy" disabled={!canWriteOrders} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60" />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium text-slate-700">成本项名称</label>
                                      <input type="text" name="label" disabled={!canWriteOrders} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60" />
                                    </div>
                                    <div>
                                      <label className="mb-2 block text-sm font-medium text-slate-700">供应商 / 对象</label>
                                      <input type="text" name="supplierName" disabled={!canWriteOrders} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">成本备注</label>
                                    <textarea name="costNotes" rows={3} disabled={!canWriteOrders} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60" />
                                  </div>
                                </div>
                              </FormSection>
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-slate-500">
                                  {canWriteOrders ? "录入后会同步更新这条订单的成本与毛利。" : "当前账号只有查看权限。"}
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

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">成本明细</p>
                                  <p className="mt-1 text-sm text-slate-500">按当前选中的日历订单显示已录入成本。</p>
                                </div>
                                <Badge label={`${expandedCostEntries.length} 条`} tone="info" />
                              </div>
                              <div className="mt-4 space-y-3">
                                {expandedCostEntries.length ? (
                                  expandedCostEntries.map((entry) => (
                                    <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-start md:justify-between">
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
                                          <form id={`calendar-delete-cost-${entry.id}`} action={deleteOrderCost}>
                                            <input type="hidden" name="redirectTo" value="/calendar" />
                                            <input type="hidden" name="costId" value={entry.id} />
                                            <input type="hidden" name="orderId" value={event.id} />
                                            <ConfirmActionButton
                                              formId={`calendar-delete-cost-${entry.id}`}
                                              title="确认删除这条成本明细？"
                                              description="删除后会重新计算当前日历订单的总成本和毛利。"
                                              confirmLabel="确认删除"
                                              tone="danger"
                                              className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                                            >
                                              删除
                                            </ConfirmActionButton>
                                          </form>
                                        ) : null}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <EmptyStateCard
                                    title="还没有成本明细"
                                    description="在这一天直接补录执行成本后，日历里的成本和毛利会一起更新。"
                                  />
                                )}
                              </div>
                            </div>

                            <div className="grid gap-4 xl:grid-cols-2">
                              <form action={appendOrderOperationsLog} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <input type="hidden" name="redirectTo" value="/calendar" />
                                <input type="hidden" name="orderId" value={event.id} />
                                <input type="hidden" name="logType" value="completion" />
                                <div>
                                  <p className="text-sm font-medium text-slate-900">完成情况记录</p>
                                  <p className="mt-1 text-sm text-slate-500">记录当日完成了什么、执行结果如何，方便后续复盘。</p>
                                </div>
                                <textarea
                                  name="detail"
                                  rows={4}
                                  disabled={!canWriteOrders}
                                  placeholder="例如：成田接机已完成，客户 14:25 全员到齐，酒店入住顺利。"
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm text-slate-500">{canWriteOrders ? "提交后会追加到该订单的运营日志中。" : "当前账号只有查看权限。"}</p>
                                  <PendingSubmitButton
                                    disabled={!canWriteOrders}
                                    pendingLabel="正在记录完成情况..."
                                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                  >
                                    记录完成情况
                                  </PendingSubmitButton>
                                </div>
                              </form>

                              <form action={appendOrderOperationsLog} className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                <input type="hidden" name="redirectTo" value="/calendar" />
                                <input type="hidden" name="orderId" value={event.id} />
                                <input type="hidden" name="logType" value="incident" />
                                <div>
                                  <p className="text-sm font-medium text-amber-900">异常记录</p>
                                  <p className="mt-1 text-sm text-amber-800">记录延误、改线、客户投诉、资源异常等情况，方便追责和复盘。</p>
                                </div>
                                <textarea
                                  name="detail"
                                  rows={4}
                                  disabled={!canWriteOrders}
                                  placeholder="例如：客户航班延误 55 分钟，接机时间顺延，司机已重新确认停车位。"
                                  className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm text-amber-800">{canWriteOrders ? "异常会作为当天运营留痕保留在该订单里。" : "当前账号只有查看权限。"}</p>
                                  <PendingSubmitButton
                                    disabled={!canWriteOrders}
                                    pendingLabel="正在记录异常..."
                                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-900 px-5 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-200"
                                  >
                                    记录异常
                                  </PendingSubmitButton>
                                </div>
                              </form>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">运营留痕</p>
                                  <p className="mt-1 text-sm text-slate-500">把完成情况和异常记录都收在这里，方便按日期和订单回看执行细节。</p>
                                </div>
                                <Badge label={`${parseOperationsLogs(event.notes).length} 条`} tone="info" />
                              </div>
                              <div className="mt-4 space-y-3">
                                {parseOperationsLogs(event.notes).length ? (
                                  parseOperationsLogs(event.notes).map((log) => (
                                    <div
                                      key={log.id}
                                      className={`rounded-2xl border px-4 py-4 ${
                                        log.type === "completion"
                                          ? "border-emerald-200 bg-emerald-50"
                                          : "border-amber-200 bg-amber-50"
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge label={log.type === "completion" ? "完成情况" : "异常记录"} tone={log.type === "completion" ? "success" : "warning"} />
                                        <span className="text-xs text-slate-500">{log.dateLabel}</span>
                                        <span className="text-xs text-slate-500">{log.actorLabel}</span>
                                      </div>
                                      <p className="mt-2 text-sm leading-6 text-slate-700">{log.detail}</p>
                                    </div>
                                  ))
                                ) : (
                                  <EmptyStateCard
                                    title="还没有运营留痕"
                                    description="完成情况和异常记录会沉淀在这里，方便以后按日期和订单复盘。"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <EmptyStateCard
                      title="这一天还没有匹配日程"
                      description="你可以切换月份、状态或搜索关键词，也可以直接从日历顶部新建订单把这一天补齐。"
                    />
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}

function buildMonthCells(month: string, dailyMap: Map<string, OperationsCalendarEvent[]>, today: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const lastDay = new Date(year, monthNumber, 0);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const cells: Array<
    | { type: "empty" }
    | {
        type: "day";
        date: string;
        dayNumber: number;
        isToday: boolean;
        eventCount: number;
        events: OperationsCalendarEvent[];
      }
  > = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ type: "empty" });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const events = dailyMap.get(date) ?? [];
    cells.push({
      type: "day",
      date,
      dayNumber: day,
      isToday: date === today,
      eventCount: events.length,
      events,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ type: "empty" });
  }

  return cells;
}

function buildWeekDays(date: string, dailyMap: Map<string, OperationsCalendarEvent[]>, today: string) {
  const target = new Date(`${date}T00:00:00`);
  const weekStart = new Date(target);
  const weekday = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - weekday);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(weekStart);
    current.setDate(weekStart.getDate() + index);
    const currentDate = current.toISOString().slice(0, 10);
    const events = dailyMap.get(currentDate) ?? [];

    return {
      date: currentDate,
      label: formatMonthDay(current),
      weekday: formatWeekday(current),
      isToday: currentDate === today,
      eventCount: events.length,
      events,
    };
  });
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return `${year}年 ${month}月`;
}

function formatMonthDay(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(value);
}

function formatDateDetail(value: string) {
  const target = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(target);
}

function formatWeekday(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(value);
}

function resolveStatusTone(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "in_progress") return "info" as const;
  if (status === "cancelled") return "neutral" as const;
  if (status === "pending_confirmation") return "warning" as const;
  return "info" as const;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function parseOperationsLogs(notes: string) {
  return notes
    .split("\n")
    .filter((line) => line.startsWith("[ops]"))
    .map((line, index) => {
      const match = line.match(/^\[ops\]\[(.+?)\]\[(completion|incident)\]\[by:(.+?)\]\s*(.+)$/);

      if (!match) {
        return null;
      }

      return {
        id: `ops-${index}-${match[1]}`,
        dateLabel: match[1],
        type: match[2] as "completion" | "incident",
        actorLabel: match[3],
        detail: match[4],
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    dateLabel: string;
    type: "completion" | "incident";
    actorLabel: string;
    detail: string;
  }>;
}
