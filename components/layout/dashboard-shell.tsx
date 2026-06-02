"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { NavConfigItem } from "@/lib/auth/navigation";

type DashboardShellProps = {
  children: React.ReactNode;
  navItems: NavConfigItem[];
  userEmail?: string;
  roleLabel?: string;
  canCreateOrder?: boolean;
};

export function DashboardShell({ children, navItems, userEmail, roleLabel, canCreateOrder }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden xl:sticky xl:top-4 xl:block xl:h-[calc(100vh-2rem)]">
          <Sidebar items={navItems} roleLabel={roleLabel} />
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-4 top-4 bottom-4 w-[min(84vw,320px)]">
              <div className="absolute right-4 top-4 z-10">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Sidebar items={navItems} roleLabel={roleLabel} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <Header
            title="WINS 内部管理后台"
            subtitle="面向东京入境旅游运营、调度、销售与财务的统一工作台"
            onMenuClick={() => setMobileOpen(true)}
            userEmail={userEmail}
            roleLabel={roleLabel}
            canCreateOrder={canCreateOrder}
          />
          <main className="space-y-4 rounded-[2rem] border border-white/40 bg-white/20 p-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
