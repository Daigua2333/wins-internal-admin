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
    <aside className="sidebar-panel relative isolate flex h-full w-full flex-col overflow-hidden rounded-[2rem] text-slate-900">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-amber-200/18 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(100,116,139,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,.18)_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative px-5 pb-4 pt-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="group flex min-w-0 items-center gap-3 rounded-[1.4rem] border border-white/90 bg-white/70 p-3 shadow-[0_12px_28px_rgba(15,23,42,.055)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white/90 hover:shadow-[0_18px_36px_rgba(15,23,42,.08)]"
        >
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-cyan-700/10 bg-[linear-gradient(145deg,#0f172a,#0f766e)] text-white shadow-[0_12px_26px_rgba(15,118,110,.16)]">
            <Building2 className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-700">WINS</p>
              <span className="h-px flex-1 bg-gradient-to-r from-cyan-600/20 to-transparent" />
            </div>
            <h1 className="mt-1 truncate text-sm font-semibold tracking-tight text-slate-950">International Travel Group</h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">Tokyo Internal Operations</p>
          </div>
        </Link>
      </div>

      <div className="relative mx-5 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />

      <nav className="sidebar-scroll relative min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {groups.map((group) => {
          const groupItems = items.filter((item) => item.group === group.key);
          if (!groupItems.length) return null;

          return (
            <section key={group.key}>
              <div className="mb-2 flex items-center gap-3 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">{group.label}</p>
                <span className="h-px flex-1 bg-slate-300/60" />
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
                          ? "bg-[linear-gradient(135deg,#0f172a,#115e59)] text-white shadow-[0_14px_28px_rgba(15,23,42,.14)]"
                          : "text-slate-600 hover:bg-white/75 hover:text-slate-950 hover:shadow-[0_10px_24px_rgba(15,23,42,.055)]",
                      )}
                    >
                      {isActive ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-cyan-200 to-emerald-300 shadow-[0_0_12px_rgba(103,232,249,.6)]" /> : null}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition",
                          isActive
                            ? "border-white/15 bg-white/10 text-cyan-100"
                            : "border-slate-200/70 bg-white/65 text-slate-500 group-hover:border-cyan-200 group-hover:bg-cyan-50 group-hover:text-cyan-800",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition duration-200",
                          isActive ? "translate-x-0 text-cyan-100/80" : "-translate-x-1 text-transparent group-hover:translate-x-0 group-hover:text-slate-400",
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
        <div className="rounded-[1.4rem] border border-white/90 bg-white/72 p-3.5 shadow-[0_14px_32px_rgba(15,23,42,.07)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-700/10 bg-[linear-gradient(145deg,#0f172a,#0f766e)] text-white shadow-md shadow-cyan-950/10">
              <ShieldCheck className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-950">{roleLabel ?? "未分配角色"}</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-500">权限与 Supabase 安全连接已启用</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/75 px-2 text-[11px] font-medium text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
            >
              <Sparkles className="h-3.5 w-3.5" />
              运营总览
            </Link>
            {canOpenSettings ? (
              <Link
                href="/settings"
                onClick={onNavigate}
                className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/75 px-2 text-[11px] font-medium text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
              >
                账号权限
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/70 bg-slate-50/75 px-2 text-[11px] font-medium text-slate-400">
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
