"use client";

import { useMemo, useState } from "react";

import { assignGuideSchedule } from "@/app/(dashboard)/guides/actions";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import type { GuideScheduleSnapshot } from "@/lib/loaders/admin";

type GuideScheduleStudioProps = {
  snapshot: GuideScheduleSnapshot;
};

export function GuideScheduleStudio({ snapshot }: GuideScheduleStudioProps) {
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(snapshot.routeLogs[0]?.guideId ?? null);

  const selectedGuideLogs = useMemo(
    () => (selectedGuideId ? snapshot.routeLogs.filter((item) => item.guideId === selectedGuideId) : []),
    [selectedGuideId, snapshot.routeLogs],
  );

  const selectedGuideName =
    snapshot.scheduleDays.flatMap((day) => day.assignments).find((assignment) => assignment.guideId === selectedGuideId)?.guideName ??
    snapshot.routeLogs.find((item) => item.guideId === selectedGuideId)?.routeTitle;

  return (
    <section className="space-y-4">
      <SectionCard
        title="导游排班日程"
        description="把未来几天的导游排班集中展示，方便运营快速看到谁已在带团、谁还可以承接重点行程。"
      >
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          {snapshot.scheduleDays.map((day) => (
            <div key={day.date} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{day.weekdayLabel}</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{day.dateLabel}</p>
                </div>
                <Badge label={`${day.assignments.length} 团`} tone={day.assignments.length ? "info" : "neutral"} />
              </div>

              <div className="mt-3 space-y-2">
                {day.assignments.length ? (
                  day.assignments.map((assignment) => (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => setSelectedGuideId(assignment.guideId)}
                      className="w-full rounded-2xl border border-white bg-white px-3 py-3 text-left transition hover:border-cyan-200 hover:bg-cyan-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">{assignment.guideName}</p>
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
        title="导游服务记录与直排"
        description="保留导游近期带团记录，也可以直接把导游安排到订单上。"
      >
        <div className="space-y-4">
          <form action={assignGuideSchedule} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">选择导游</label>
                <select
                  name="guideId"
                  value={selectedGuideId ?? ""}
                  onChange={(event) => setSelectedGuideId(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white"
                >
                  {Array.from(
                    new Map(
                      snapshot.routeLogs.map((item) => [item.guideId, { id: item.guideId, name: item.routeTitle }]),
                    ).entries(),
                  ).map(([id]) => (
                    <option key={id} value={id}>
                      {snapshot.scheduleDays.flatMap((day) => day.assignments).find((assignment) => assignment.guideId === id)?.guideName ?? id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium text-slate-700">直接安排到订单</label>
                <select name="orderId" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white">
                  {snapshot.dispatchCandidates.map((candidate) => (
                    <option key={candidate.orderId} value={candidate.orderId}>
                      {candidate.serviceDateLabel} · {candidate.orderNo} · {candidate.routeTitle} · 当前导游：{candidate.currentGuideName}
                    </option>
                  ))}
                </select>
              </div>
              <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800">
                安排这位导游
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">如果同一天这位导游已经在别的订单带团，系统会直接阻止保存，避免撞单。</p>
          </form>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Guide</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedGuideName ?? "未选择导游"}</p>
          </div>

          <div className="space-y-3">
            {selectedGuideLogs.length ? (
              selectedGuideLogs.map((routeLog) => (
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
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">用于后续高端团与企业团安排参考</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">当前导游还没有带团记录。</div>
            )}
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
