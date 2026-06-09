"use client";

import { useMemo, useState } from "react";

import { updateDriverVehicleMatch } from "@/app/(dashboard)/drivers/actions";
import { Badge } from "@/components/ui/badge";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import type { DriverScheduleSnapshot } from "@/lib/loaders/admin";

type DriverScheduleStudioProps = {
  snapshot: DriverScheduleSnapshot;
  canManageMatching: boolean;
  redirectTo: "/drivers" | "/fleet";
};

export function DriverScheduleStudio({ snapshot, canManageMatching, redirectTo }: DriverScheduleStudioProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(snapshot.fairnessRecords[0]?.id ?? null);
  const selectedDriver = snapshot.fairnessRecords.find((record) => record.id === selectedDriverId) ?? snapshot.fairnessRecords[0] ?? null;
  const selectedRouteLogs = useMemo(
    () => (selectedDriver ? snapshot.routeLogs.filter((item) => item.driverId === selectedDriver.id) : []),
    [selectedDriver, snapshot.routeLogs],
  );
  const leadingBlankDays = snapshot.scheduleDays[0]
    ? (new Date(`${snapshot.scheduleDays[0].date}T00:00:00`).getDay() + 6) % 7
    : 0;

  return (
    <section className="space-y-4">
      <SectionCard
        title="月度司机排班表"
        description="按月份查看每一天出勤的司机、执行线路与车辆。司机颜色来自档案设置，方便快速辨认连续排班与未来安排。"
        action={
          <form method="get" action={redirectTo} className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              name="month"
              defaultValue={snapshot.month}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-cyan-400"
            />
            <button className="h-10 rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-cyan-800">
              查看月份
            </button>
          </form>
        }
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold text-slate-950">{snapshot.monthLabel}</p>
          <p className="text-sm text-slate-500">共 {snapshot.dispatchCandidates.length} 条订单安排</p>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
              {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((weekday) => (
                <div key={weekday} className="py-2">{weekday}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: leadingBlankDays }, (_, index) => (
                <div key={`blank-${index}`} className="min-h-28 rounded-2xl border border-dashed border-slate-100 bg-slate-50/50" />
              ))}
              {snapshot.scheduleDays.map((day) => (
                <div key={day.date} className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700">{Number(day.date.slice(-2))}</p>
                    {day.assignments.length ? <span className="text-[10px] text-slate-400">{day.assignments.length} 线</span> : null}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {day.assignments.map((assignment) => (
                      <button
                        key={assignment.id}
                        type="button"
                        onClick={() => setSelectedDriverId(assignment.driverId)}
                        className="w-full rounded-xl px-2 py-2 text-left text-white shadow-sm transition hover:-translate-y-0.5"
                        style={{ backgroundColor: assignment.driverColor }}
                        title={`${assignment.driverName} · ${assignment.routeTitle} · ${assignment.vehiclePlateNumber}`}
                      >
                        <p className="truncate text-[11px] font-semibold">{assignment.driverName}</p>
                        <p className="mt-0.5 truncate text-[10px] text-white/85">{assignment.routeTitle}</p>
                        <p className="mt-0.5 truncate text-[10px] text-white/75">{assignment.vehiclePlateNumber}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="每日司机与车辆匹配"
          description="直接修改某一天订单使用的司机和车辆。车辆留空时，会自动带入该司机档案里的默认车辆。"
        >
          <div className="space-y-3">
            {snapshot.dispatchCandidates.length ? (
              snapshot.dispatchCandidates.map((candidate) => (
                <form key={candidate.orderId} action={updateDriverVehicleMatch} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <input type="hidden" name="orderId" value={candidate.orderId} />
                  <input type="hidden" name="redirectTo" value={`${redirectTo}?month=${snapshot.month}`} />
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto] xl:items-end">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge label={candidate.serviceDateLabel} tone="info" />
                        <Badge label={candidate.statusLabel} tone="neutral" />
                      </div>
                      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{candidate.routeTitle}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {candidate.orderNo} · 当前 {candidate.currentDriverName} / {candidate.currentVehicleName}
                      </p>
                    </div>
                    <Field label="当日司机">
                      <select name="driverId" defaultValue={findDriverId(snapshot, candidate.orderId)} disabled={!canManageMatching} className={inputClassName}>
                        <option value="">待分配</option>
                        {snapshot.driverOptions.map((driver) => (
                          <option key={driver.id} value={driver.id}>{driver.label} · {driver.hint}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="当日车辆">
                      <select name="vehicleId" defaultValue={findVehicleId(snapshot, candidate.orderId)} disabled={!canManageMatching} className={inputClassName}>
                        <option value="">使用司机默认车辆</option>
                        {snapshot.vehicleOptions.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>{vehicle.label} · {vehicle.hint}</option>
                        ))}
                      </select>
                    </Field>
                    <PendingSubmitButton
                      disabled={!canManageMatching}
                      pendingLabel="保存中..."
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      保存匹配
                    </PendingSubmitButton>
                  </div>
                </form>
              ))
            ) : (
              <EmptyStateCard title="这个月还没有订单排班" description="创建带服务日期的订单后，就可以在这里匹配司机与车辆。" />
            )}
          </div>
        </SectionCard>

        <SectionCard title="司机出勤与线路记录" description="按司机颜色查看本月出勤天数、默认车辆和每天执行的线路。">
          <div className="space-y-3">
            {snapshot.fairnessRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => setSelectedDriverId(record.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedDriver?.id === record.id ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white hover:border-cyan-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: record.displayColor }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-950">{record.name}</p>
                      <Badge label={record.fairnessLabel} tone={record.fairnessTone === "busy" ? "warning" : record.fairnessTone === "light" ? "neutral" : "success"} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{record.monthlyAttendanceDays}出勤 · {record.routeCount} 条线路</p>
                    <p className="mt-1 text-xs text-slate-500">默认车辆：{record.defaultVehicleLabel}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {selectedDriver ? (
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
              <p className="text-sm font-medium text-slate-900">{selectedDriver.name} 本月线路</p>
              {selectedRouteLogs.length ? selectedRouteLogs.map((route) => (
                <div key={route.id} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-900">{route.dateLabel} · {route.routeTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">{route.vehiclePlateNumber} · {route.orderNo}</p>
                </div>
              )) : <p className="text-sm text-slate-500">本月暂无线路记录。</p>}
            </div>
          ) : null}
        </SectionCard>
      </section>
    </section>
  );
}

function findDriverId(snapshot: DriverScheduleSnapshot, orderId: string) {
  return snapshot.scheduleDays.flatMap((day) => day.assignments).find((assignment) => assignment.id === orderId)?.driverId ?? "";
}

function findVehicleId(snapshot: DriverScheduleSnapshot, orderId: string) {
  return snapshot.scheduleDays.flatMap((day) => day.assignments).find((assignment) => assignment.id === orderId)?.vehicleId ?? "";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

const inputClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";
