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
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShieldCheck,
  Sparkles,
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
  "/audit": ListChecks,
  "/settings": Settings,
} as const;

const groups: Array<{ key: NavConfigItem["group"]; label: string }> = [
  { key: "overview", label: "工作台" },
  { key: "operations", label: "业务运营" },
  { key: "resources", label: "资源调度" },
  { key: "governance", label: "财务与治理" },
];

export function Sidebar({ onNavigate, items, roleLabel }: SidebarProps) {
  const pathname = usePathname();
  const canOpenSettings = items.some((item) => item.href === "/settings");

  return (
    <aside className="relative isolate flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(165deg,#071521_0%,#0b1d2b_48%,#102736_100%)] text-slate-100 shadow-[0_30px_80px_rgba(2,12,27,0.28)]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-amber-300/8 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative px-5 pb-4 pt-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="group flex min-w-0 items-center gap-3 rounded-[1.4rem] border border-white/8 bg-white/[0.045] p-3 transition hover:border-cyan-300/20 hover:bg-white/[0.075]"
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(34,211,238,.18),rgba(15,118,110,.08))] text-cyan-200 shadow-[0_12px_28px_rgba(6,182,212,.1)]">
            <Building2 className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0a1b28] bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-200/70">WINS</p>
              <span className="h-px flex-1 bg-gradient-to-r from-cyan-300/25 to-transparent" />
            </div>
            <h1 className="mt-1 truncate text-sm font-semibold tracking-tight text-white">International Travel Group</h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Tokyo Internal Operations</p>
          </div>
        </Link>
      </div>

      <div className="relative mx-5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <nav className="sidebar-scroll relative min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {groups.map((group) => {
          const groupItems = items.filter((item) => item.group === group.key);
          if (!groupItems.length) return null;

          return (
            <section key={group.key}>
              <div className="mb-2 flex items-center gap-3 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{group.label}</p>
                <span className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="space-y-1">
                {groupItems.map((item) => {
                  const Icon = iconByHref[item.href as keyof typeof iconByHref] ?? LayoutDashboard;
                  const isActive = item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex min-h-11 items-center gap-3 overflow-hidden rounded-[1.15rem] px-3 py-2.5 text-sm transition duration-200",
                        isActive
                          ? "bg-[linear-gradient(135deg,rgba(255,255,255,.14),rgba(34,211,238,.08))] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.1),0_12px_26px_rgba(2,12,27,.18)]"
                          : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-100",
                      )}
                    >
                      {isActive ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-cyan-300 to-emerald-400 shadow-[0_0_12px_rgba(103,232,249,.65)]" /> : null}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition",
                          isActive
                            ? "border-cyan-200/20 bg-cyan-300/10 text-cyan-100"
                            : "border-transparent bg-white/[0.035] text-slate-400 group-hover:border-white/8 group-hover:bg-white/[0.07] group-hover:text-cyan-100",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition duration-200",
                          isActive ? "translate-x-0 text-cyan-200/80" : "-translate-x-1 text-transparent group-hover:translate-x-0 group-hover:text-slate-500",
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <div className="relative p-4 pt-2">
        <div className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.035))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/10 text-emerald-200">
              <ShieldCheck className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-white">{roleLabel ?? "未分配角色"}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Live
                </span>
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-400">权限与 Supabase 安全连接已启用</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.045] px-2 text-[11px] font-medium text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/8 hover:text-cyan-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              运营总览
            </Link>
            {canOpenSettings ? (
              <Link
                href="/settings"
                onClick={onNavigate}
                className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.045] px-2 text-[11px] font-medium text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-300/8 hover:text-cyan-100"
              >
                账号权限
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.025] px-2 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                权限已同步
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
