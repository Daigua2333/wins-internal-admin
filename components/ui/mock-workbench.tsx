"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";

type MockWorkbenchProps = {
  title: string;
  description: string;
  columns: string[];
  rows: Record<string, string>[];
  searchPlaceholder: string;
  filters: string[];
  primaryAction: string;
  canCreate?: boolean;
  readOnlyMessage?: string;
};

export function MockWorkbench({
  title,
  description,
  columns,
  rows,
  searchPlaceholder,
  filters,
  primaryAction,
  canCreate = true,
  readOnlyMessage = "当前角色可查看数据，但不能在这里创建或修改记录。",
}: MockWorkbenchProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("全部");
  const [selectedId, setSelectedId] = useState<string | null>(rows[0] ? getRowId(rows[0]) : null);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesQuery =
        query.trim().length === 0 ||
        Object.values(row).some((value) => value.toLowerCase().includes(query.trim().toLowerCase()));
      const matchesFilter =
        activeFilter === "全部" || Object.values(row).some((value) => value.toLowerCase().includes(activeFilter.toLowerCase()));

      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, query, rows]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !filteredRows.some((row) => getRowId(row) === selectedId)) {
      setSelectedId(getRowId(filteredRows[0]));
    }
  }, [filteredRows, selectedId]);

  const selectedRow = filteredRows.find((row) => getRowId(row) === selectedId) ?? filteredRows[0] ?? null;
  const selectedIndex = selectedRow ? filteredRows.findIndex((row) => getRowId(row) === getRowId(selectedRow)) : undefined;

  return (
    <section className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
      <SectionCard
        title={title}
        description={description}
        action={
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              canCreate ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800"
            }`}
          >
            {canCreate ? primaryAction : "只读模式"}
          </span>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {["全部", ...filters].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeFilter === filter
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>当前结果 {filteredRows.length} 条</span>
            <span>{canCreate ? "点击行可查看详情" : readOnlyMessage}</span>
          </div>

          <DataTable
            columns={columns}
            rows={filteredRows}
            selectedRowIndex={selectedIndex}
            onRowClick={(row) => setSelectedId(getRowId(row))}
            emptyMessage="没有匹配到结果，请调整搜索词或筛选条件。"
          />
        </div>
      </SectionCard>

      <SectionCard title="详情面板" description="模拟真实后台中的侧边明细区，后续可替换为抽屉、弹窗或独立详情页。">
        {selectedRow ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Record</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{Object.values(selectedRow)[0]}</p>
              <div className="mt-3">
                {selectedRow.status ? <Badge label={selectedRow.status} tone="info" /> : null}
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm text-slate-500">{toLabel(key)}</p>
                  <p className="text-right text-sm font-medium text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-4">
              <p className="text-sm font-medium text-cyan-900">下一步建议</p>
              <p className="mt-2 text-sm leading-6 text-cyan-800">
                当前是 mock 交互版本。后续可以在这里接入真实备注、变更记录、审批按钮、打印、导出与 Supabase 行级详情。
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">当前没有可显示的记录。</div>
        )}
      </SectionCard>
    </section>
  );
}

function getRowId(row: Record<string, string>) {
  return Object.values(row).join("|");
}

function toLabel(key: string) {
  const labelMap: Record<string, string> = {
    orderNo: "订单号",
    customer: "客户",
    itinerary: "行程",
    date: "日期",
    assignee: "负责人",
    amount: "金额",
    plateNo: "车牌",
    type: "车型",
    seats: "座位",
    driver: "司机",
    inspection: "点检日期",
    name: "姓名",
    language: "语言",
    contract: "合同",
    dutyHours: "工时",
    safetyScore: "安全评分",
    specialty: "专长",
    license: "资质",
    rating: "评分",
    company: "公司",
    contact: "联系人",
    market: "市场",
    orders: "订单数",
    balance: "往来余额",
    quoteNo: "报价号",
    client: "客户",
    product: "产品",
    issueDate: "出单日期",
    validUntil: "有效期",
    project: "项目",
    revenue: "营收",
    cost: "成本",
    profit: "利润",
    margin: "毛利率",
    status: "状态",
  };

  return labelMap[key] ?? key;
}
