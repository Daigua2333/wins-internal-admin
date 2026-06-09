"use client";

import { useState } from "react";

import { createOrder } from "@/app/(dashboard)/orders/actions";
import type { OrderCreateOption } from "@/lib/loaders/admin";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { StatStrip } from "@/components/ui/stat-strip";

type OrderCreatePanelProps = {
  customers: OrderCreateOption[];
  assignees: OrderCreateOption[];
  canWriteOrders: boolean;
  feedback?: {
    type: "success" | "error";
    message: string;
    detail?: string;
  } | null;
  defaultServiceDate?: string;
  redirectTo?: string;
  defaultStartTime?: string;
  reminderLeadDays?: number;
  targetGrossMarginRate?: number;
  variant?: "card" | "plain";
};

export function OrderCreatePanel({
  customers,
  assignees,
  canWriteOrders,
  feedback,
  defaultServiceDate,
  redirectTo,
  defaultStartTime,
  reminderLeadDays,
  targetGrossMarginRate,
  variant = "card",
}: OrderCreatePanelProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const customerRequirements = selectedCustomer?.requirements ?? [];

  const content = (
    <div className="space-y-4">
      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(240,253,250,0.9))] text-emerald-900"
              : "border-rose-200 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(254,242,242,0.9))] text-rose-900"
          }`}
        >
          <div>{feedback.message}</div>
          {feedback.detail ? <div className="mt-2 text-xs leading-5 opacity-80">{feedback.detail}</div> : null}
        </div>
      ) : null}

      <form action={createOrder} className="grid gap-4">
        {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
        <div className="rounded-[1.5rem] border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(248,250,252,0.92))] px-4 py-4 text-sm text-cyan-950">
          <StatStrip
            items={[
              { label: "默认出发", value: defaultStartTime ? `${defaultStartTime}` : "已接入默认时间", accent: "text-cyan-700" },
              { label: "提前提醒", value: typeof reminderLeadDays === "number" ? `${reminderLeadDays} 天` : "已启用", accent: "text-cyan-700" },
              { label: "目标毛利", value: typeof targetGrossMarginRate === "number" ? `${targetGrossMarginRate}%` : "已设定", accent: "text-cyan-700" },
            ]}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <FormSection title="订单基础信息" description="先确认客户、负责人、行程标题和服务日期，让这张订单具备进入运营链路的最小信息。">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">客户</label>
                <select
                  name="customerId"
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  disabled={!canWriteOrders}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">请选择客户</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.label}{customer.hint ? ` · ${customer.hint}` : ""}
                    </option>
                  ))}
                </select>
                {customerRequirements.length ? (
                  <div className="mt-3 space-y-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
                    <p className="font-medium">该客户有 {customerRequirements.length} 项未完成合作要求</p>
                    {customerRequirements.map((requirement) => (
                      <div key={requirement.id} className="rounded-xl border border-amber-200/80 bg-white/70 px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{requirement.title}</p>
                          <span className="text-xs text-amber-800">{requirement.priorityLabel} · 截止 {requirement.dueOnLabel}</span>
                        </div>
                        {requirement.description ? <p className="mt-1 text-xs leading-5 text-amber-900/80">{requirement.description}</p> : null}
                      </div>
                    ))}
                    <p className="text-xs leading-5 text-amber-800">创建后会把当前要求快照写入订单备注，方便调度和执行人员复核。</p>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">负责人</label>
                <select
                  name="assigneeId"
                  disabled={!canWriteOrders}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">默认当前登录账号</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.label}{assignee.hint ? ` · ${assignee.hint}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">行程标题</label>
                <input
                  type="text"
                  name="title"
                  disabled={!canWriteOrders}
                  placeholder="例如：Narita Pickup + Tokyo 3D2N"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">服务日期</label>
                <input
                  type="date"
                  name="serviceDate"
                  defaultValue={defaultServiceDate}
                  disabled={!canWriteOrders}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">出发 / 集合时间</label>
                <input
                  type="time"
                  name="serviceStartTime"
                  defaultValue={defaultStartTime ?? "09:00"}
                  disabled={!canWriteOrders}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">会写入订单备注，便于在日历里追溯当天集合或出发时间。</p>
              </div>
            </div>
          </FormSection>

          <FormSection title="运营参数与重复规则" description="适合你们高频的一日游业务，可一次性批量生成未来每天、每周或每月的重复订单。">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">订单状态</label>
                <select
                  name="status"
                  defaultValue="pending_confirmation"
                  disabled={!canWriteOrders}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="draft">草稿</option>
                  <option value="pending_confirmation">待确认</option>
                  <option value="scheduled">已排车</option>
                  <option value="in_progress">进行中</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">预计营收 JPY</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  name="revenueJpy"
                  disabled={!canWriteOrders}
                  placeholder="320000"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">重复规则</label>
                <select
                  name="repeatMode"
                  defaultValue="none"
                  disabled={!canWriteOrders}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="none">仅创建这一天</option>
                  <option value="daily">按每天重复</option>
                  <option value="weekly">按每周重复</option>
                  <option value="monthly">按每月重复</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">重复次数</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  step="1"
                  name="repeatOccurrences"
                  defaultValue="1"
                  disabled={!canWriteOrders}
                  placeholder="例如：7"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  比如选“按每天重复 + 7”，就会连续生成 7 天订单；选“按每周重复 + 4”，就会生成未来 4 周。
                </p>
              </div>
            </div>
          </FormSection>
        </div>

        <FormSection title="内部备注与调度提醒" description="把接机时间、团型、特殊需求和排车注意事项先沉淀下来，后续调度时更顺手。">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">内部备注</label>
            <textarea
              name="notes"
              rows={4}
              disabled={!canWriteOrders}
              placeholder="记录接机时间、团型、特殊需求或后续排车注意事项"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </FormSection>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {canWriteOrders
              ? "提交后会写入 orders 表；如果启用了重复规则，会一次性批量生成未来每天、每周或每月的订单。"
              : "当前账号只有读取权限。如需创建订单，请切换到运营、调度或管理员角色。"}
          </p>
          <PendingSubmitButton
            disabled={!canWriteOrders}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            pendingLabel="正在创建订单..."
          >
            创建订单
          </PendingSubmitButton>
        </div>
      </form>
    </div>
  );

  if (variant === "plain") {
    return content;
  }

  return (
    <SectionCard
      title="新建订单"
      description="先把订单创建这条主链路打通，后续再继续补报价转订单、排车、派司机与成本拆分。"
      action={
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            canWriteOrders ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"
          }`}
        >
          {canWriteOrders ? "可写入订单" : "只读模式"}
        </span>
      }
    >
      {content}
    </SectionCard>
  );
}
