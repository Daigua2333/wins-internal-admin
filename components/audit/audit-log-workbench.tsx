"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { SectionCard } from "@/components/ui/section-card";
import type { AuditLogRecord } from "@/lib/loaders/admin";

type AuditLogWorkbenchProps = {
  records: AuditLogRecord[];
};

const actionFilters = [
  { value: "all", label: "全部动作" },
  { value: "create", label: "新增" },
  { value: "update", label: "更新" },
  { value: "void", label: "作废" },
  { value: "delete", label: "删除" },
];

const entityFilters = [
  { value: "all", label: "全部对象" },
  { value: "customer", label: "客户档案" },
  { value: "customer_collaboration_task", label: "客户合作任务" },
  { value: "order", label: "订单" },
  { value: "payment_receipt", label: "客户回款" },
  { value: "supplier_payment", label: "供应商付款" },
  { value: "profile", label: "账号与角色" },
  { value: "app_setting", label: "系统设置" },
];

export function AuditLogWorkbench({ records }: AuditLogWorkbenchProps) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [timeRange, setTimeRange] = useState("30");
  const [referenceTime] = useState(Date.now);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const cutoff = timeRange === "all" ? null : referenceTime - Number(timeRange) * 24 * 60 * 60 * 1000;

    return records.filter((record) => {
      const matchesQuery =
        !normalizedQuery ||
        [record.actorLabel, record.actionLabel, record.entityTypeLabel, record.summary, record.metadataLabel]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesAction = action === "all" || record.action === action;
      const matchesEntity = entityType === "all" || record.entityType === entityType;
      const matchesTime = cutoff === null || new Date(record.createdAt).getTime() >= cutoff;
      return matchesQuery && matchesAction && matchesEntity && matchesTime;
    });
  }, [action, entityType, query, records, referenceTime, timeRange]);

  return (
    <SectionCard
      title="统一操作日志"
      description="日志不可在后台修改。通过操作人、对象、动作、摘要和附加信息快速定位关键改动。"
      action={<Badge label={`${filteredRecords.length} 条结果`} tone={filteredRecords.length ? "info" : "neutral"} />}
    >
      <div className="space-y-4">
        <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(10rem,0.3fr))]">
          <label className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索操作人、摘要、客户、订单或附加信息"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
          <FilterSelect value={action} onChange={setAction} options={actionFilters} />
          <FilterSelect value={entityType} onChange={setEntityType} options={entityFilters} />
          <FilterSelect
            value={timeRange}
            onChange={setTimeRange}
            options={[
              { value: "7", label: "最近 7 天" },
              { value: "30", label: "最近 30 天" },
              { value: "90", label: "最近 90 天" },
              { value: "all", label: "全部时间" },
            ]}
          />
        </div>

        {filteredRecords.length ? (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <Link
                key={record.id}
                href={record.href}
                className="group block rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge label={record.actionLabel} tone={resolveActionTone(record.action)} />
                      <Badge label={record.entityTypeLabel} tone="neutral" />
                      <span className="text-xs text-slate-500">{record.createdAtLabel}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">{record.summary}</p>
                    {record.metadataLabel ? <p className="mt-2 break-words text-xs leading-5 text-slate-500">{record.metadataLabel}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm text-slate-600">
                    <span>{record.actorLabel}</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-cyan-700" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyStateCard title="当前筛选下没有操作日志" description="调整关键词、动作、业务对象或时间范围后再查看。" />
        )}
      </div>
    </SectionCard>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 min-w-0 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-cyan-400"
    >
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function resolveActionTone(action: string) {
  if (action === "void" || action === "delete" || action === "disable") return "warning" as const;
  if (action === "create" || action === "enable") return "success" as const;
  return "info" as const;
}
