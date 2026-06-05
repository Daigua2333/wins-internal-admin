"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, Menu, Plus, Search, ShieldCheck, X } from "lucide-react";

import { OrderCreatePanel } from "@/components/orders/order-create-panel";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import type { OperationsReminderSnapshot, OrderCreateOption } from "@/lib/loaders/admin";

type HeaderProps = {
  title: string;
  subtitle: string;
  onMenuClick?: () => void;
  userEmail?: string;
  roleLabel?: string;
  canCreateOrder?: boolean;
  orderOptions?: {
    customers: OrderCreateOption[];
    assignees: OrderCreateOption[];
  };
  reminders?: OperationsReminderSnapshot;
  defaultStartTime?: string;
  reminderLeadDays?: number;
  targetGrossMarginRate?: number;
};

const searchTargets = [
  { label: "订单", href: "/orders", hint: "订单号、客户、行程、负责人" },
  { label: "客户", href: "/customers", hint: "公司名、联系人、市场标签" },
  { label: "司机", href: "/drivers", hint: "姓名、语言、合同类型、状态" },
  { label: "报价单", href: "/pricing", hint: "报价号、客户、行程、状态" },
];

export function Header({
  title,
  subtitle,
  onMenuClick,
  userEmail,
  roleLabel,
  canCreateOrder,
  orderOptions,
  reminders,
  defaultStartTime,
  reminderLeadDays,
  targetGrossMarginRate,
}: HeaderProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const sync = () => setCurrentTime(formatter.format(new Date()));
    sync();
    const timer = window.setInterval(sync, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const encodedSearchTerm = encodeURIComponent(searchTerm.trim());
  const reminderItems = reminders?.items ?? [];
  const totalReminders = reminderItems.length;

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!searchTerm.trim()) {
      setSearchOpen(true);
      return;
    }

    router.push(`/orders?query=${encodedSearchTerm}`);
    setSearchOpen(false);
  }

  return (
    <header className="glass-panel relative rounded-[2rem] px-5 py-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.14),transparent_62%)]" />
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm xl:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-700">
                Live
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0">
            <form
              onSubmit={handleSearchSubmit}
              className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/80 px-4 py-2.5 text-sm text-slate-500 shadow-sm transition focus-within:border-cyan-300 focus-within:bg-white focus-within:shadow-md"
            >
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="搜索订单、客户、司机或报价单"
                className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:w-72"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="清空搜索"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </form>

            {searchOpen ? (
              <div
                className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-30 overflow-hidden rounded-3xl border border-slate-200 bg-white/96 p-2 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur"
                onMouseLeave={() => {
                  if (!searchTerm.trim()) setSearchOpen(false);
                }}
              >
                <div className="px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">选择搜索范围</div>
                <div className="grid gap-1">
                  {searchTargets.map((target) => (
                    <Link
                      key={target.href}
                      href={`${target.href}${encodedSearchTerm ? `?query=${encodedSearchTerm}` : ""}`}
                      onClick={() => setSearchOpen(false)}
                      className="rounded-2xl px-3 py-2.5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">在{target.label}中搜索</p>
                          <p className="mt-1 text-xs text-slate-500">{target.hint}</p>
                        </div>
                        <Search className="h-4 w-4 text-slate-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <Badge label={roleLabel ?? "Internal Admin"} tone="info" />
            <span className="hidden rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-500 lg:inline-flex">
              Tokyo · {currentTime || "--/-- --:--"}
            </span>
            {canCreateOrder ? (
              <button
                type="button"
                onClick={() => setCreateOrderOpen(true)}
                className="hidden h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-4 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 lg:flex"
              >
                <Plus className="h-4 w-4" />
                新建订单
              </button>
            ) : null}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRemindersOpen((value) => !value)}
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700"
                aria-label="查看近期提醒"
              >
                <Bell className="h-4 w-4" />
                {totalReminders ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                    {totalReminders > 9 ? "9+" : totalReminders}
                  </span>
                ) : null}
              </button>

              {remindersOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.7rem)] z-30 w-[min(90vw,360px)] rounded-3xl border border-slate-200 bg-white/96 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur">
                  <div className="flex items-start justify-between gap-3 px-2 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">近期运营提醒</p>
                      <p className="mt-1 text-xs text-slate-500">
                        出团 {reminders?.counts.order ?? 0} · 报价 {reminders?.counts.quote ?? 0} · 车辆 {reminders?.counts.vehicle ?? 0}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemindersOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="关闭提醒"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                    {reminderItems.length ? (
                      reminderItems.slice(0, 6).map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setRemindersOpen(false)}
                          className="block rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-cyan-200 hover:bg-cyan-50/70"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                              <CalendarClock className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                  {item.categoryLabel}
                                </span>
                                <span className="text-[11px] text-slate-400">{item.dateLabel}</span>
                              </div>
                              <p className="mt-2 break-words text-sm font-medium text-slate-950">{item.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.detail}</p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-5 text-sm leading-6 text-emerald-800">
                        当前没有近期待处理提醒，运营队列很干净。
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#0f766e)] text-white shadow-md shadow-cyan-950/10">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{roleLabel ?? "Internal Admin"}</p>
                <p className="truncate text-xs text-slate-500">{userEmail ?? "未登录邮箱"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        title="快速新建订单"
        description="从顶部入口直接创建一次性订单或重复一日游订单。提交后会回到订单管理继续排车与跟进。"
        eyebrow="Create Order"
        maxWidthClassName="max-w-6xl"
      >
        <OrderCreatePanel
          customers={orderOptions?.customers ?? []}
          assignees={orderOptions?.assignees ?? []}
          canWriteOrders={Boolean(canCreateOrder)}
          redirectTo="/orders"
          defaultStartTime={defaultStartTime}
          reminderLeadDays={reminderLeadDays}
          targetGrossMarginRate={targetGrossMarginRate}
          variant="plain"
        />
      </Dialog>
    </header>
  );
}
