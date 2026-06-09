"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { createDriver, deleteDriver, recordDriverIncident, updateDriverBasics, updateDriverStatus } from "@/app/(dashboard)/drivers/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { StatStrip } from "@/components/ui/stat-strip";
import type { DriverDispatchCandidate, DriverOperationsRecord, OrderCreateOption } from "@/lib/loaders/admin";

type DriverOperationsWorkbenchProps = {
  records: DriverOperationsRecord[];
  vehicleOptions: OrderCreateOption[];
  orderOptions: DriverDispatchCandidate[];
  canWriteDrivers: boolean;
  initialQuery?: string;
};

const statusOptions = [
  { value: "available", label: "可派单" },
  { value: "assigned", label: "已排班" },
  { value: "off_duty", label: "休假中" },
  { value: "inactive", label: "停用" },
];

export function DriverOperationsWorkbench({ records, vehicleOptions, orderOptions, canWriteDrivers, initialQuery }: DriverOperationsWorkbenchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => setQuery(initialQuery ?? ""), [initialQuery]);

  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((record) =>
      !normalized ||
      [record.fullName, record.languageLabel, record.phone, record.wechatId, record.lineId, record.defaultVehicleLabel]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, records]);

  useEffect(() => {
    if (!filteredRecords.some((record) => record.id === selectedId)) setSelectedId(filteredRecords[0]?.id ?? null);
  }, [filteredRecords, selectedId]);

  const selectedRecord = records.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? null;

  return (
    <section className="space-y-4">
      <SectionCard
        title="司机档案与默认车辆"
        description="维护司机联系方式、颜色、月出勤天数与默认车辆。默认绑定用于快速排班，每一天仍可在月度排班表里单独修改。"
        action={
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canWriteDrivers}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-4 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建司机
          </button>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名、微信、LINE、默认车辆" className="w-full bg-transparent text-sm outline-none" />
            </label>
            {filteredRecords.length ? filteredRecords.map((record) => (
              <button
                key={record.id}
                type="button"
                onClick={() => setSelectedId(record.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  selectedRecord?.id === record.id ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white hover:border-cyan-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: record.displayColor }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-950">{record.fullName}</p>
                      <Badge label={record.statusLabel} tone={resolveDriverTone(record.status)} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{record.languageLabel} · {record.contractLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">本月出勤 {record.attendanceDaysLabel} · 默认车辆 {record.defaultVehicleLabel}</p>
                  </div>
                </div>
              </button>
            )) : <EmptyStateCard title="没有匹配的司机" description="调整搜索词或新建司机档案。" />}
          </div>

          {selectedRecord ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 h-5 w-5 shrink-0 rounded-full" style={{ backgroundColor: selectedRecord.displayColor }} />
                    <div>
                      <p className="text-xl font-semibold text-slate-950">{selectedRecord.fullName}</p>
                      <p className="mt-1 text-sm text-slate-500">{selectedRecord.languageLabel} · {selectedRecord.contractLabel}</p>
                    </div>
                  </div>
                  <form id={`delete-driver-${selectedRecord.id}`} action={deleteDriver}>
                    <input type="hidden" name="driverId" value={selectedRecord.id} />
                    <ConfirmActionButton
                      formId={`delete-driver-${selectedRecord.id}`}
                      title="确认删除这位司机？"
                      description="删除后司机会从台账中移除，已有订单中的司机分配会被清空。"
                      confirmLabel="确认删除"
                      tone="danger"
                      disabled={!canWriteDrivers}
                    >
                      删除司机
                    </ConfirmActionButton>
                  </form>
                </div>
              </div>

              <StatStrip
                items={[
                  { label: "月出勤天数", value: selectedRecord.attendanceDaysLabel },
                  { label: "默认车辆", value: selectedRecord.defaultVehicleLabel },
                  { label: "微信", value: selectedRecord.wechatId || "未录入" },
                  { label: "LINE", value: selectedRecord.lineId || "未录入" },
                ]}
                columnsClassName="md:grid-cols-2"
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">状态切换</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <form key={option.value} action={updateDriverStatus}>
                      <input type="hidden" name="driverId" value={selectedRecord.id} />
                      <input type="hidden" name="status" value={option.value} />
                      <button disabled={!canWriteDrivers || selectedRecord.status === option.value} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                        {option.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>

              <DriverForm
                action={updateDriverBasics}
                driver={selectedRecord}
                vehicleOptions={vehicleOptions}
                canWrite={canWriteDrivers}
                submitLabel="保存司机资料"
              />

              <IncidentPanel driver={selectedRecord} orderOptions={orderOptions} canWrite={canWriteDrivers} />
            </div>
          ) : (
            <EmptyStateCard title="还没有选中司机" description="从左侧选择一位司机查看与维护档案。" />
          )}
        </div>
      </SectionCard>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="新建司机档案"
        description="录入司机联系方式、自定义颜色、月出勤天数和常用默认车辆。"
        eyebrow="Create Driver"
        maxWidthClassName="max-w-5xl"
      >
        <DriverForm action={createDriver} vehicleOptions={vehicleOptions} canWrite={canWriteDrivers} submitLabel="保存司机" />
      </Dialog>
    </section>
  );
}

function DriverForm({
  action,
  driver,
  vehicleOptions,
  canWrite,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  driver?: DriverOperationsRecord;
  vehicleOptions: OrderCreateOption[];
  canWrite: boolean;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      {driver ? <input type="hidden" name="driverId" value={driver.id} /> : null}
      <input type="hidden" name="status" value={driver?.status ?? "available"} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="姓名"><input name="fullName" defaultValue={driver?.fullName} disabled={!canWrite} className={inputClassName} /></Field>
        <Field label="语言能力"><input name="languages" defaultValue={driver?.languageLabel} placeholder="日语 / 中文 / 英语" disabled={!canWrite} className={inputClassName} /></Field>
        <Field label="合同类型">
          <select name="contractType" defaultValue={driver?.contractType ?? "full_time"} disabled={!canWrite} className={inputClassName}>
            <option value="full_time">全职</option><option value="part_time">兼职</option><option value="partner">合作</option>
          </select>
        </Field>
        <Field label="联系电话"><input name="phone" defaultValue={driver?.phone} disabled={!canWrite} className={inputClassName} /></Field>
        <Field label="微信"><input name="wechatId" defaultValue={driver?.wechatId} placeholder="微信号" disabled={!canWrite} className={inputClassName} /></Field>
        <Field label="LINE"><input name="lineId" defaultValue={driver?.lineId} placeholder="LINE ID" disabled={!canWrite} className={inputClassName} /></Field>
        <Field label="月出勤天数"><input type="number" min="0" step="1" name="attendanceDaysMonthly" defaultValue={driver?.attendanceDaysMonthly ?? 0} disabled={!canWrite} className={inputClassName} /></Field>
        <Field label="司机识别颜色"><input type="color" name="displayColor" defaultValue={driver?.displayColor ?? "#0f766e"} disabled={!canWrite} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2" /></Field>
        <Field label="默认车辆">
          <select name="defaultVehicleId" defaultValue={driver?.defaultVehicleId ?? ""} disabled={!canWrite} className={inputClassName}>
            <option value="">暂不绑定</option>
            {vehicleOptions.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label} · {vehicle.hint}</option>)}
          </select>
        </Field>
      </div>
      <Field label="备注"><textarea name="notes" rows={3} defaultValue={driver?.notes} disabled={!canWrite} className={textareaClassName} /></Field>
      <div className="flex justify-end">
        <PendingSubmitButton disabled={!canWrite} pendingLabel="保存中..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white disabled:bg-slate-300">
          {submitLabel}
        </PendingSubmitButton>
      </div>
    </form>
  );
}

