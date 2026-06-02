"use client";

import { useMemo, useState } from "react";

import { ProfitOverview } from "@/components/charts/profit-overview";
import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";

type ProfitRow = Record<string, string>;

type MockProfitLabProps = {
  rows: ProfitRow[];
  canViewSensitiveMetrics?: boolean;
};

export function MockProfitLab({ rows, canViewSensitiveMetrics = true }: MockProfitLabProps) {
  const [statusFilter, setStatusFilter] = useState("全部");
  const [selectedProject, setSelectedProject] = useState(rows[0]?.project ?? "");

  const filteredRows = useMemo(() => {
    if (statusFilter === "全部") return rows;
    return rows.filter((row) => row.status === statusFilter);
  }, [rows, statusFilter]);

  const selectedRow = filteredRows.find((row) => row.project === selectedProject) ?? filteredRows[0] ?? null;
  const selectedIndex = selectedRow ? filteredRows.findIndex((row) => row.project === selectedRow.project) : undefined;

  return (
    <div className="space-y-4">
      <section className="grid gap-4 2xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard title="毛利趋势" description="切换利润视角时，趋势图和明细面板会一起联动。">
          <ProfitOverview />
        </SectionCard>

        <SectionCard title="利润观察" description="帮助运营和财务快速判断哪些线路值得优先销售。">
          <div className="flex flex-wrap gap-2">
            {["全部", "盈利中", "正常"].map((filter) => (
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

          {selectedRow ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Project</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRow.project}</p>
                <div className="mt-3">
                  <Badge label={selectedRow.status} tone={selectedRow.status === "盈利中" ? "success" : "info"} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["营收", canViewSensitiveMetrics ? selectedRow.revenue : "需要财务或管理员权限"],
                  ["成本", canViewSensitiveMetrics ? selectedRow.cost : "需要财务或管理员权限"],
                  ["利润", canViewSensitiveMetrics ? selectedRow.profit : "需要财务或管理员权限"],
                  ["毛利率", canViewSensitiveMetrics ? selectedRow.margin : "需要财务或管理员权限"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              {canViewSensitiveMetrics ? null : (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  当前账号只能看到项目状态，敏感利润数据仅向财务与管理员开放。
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">当前筛选下没有项目。</div>
          )}
        </SectionCard>
      </section>

      <SectionCard title="利润明细" description="点击行可查看右上角项目详情，模拟真实利润分析页的联动体验。">
        <DataTable
          columns={["项目", "营收", "成本", "利润", "毛利率", "状态"]}
          rows={filteredRows}
          selectedRowIndex={selectedIndex}
          onRowClick={(row) => setSelectedProject(row.project)}
          emptyMessage="当前筛选下没有利润记录。"
        />
      </SectionCard>
    </div>
  );
}
