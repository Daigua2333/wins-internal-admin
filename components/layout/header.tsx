"use client";

import { useEffect, useState } from "react";
import { Bell, Menu, Plus, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type HeaderProps = {
  title: string;
  subtitle: string;
  onMenuClick?: () => void;
  userEmail?: string;
  roleLabel?: string;
  canCreateOrder?: boolean;
};

export function Header({ title, subtitle, onMenuClick, userEmail, roleLabel, canCreateOrder }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState("");

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

  return (
    <header className="glass-panel relative overflow-hidden rounded-[2rem] px-5 py-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.14),transparent_62%)]" />
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm xl:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-700">
                Live
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/80 px-4 py-3 text-sm text-slate-500 shadow-sm">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">搜索订单、客户、司机或报价单</span>
            <span className="sm:hidden">全局搜索</span>
          </div>

          <div className="flex items-center gap-3">
            <Badge label={roleLabel ?? "Internal Admin"} tone="info" />
            <span className="hidden rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-500 lg:inline-flex">
              Tokyo · {currentTime || "--/-- --:--"}
            </span>
            {canCreateOrder ? (
              <button className="hidden h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-4 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 lg:flex">
                <Plus className="h-4 w-4" />
                新建订单
              </button>
            ) : null}
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-3 py-2 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#0f766e)] text-white shadow-md shadow-cyan-950/10">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{roleLabel ?? "Internal Admin"}</p>
                <p className="text-xs text-slate-500">{userEmail ?? "未登录邮箱"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