function IncidentPanel({ driver, orderOptions, canWrite }: { driver: DriverOperationsRecord; orderOptions: DriverDispatchCandidate[]; canWrite: boolean }) {
  return (
    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
      <div>
        <p className="text-sm font-medium text-amber-950">司机事故安全记录</p>
        <p className="mt-1 text-sm text-amber-900/70">不使用评分，仅记录真实发生的事故、关联订单与后续处理状态。</p>
      </div>
      <form action={recordDriverIncident} className="grid gap-3 md:grid-cols-2">
        <input type="hidden" name="driverId" value={driver.id} />
        <Field label="事故日期"><input type="date" name="occurredOn" disabled={!canWrite} className={inputClassName} /></Field>
        <Field label="严重程度">
          <select name="severity" defaultValue="minor" disabled={!canWrite} className={inputClassName}>
            <option value="minor">轻微</option><option value="major">较严重</option><option value="critical">重大</option>
          </select>
        </Field>
        <Field label="关联订单">
          <select name="orderId" defaultValue="" disabled={!canWrite} className={inputClassName}>
            <option value="">不关联订单</option>
            {orderOptions.map((order) => <option key={order.orderId} value={order.orderId}>{order.serviceDateLabel} · {order.orderNo} · {order.routeTitle}</option>)}
          </select>
        </Field>
        <Field label="事故标题"><input name="title" placeholder="例如：停车场倒车擦碰" disabled={!canWrite} className={inputClassName} /></Field>
        <div className="md:col-span-2"><Field label="事故经过与处理"><textarea name="description" rows={3} disabled={!canWrite} className={textareaClassName} /></Field></div>
        <div className="flex justify-end md:col-span-2">
          <PendingSubmitButton disabled={!canWrite} pendingLabel="记录中..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-950 px-5 text-sm font-medium text-white disabled:bg-slate-300">记录事故</PendingSubmitButton>
        </div>
      </form>
      <div className="space-y-2">
        {driver.incidentLogs.length ? driver.incidentLogs.map((incident) => (
          <div key={incident.id} className="rounded-2xl border border-amber-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={incident.severityLabel} tone={incident.severity === "critical" || incident.severity === "major" ? "warning" : "neutral"} />
              <Badge label={incident.statusLabel} tone="info" />
              <span className="text-xs text-slate-500">{incident.dateLabel} · {incident.orderNo}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-950">{incident.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{incident.description}</p>
          </div>
        )) : <EmptyStateCard title="暂无事故记录" description="没有事故记录时无需填写，发生后再如实记录。" />}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function resolveDriverTone(status: string) {
  if (status === "available") return "success" as const;
  if (status === "assigned") return "info" as const;
  if (status === "off_duty") return "warning" as const;
  return "neutral" as const;
}

const inputClassName = "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60";
const textareaClassName = "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60";
