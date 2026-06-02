"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { OrderCreatePanel } from "@/components/orders/order-create-panel";
import { Dialog } from "@/components/ui/dialog";
import type { OrderCreateOption } from "@/lib/loaders/admin";

type OrderCreateDialogProps = {
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
  title?: string;
  description?: string;
};

export function OrderCreateDialog({
  customers,
  assignees,
  canWriteOrders,
  feedback,
  defaultServiceDate,
  redirectTo,
  defaultStartTime,
  reminderLeadDays,
  targetGrossMarginRate,
  title = "快速新建订单",
  description = "把订单创建做成弹层入口后，日历和中控页就不用被整块表单打断。",
}: OrderCreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">Quick Create</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!canWriteOrders}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建订单
          </button>
        </div>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="订单创建工作台"
        description="在弹层里完成一次性建单或重复建单，不打断当前页面的运营视角。"
        eyebrow="Create Order"
        maxWidthClassName="max-w-6xl"
      >
        <OrderCreatePanel
          customers={customers}
          assignees={assignees}
          canWriteOrders={canWriteOrders}
          feedback={feedback}
          defaultServiceDate={defaultServiceDate}
          redirectTo={redirectTo}
          defaultStartTime={defaultStartTime}
          reminderLeadDays={reminderLeadDays}
          targetGrossMarginRate={targetGrossMarginRate}
          variant="plain"
        />
      </Dialog>
    </>
  );
}
