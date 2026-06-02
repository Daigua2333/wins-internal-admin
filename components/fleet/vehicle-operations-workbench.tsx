"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { createVehicle, deleteVehicle, updateVehicleBasics, updateVehicleStatus } from "@/app/(dashboard)/fleet/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { Dialog } from "@/components/ui/dialog";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { SlideOver } from "@/components/ui/slide-over";
import { StatStrip } from "@/components/ui/stat-strip";
import type { VehicleOperationsRecord } from "@/lib/loaders/admin";

type VehicleOperationsWorkbenchProps = {
  records: VehicleOperationsRecord[];
  canWriteVehicles: boolean;
};

const filterItems = ["全部", "可调度", "保养中", "已派出", "停用", "自有车辆", "合作车队"];
const statusOptions = [
  { value: "available", label: "可调度" },
  { value: "maintenance", label: "保养中" },
  { value: "assigned", label: "已派出" },
  { value: "inactive", label: "停用" },
];

export function VehicleOperationsWorkbench({ records, canWriteVehicles }: VehicleOperationsWorkbenchProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const haystack = [
        record.plateNumber,
        record.label,
        record.vehicleType,
        record.ownerTypeLabel,
        record.statusLabel,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      const matchesFilter =
        activeFilter === "全部" || record.statusLabel === activeFilter || record.ownerTypeLabel === activeFilter;

      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, query, records]);

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !filteredRecords.some((record) => record.id === selectedId)) {
      setSelectedId(filteredRecords[0].id);
    }
  }, [filteredRecords, selectedId]);

  const selectedRecord = useMemo(
    () => filteredRecords.find((record) => record.id === selectedId) ?? filteredRecords[0] ?? null,
    [filteredRecords, selectedId],
  );
  const selectedRowIndex = selectedRecord ? filteredRecords.findIndex((record) => record.id === selectedRecord.id) : undefined;

  useEffect(() => {
    if (!selectedRecord) {
      setDetailDrawerOpen(false);
    }
  }, [selectedRecord]);

  const tableRows = filteredRecords.map((record) => ({
    plateNumber: record.plateNumber,
    label: record.label,
    vehicleType: record.vehicleType,
    seats: record.seatLabel,
    inspection: record.inspectionDueOn || "未设置",
    status: record.statusLabel,
  }));

  const createVehicleForm = (
    <form action={createVehicle} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(248,250,252,0.92))] px-4 py-4">
        <StatStrip
          items={[
            { label: "资源目标", value: "订单排车资源池", accent: "text-cyan-700" },
            { label: "核心字段", value: "车牌 / 车型 / 状态", accent: "text-cyan-700" },
            { label: "后续影响", value: "排车选择 / 点检提醒", accent: "text-cyan-700" },
          ]}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <FormSection title="车辆主体信息" description="先把能决定排车的主数据录完整，包括车牌、车辆名称、车型和座位数。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="车牌">
              <input name="plateNumber" placeholder="品川300 あ 88-21" disabled={!canWriteVehicles} className={inputClassName} />
            </Field>
            <Field label="车辆名称">
              <input name="label" placeholder="东京中巴 1号车" disabled={!canWriteVehicles} className={inputClassName} />
            </Field>
            <Field label="车型">
              <input name="vehicleType" placeholder="中型巴士 / 商务车" disabled={!canWriteVehicles} className={inputClassName} />
            </Field>
            <Field label="座位数">
              <input type="number" min="1" name="seatCapacity" placeholder="28" disabled={!canWriteVehicles} className={inputClassName} />
            </Field>
          </div>
        </FormSection>
        <FormSection title="运营状态与补充说明" description="把归属、当前状态、点检时间和备注一起录好，方便调度和点检提醒直接复用。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="归属">
              <select name="ownerType" defaultValue="owned" disabled={!canWriteVehicles} className={inputClassName}>
                <option value="owned">自有车辆</option>
                <option value="partner">合作车队</option>
              </select>
            </Field>
            <Field label="当前状态">
              <select name="status" defaultValue="available" disabled={!canWriteVehicles} className={inputClassName}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="点检到期日">
              <input type="date" name="inspectionDueOn" disabled={!canWriteVehicles} className={inputClassName} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="备注">
              <textarea name="notes" rows={4} disabled={!canWriteVehicles} placeholder="记录保养周期、合作车队要求或车辆特点" className={textareaClassName} />
            </Field>
          </div>
        </FormSection>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {canWriteVehicles ? "新增后车辆会立即进入车辆管理与订单排车可选项。" : "当前账号只能查看车辆资源，不能新增或编辑。"}
        </p>
        <PendingSubmitButton disabled={!canWriteVehicles} pendingLabel="正在保存车辆..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          保存车辆
        </PendingSubmitButton>
      </div>
    </form>
  );

  return (
    <section className="space-y-4">
      <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">Quick Create</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">新增车辆入口</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">把新增车辆也收进弹层后，车辆工作台第一屏可以更专注于筛选、排查和维护现有资源。</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canWriteVehicles}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建车辆
          </button>
        </div>
      </div>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="车辆创建工作台"
        description="在弹层里录入排车资源主数据，不打断当前车辆筛选和维护视角。"
        eyebrow="Create Vehicle"
        maxWidthClassName="max-w-5xl"
      >
        {createVehicleForm}
      </Dialog>

      <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="车辆工作台"
          description="搜索车牌和车型，选中后右侧可以直接更新状态、点检日期和车辆基础资料。"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索车牌、车辆名称、车型"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {filterItems.map((filter) => (
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
              <span>当前结果 {filteredRecords.length} 台</span>
              <span>{canWriteVehicles ? "选中后可直接更新车辆状态与资料" : "当前角色仅可查看车辆详情"}</span>
            </div>

            {selectedRecord ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">当前选中：{selectedRecord.plateNumber}</p>
                  <p className="mt-1 text-sm text-slate-500">这里就是车辆工作台的主操作区，支持直接维护或删除当前车辆。</p>
                </div>
                <form id={`delete-vehicle-inline-${selectedRecord.id}`} action={deleteVehicle}>
                  <input type="hidden" name="vehicleId" value={selectedRecord.id} />
                  <ConfirmActionButton
                    formId={`delete-vehicle-inline-${selectedRecord.id}`}
                    title="确认删除当前车辆？"
                    description="删除后这台车会从车辆台账中移除，已有订单里的车辆引用也会被清空。"
                    confirmLabel="确认删除"
                    tone="danger"
                    disabled={!canWriteVehicles}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-300 bg-white px-5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-100 disabled:text-rose-300"
                  >
                    删除当前车辆
                  </ConfirmActionButton>
                </form>
              </div>
            ) : null}

            <DataTable
              columns={["车牌", "车辆名称", "车型", "座位", "点检日期", "状态"]}
              rows={tableRows}
              selectedRowIndex={selectedRowIndex}
              onRowClick={(_, rowIndex) => setSelectedId(filteredRecords[rowIndex]?.id ?? null)}
              emptyMessage="当前筛选下没有车辆。"
            />
          </div>
        </SectionCard>

        <SectionCard title="车辆详情与维护" description="把状态切换、点检日期和备注都收在一侧，方便运营和调度快速处理。">
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Vehicle</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.plateNumber}</p>
                    <p className="mt-1 text-sm text-slate-600">{selectedRecord.label}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge label={selectedRecord.statusLabel} tone={resolveVehicleTone(selectedRecord.status)} />
                      <span className="text-xs text-slate-500">{selectedRecord.ownerTypeLabel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailDrawerOpen(true)}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
                    >
                      打开侧边详情
                    </button>
                    <form action={deleteVehicle}>
                      <input type="hidden" name="vehicleId" value={selectedRecord.id} />
                      <button
                        type="submit"
                        disabled={!canWriteVehicles}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-rose-300 bg-white px-4 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-100 disabled:text-rose-300"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              <StatStrip
                items={[
                  { label: "车型", value: selectedRecord.vehicleType },
                  { label: "座位数", value: selectedRecord.seatLabel },
                  { label: "归属", value: selectedRecord.ownerTypeLabel },
                  { label: "点检到期", value: selectedRecord.inspectionDueOn || "未设置" },
                ]}
                columnsClassName="md:grid-cols-2"
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">状态切换</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <form key={option.value} action={updateVehicleStatus}>
                      <input type="hidden" name="vehicleId" value={selectedRecord.id} />
                      <input type="hidden" name="status" value={option.value} />
                      <button
                        disabled={!canWriteVehicles || selectedRecord.status === option.value}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {option.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>

              <form action={updateVehicleBasics} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <input type="hidden" name="vehicleId" value={selectedRecord.id} />
                <Field label="车牌">
                  <input name="plateNumber" defaultValue={selectedRecord.plateNumber} disabled={!canWriteVehicles} className={inputClassName} />
                </Field>
                <Field label="车辆名称">
                  <input name="label" defaultValue={selectedRecord.label} disabled={!canWriteVehicles} className={inputClassName} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="车型">
                    <input name="vehicleType" defaultValue={selectedRecord.vehicleType} disabled={!canWriteVehicles} className={inputClassName} />
                  </Field>
                  <Field label="座位数">
                    <input type="number" min="1" name="seatCapacity" defaultValue={selectedRecord.seatCapacity} disabled={!canWriteVehicles} className={inputClassName} />
                  </Field>
                  <Field label="归属">
                    <select name="ownerType" defaultValue={selectedRecord.ownerType} disabled={!canWriteVehicles} className={inputClassName}>
                      <option value="owned">自有车辆</option>
                      <option value="partner">合作车队</option>
                    </select>
                  </Field>
                  <Field label="点检到期日">
                    <input type="date" name="inspectionDueOn" defaultValue={selectedRecord.inspectionDueOn} disabled={!canWriteVehicles} className={inputClassName} />
                  </Field>
                </div>
                <Field label="备注">
                  <textarea name="notes" rows={4} defaultValue={selectedRecord.notes} disabled={!canWriteVehicles} className={textareaClassName} />
                </Field>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {canWriteVehicles ? "保存后会同步影响订单排车可选资源和车辆状态视图。" : "当前账号只有查看权限。"}
                  </p>
                  <PendingSubmitButton disabled={!canWriteVehicles} pendingLabel="正在保存车辆资料..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                    保存车辆资料
                  </PendingSubmitButton>
                </div>
              </form>

              <form id={`delete-vehicle-panel-${selectedRecord.id}`} action={deleteVehicle} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <input type="hidden" name="vehicleId" value={selectedRecord.id} />
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-rose-900">删除车辆</p>
                    <p className="mt-1 text-sm text-rose-700">
                      删除后该车辆会从车辆台账中移除，已有订单里的车辆引用会自动清空。
                    </p>
                  </div>
                  <ConfirmActionButton
                    formId={`delete-vehicle-panel-${selectedRecord.id}`}
                    title="确认删除这台车辆？"
                    description="删除后该车辆会从车辆台账中移除，已有订单里的车辆引用会自动清空。"
                    confirmLabel="确认删除"
                    tone="danger"
                    disabled={!canWriteVehicles}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-300 bg-white px-5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-100 disabled:text-rose-300"
                  >
                    删除这台车辆
                  </ConfirmActionButton>
                </div>
              </form>
            </div>
          ) : (
            <EmptyStateCard title="还没有选中车辆" description="从左侧车辆列表里点选一台车，右侧就会展开状态、点检日期和删除等维护动作。" />
          )}
        </SectionCard>
      </section>

      <SlideOver
        open={detailDrawerOpen && !!selectedRecord}
        onClose={() => setDetailDrawerOpen(false)}
        title={selectedRecord?.plateNumber ?? "车辆详情"}
        description="把车辆状态、点检信息和维护说明放进一个抽屉里，方便调度和运营快速查看。"
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Vehicle Brief</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.plateNumber}</p>
              <p className="mt-1 text-sm text-slate-600">{selectedRecord.label}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={selectedRecord.statusLabel} tone={resolveVehicleTone(selectedRecord.status)} />
                <span className="text-xs text-slate-500">{selectedRecord.ownerTypeLabel}</span>
              </div>
            </div>

            <StatStrip
              items={[
                { label: "车型", value: selectedRecord.vehicleType },
                { label: "座位数", value: selectedRecord.seatLabel },
                { label: "归属", value: selectedRecord.ownerTypeLabel },
                { label: "点检到期", value: selectedRecord.inspectionDueOn || "未设置" },
              ]}
              columnsClassName="md:grid-cols-2"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">维护说明</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{selectedRecord.notes || "当前没有补充说明。"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">当前可用性</p>
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">{selectedRecord.statusLabel}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {selectedRecord.status === "maintenance"
                      ? "这台车当前处于保养或点检阶段，建议暂时不要安排到新订单。"
                      : selectedRecord.status === "assigned"
                        ? "这台车当前已派出，安排新订单前请先确认现有执行计划。"
                        : selectedRecord.status === "inactive"
                          ? "这台车当前已停用，恢复前不会参与常规调度。"
                          : "这台车当前可调度，排车时会进入车辆资源池。"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SlideOver>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function resolveVehicleTone(status: string) {
  if (status === "available") return "success" as const;
  if (status === "maintenance") return "warning" as const;
  if (status === "assigned") return "info" as const;
  return "neutral" as const;
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";
