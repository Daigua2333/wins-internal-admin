"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ProfitOverview } from "@/components/charts/profit-overview";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import type { ProfitOperationsRecord } from "@/lib/loaders/admin";

type ProfitOperationsWorkbenchProps = {
  records: ProfitOperationsRecord[];
  canViewSensitiveMetrics: boolean;
  canMaintainCosts: boolean;
  chartData: Array<{
    label: string;
    revenue: number;
    cost: number;
  }>;
};

export function ProfitOperationsWorkbench({
  records,
  canViewSensitiveMetrics,
  canMaintainCosts,
  chartData,
}: ProfitOperationsWorkbenchProps) {
  const [statusFilter, setStatusFilter] = useState("全部");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);

  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((record) => {
      const matchesStatus = statusFilter === "全部" || record.statusLabel === statusFilter;
      const matchesQuery = !normalized || [record.orderNo, record.project, record.customerName].join(" ").toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [query, records, statusFilter]);

  const selectedRecord = filteredRecords.find((row) => row.id === selectedId) ?? filteredRecords[0] ?? null;
  const selectedIndex = selectedRecord ? filteredRecords.findIndex((row) => row.id === selectedRecord.id) : undefined;

  const tableRows = filteredRecords.map((record) => ({
    project: `${record.orderNo} · ${record.project}`,
    revenue: canViewSensitiveMetrics ? record.revenueLabel : "需要财务或管理员权限",
    cost: canViewSensitiveMetrics ? record.totalCostLabel : "需要财务或管理员权限",
    profit: canViewSensitiveMetrics ? record.grossProfitLabel : "需要财务或管理员权限",
    margin: canViewSensitiveMetrics ? record.grossMarginLabel : "需要财务或管理员权限",
    status: record.statusLabel,
  }));

  return (
    <div className="space-y-4">
      <section className="grid gap-4 2xl:grid-cols-[1.08fr_0.92fr]">
        <SectionCard title="毛利趋势" description="基于真实订单营收与总成本汇总后的趋势概览。">
          <ProfitOverview data={chartData} />
        </SectionCard>

        <SectionCard title="利润观察" description="帮助运营和财务快速判断哪些订单毛利健康，哪些项目需要补看成本构成。">
          <label className="mb-4 flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索订单号、客户或行程" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div className="flex flex-wrap gap-2">
            {["全部", "盈利中", "正常", "已取消"].map((filter) => (
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

          {selectedRecord ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Order</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.project}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedRecord.orderNo} · {selectedRecord.customerName} · {selectedRecord.serviceDateLabel}
                </p>
                <div className="mt-3">
                  <Badge label={selectedRecord.statusLabel} tone={resolveProfitTone(selectedRecord.status)} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/orders?focus=${encodeURIComponent(selectedRecord.id)}`} className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-800">
                    {canMaintainCosts ? "打开订单并维护成本" : "打开订单详情"}
                  </Link>
                  <Link href="/finance" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700">
                    前往回款与对账
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["营收", canViewSensitiveMetrics ? selectedRecord.revenueLabel : "需要财务或管理员权限"],
                  ["成本", canViewSensitiveMetrics ? selectedRecord.totalCostLabel : "需要财务或管理员权限"],
                  ["利润", canViewSensitiveMetrics ? selectedRecord.grossProfitLabel : "需要财务或管理员权限"],
                  ["毛利率", canViewSensitiveMetrics ? selectedRecord.grossMarginLabel : "需要财务或管理员权限"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              {canViewSensitiveMetrics ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">成本构成</p>
                      <p className="mt-1 text-sm text-slate-500">从订单成本明细里反推车辆、司机、导游和其他支出占比。</p>
                    </div>
                    <Badge label={`${selectedRecord.costBreakdown.length} 项`} tone="info" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {selectedRecord.costBreakdown.length ? (
                      selectedRecord.costBreakdown.map((item) => (
                        <div key={item.category} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.categoryLabel}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.category}</p>
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{item.amountLabel}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">当前订单还没有拆出成本明细，利润主要来自总成本字段。</div>
                    )}
                  </div>
                </div>
              ) : (
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

      <SectionCard title="利润明细" description="点击行后，右侧会联动显示这张订单的利润和成本构成。">
        <DataTable
          columns={["项目", "营收", "成本", "利润", "毛利率", "状态"]}
          rows={tableRows}
          selectedRowIndex={selectedIndex}
          onRowClick={(_, rowIndex) => setSelectedId(filteredRecords[rowIndex]?.id ?? null)}
          emptyMessage="当前筛选下没有利润记录。"
        />
      </SectionCard>
    </div>
  );
}

function resolveProfitTone(status: string) {
  if (status === "completed" || status === "in_progress") return "success" as const;
  if (status === "cancelled") return "neutral" as const;
  return "info" as const;
}
