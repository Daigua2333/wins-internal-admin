"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  BusFront,
  Calculator,
  CalendarDays,
  CarFront,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  UserSquare2,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { NavConfigItem } from "@/lib/auth/navigation";

type SidebarProps = {
  onNavigate?: () => void;
  items: NavConfigItem[];
  roleLabel?: string;
};

const iconByHref = {
  "/dashboard": LayoutDashboard,
  "/calendar": CalendarDays,
  "/orders": ClipboardList,
  "/fleet": CarFront,
  "/drivers": BusFront,
  "/guides": UserSquare2,
  "/customers": Users,
  "/pricing": FileText,
  "/profit": Calculator,
  "/finance": CircleDollarSign,
  "/settings": Settings,
} as const;

export function Sidebar({ onNavigate, items, roleLabel }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(180deg,rgba(5,15,25,0.98),rgba(12,27,41,0.96))] px-5 py-6 text-slate-100 shadow-[0_24px_60px_rgba(2,6,23,0.24)]">
      <div className="flex items-center gap-3 border-b border-white/10 pb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-200 shadow-lg shadow-cyan-950/10">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">WINS</p>
          <h1 className="text-sm font-semibold leading-5">International Travel Group</h1>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const Icon = iconByHref[item.href as keyof typeof iconByHref] ?? LayoutDashboard;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                isActive
                  ? "bg-[linear-gradient(135deg,#ffffff,#ecfeff)] text-slate-950 shadow-lg shadow-cyan-950/10"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Tokyo Operations</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              面向东京入境旅游运营团队，后续可直接切入 Supabase 权限与实时数据。
              {roleLabel ? ` 当前角色：${roleLabel}` : ""}
            </p>
          </div>
          <div className="rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-300">Live</div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>今日运转率</span>
            <span>87%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
            <span>查看运营日报</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </aside>
  );
}
