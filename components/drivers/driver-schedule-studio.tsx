"use client";

import { useMemo, useState } from "react";

import { assignDriverSchedule } from "@/app/(dashboard)/drivers/actions";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import type { DriverScheduleSnapshot } from "@/lib/loaders/admin";

type DriverScheduleStudioProps = {
  snapshot: DriverScheduleSnapshot;
};

export function DriverScheduleStudio({ snapshot }: DriverScheduleStudioProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(snapshot.fairnessRecords[0]?.id ?? null);

  const selectedDriver = snapshot.fairnessRecords.find((record) => record.id === selectedDriverId) ?? snapshot.fairnessRecords[0] ?? null;
  const selectedRouteLogs = useMemo(
    () => (selectedDriver ? snapshot.routeLogs.filter((item) => item.driverId === selectedDriver.id) : []),
    [selectedDriver, snapshot.routeLogs],
  );

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="司机排班日程"
          description="把未来几天的司机排班集中到一个版面里，便于运营快速看出谁已经连续跑线路、谁还有空余。"
        >
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {snapshot.scheduleDays.map((day) => (
              <div key={day.date} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{day.weekdayLabel}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{day.dateLabel}</p>
                  </div>
                  <Badge label={`${day.assignments.length} 线`} tone={day.assignments.length ? "info" : "neutral"} />
                </div>

                <div className="mt-3 space-y-2">
                  {day.assignments.length ? (
                    day.assignments.map((assignment) => (
                      <button
                        key={assignment.id}
                        type="button"
                        onClick={() => setSelectedDriverId(assignment.driverId)}
                        className="w-full rounded-2xl border border-white bg-white px-3 py-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-900">{assignment.driverName}</p>
                          <Badge label={assignment.statusLabel} tone="info" />
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{assignment.routeTitle}</p>
                        <p className="mt-2 text-xs text-slate-500">{assignment.orderNo}</p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">暂无排班</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="公平排班视图"
          description="按本周线路数和已排班天数做一个轻量平衡视图，帮助你避免总是把高峰单压给同一位司机。"
        >
          <div className="space-y-3">
            {snapshot.fairnessRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => setSelectedDriverId(record.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selectedDriver?.id === record.id
                    ? "border-cyan-300 bg-cyan-50"
                    : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{record.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {record.language} · {record.contractLabel}
                    </p>
                  </div>
                  <Badge
                    label={record.fairnessLabel}
                    tone={record.fairnessTone === "busy" ? "warning" : record.fairnessTone === "light" ? "neutral" : "success"}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p>本周排班</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{record.assignedDays} 天</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p>线路数</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{record.routeCount} 条</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p>月工时</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{record.monthlyDutyHours}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="司机每日线路记录"
        description="保留司机每天跑过什么线路的轻量记录，后续排班时就能更公平地分配旺线、机场线和长距离线路。"
      >
        {selectedDriver ? (
          <div className="space-y-4">
            <form action={assignDriverSchedule} className="rounded-2xl border border-slate-200 bg-white p-4">
              <input type="hidden" name="driverId" value={selectedDriver.id} />
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium text-slate-700">直接安排到订单</label>
                  <select name="orderId" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white">
                    {snapshot.dispatchCandidates.map((candidate) => (
                      <option key={candidate.orderId} value={candidate.orderId}>
                        {candidate.serviceDateLabel} · {candidate.orderNo} · {candidate.routeTitle} · 当前司机：{candidate.currentDriverName}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800">
                  安排这位司机
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-500">如果同一天这位司机已经有别的线路，系统会直接阻止保存，避免撞单。</p>
            </form>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Driver</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedDriver.name}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge
                  label={selectedDriver.fairnessLabel}
                  tone={selectedDriver.fairnessTone === "busy" ? "warning" : selectedDriver.fairnessTone === "light" ? "neutral" : "success"}
                />
                <span className="text-xs text-slate-500">{selectedDriver.language}</span>
              </div>
            </div>

            <div className="space-y-3">
              {selectedRouteLogs.length ? (
                selectedRouteLogs.map((routeLog) => (
                  <div key={routeLog.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{routeLog.routeTitle}</p>
                          <Badge label={routeLog.statusLabel} tone="info" />
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {routeLog.dateLabel} · {routeLog.orderNo}
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">用于后续公平排班参考</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">当前司机还没有线路记录。</div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">当前没有可显示的司机排班记录。</div>
        )}
      </SectionCard>
    </section>
  );
}
