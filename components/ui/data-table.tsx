"use client";

import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";

type DataTableProps = {
  columns: string[];
  rows: Record<string, string>[];
  onRowClick?: (row: Record<string, string>, index: number) => void;
  selectedRowIndex?: number;
  emptyMessage?: string;
};

function resolveTone(value: string) {
  if (["待确认", "保养中", "休假中"].includes(value)) return "warning" as const;
  if (["进行中", "已排车", "已排班", "可调度", "可派单", "长期合作", "已发送", "盈利中", "已接受"].includes(value)) {
    return "success" as const;
  }
  if (["待命中", "正常"].includes(value)) return "info" as const;
  return "neutral" as const;
}

export function DataTable({ columns, rows, onRowClick, selectedRowIndex, emptyMessage = "暂无数据" }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/90 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-[linear-gradient(180deg,#f8fafc,#f2f6f9)]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={cn(
                  "group hover:bg-[linear-gradient(90deg,rgba(240,253,250,0.9),rgba(248,250,252,0.9))]",
                  onRowClick ? "cursor-pointer transition" : "",
                  selectedRowIndex === rowIndex ? "bg-[linear-gradient(90deg,rgba(207,250,254,0.72),rgba(240,249,255,0.78))]" : "",
                )}
              >
                {Object.entries(row).map(([key, value]) => (
                  <td key={key} className="max-w-[18rem] whitespace-normal break-words px-4 py-4 text-sm text-slate-700 transition-colors group-hover:text-slate-900">
                    {key === "status" ? <Badge label={value} tone={resolveTone(value)} /> : value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
