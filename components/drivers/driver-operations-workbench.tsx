"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { createDriver, deleteDriver, recordDriverSafetyScore, updateDriverBasics, updateDriverStatus } from "@/app/(dashboard)/drivers/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmActionButton } from "@/components/ui/confirm-action-button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { FormSection } from "@/components/ui/form-section";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { SectionCard } from "@/components/ui/section-card";
import { SlideOver } from "@/components/ui/slide-over";
import { StatStrip } from "@/components/ui/stat-strip";
import type { DriverOperationsRecord } from "@/lib/loaders/admin";

type DriverOperationsWorkbenchProps = {
  records: DriverOperationsRecord[];
  canWriteDrivers: boolean;
  initialQuery?: string;
};

const filterItems = ["全部", "可派单", "已排班", "休假中", "停用", "全职", "兼职", "合作"];
const statusOptions = [
  { value: "available", label: "可派单" },
  { value: "assigned", label: "已排班" },
  { value: "off_duty", label: "休假中" },
  { value: "inactive", label: "停用" },
];

export function DriverOperationsWorkbench({ records, canWriteDrivers, initialQuery }: DriverOperationsWorkbenchProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [activeFilter, setActiveFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const haystack = [record.fullName, record.languageLabel, record.contractLabel, record.statusLabel].join(" ").toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      const matchesFilter =
        activeFilter === "全部" || record.statusLabel === activeFilter || record.contractLabel === activeFilter;
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
    name: record.fullName,
    language: record.languageLabel,
    contract: record.contractLabel,
    dutyHours: record.dutyHoursLabel,
    safetyScore: record.safetyScoreLabel,
    status: record.statusLabel,
  }));

  const createDriverForm = (
    <form action={createDriver} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(248,250,252,0.92))] px-4 py-4">
        <StatStrip
          items={[
            { label: "资源目标", value: "订单派司机资源池", accent: "text-cyan-700" },
            { label: "关键维度", value: "语言 / 工时 / 安全评分", accent: "text-cyan-700" },
            { label: "后续影响", value: "排班公平性 / 风险控制", accent: "text-cyan-700" },
          ]}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <FormSection title="司机主体信息" description="先把姓名、语言、合同类型和联系方式录完整，作为排班和客户沟通的基础资料。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="姓名">
              <input name="fullName" placeholder="田中宏" disabled={!canWriteDrivers} className={inputClassName} />
            </Field>
            <Field label="语言能力">
              <input name="languages" placeholder="日语 / 中文 / 英语" disabled={!canWriteDrivers} className={inputClassName} />
            </Field>
            <Field label="合同类型">
              <select name="contractType" defaultValue="full_time" disabled={!canWriteDrivers} className={inputClassName}>
                <option value="full_time">全职</option>
                <option value="part_time">兼职</option>
                <option value="partner">合作</option>
              </select>
            </Field>
            <Field label="联系电话">
              <input name="phone" placeholder="090-xxxx-xxxx" disabled={!canWriteDrivers} className={inputClassName} />
            </Field>
          </div>
        </FormSection>
        <FormSection title="排班参考信息" description="工时、安全评分、当前状态和备注会一起影响后续司机排班与风险判断。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="月工时">
              <input type="number" min="0" name="dutyHoursMonthly" placeholder="128" disabled={!canWriteDrivers} className={inputClassName} />
            </Field>
            <Field label="当前安全评分">
              <input type="number" min="0" max="100" step="0.1" name="safetyScore" placeholder="96" disabled={!canWriteDrivers} className={inputClassName} />
            </Field>
            <Field label="当前状态">
              <select name="status" defaultValue="available" disabled={!canWriteDrivers} className={inputClassName}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="备注">
              <textarea name="notes" rows={4} disabled={!canWriteDrivers} placeholder="记录证照、熟悉线路或客户服务特点" className={textareaClassName} />
            </Field>
          </div>
        </FormSection>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {canWriteDrivers ? "新增后司机会进入司机台账，也会进入订单排司机的数据参考。" : "当前账号只能查看司机资料。"}
        </p>
        <PendingSubmitButton disabled={!canWriteDrivers} pendingLabel="正在保存司机..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          保存司机
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
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">新增司机入口</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">把司机建档收进弹层后，资源页第一屏可以更专注于排班、公平性和安全记录维护。</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canWriteDrivers}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建司机
          </button>
        </div>
      </div>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="司机建档工作台"
        description="在弹层里录入司机主数据，不打断当前司机工作台的排班与风险视角。"
        eyebrow="Create Driver"
        maxWidthClassName="max-w-5xl"
      >
        {createDriverForm}
      </Dialog>

      <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="司机真实工作台" description="在这里直接维护司机资料、状态、安全评分和删除操作。">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索司机姓名、语言、合同类型"
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
              <span>当前结果 {filteredRecords.length} 位</span>
              <span>{canWriteDrivers ? "选中后可更新状态、工时、安全评分和基础资料" : "当前角色仅可查看司机详情"}</span>
            </div>

            {selectedRecord ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">当前选中：{selectedRecord.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">这里就是司机工作台的主操作区，支持直接维护或删除当前司机。</p>
                </div>
                <form id={`delete-driver-inline-${selectedRecord.id}`} action={deleteDriver}>
                  <input type="hidden" name="driverId" value={selectedRecord.id} />
                  <ConfirmActionButton
                    formId={`delete-driver-inline-${selectedRecord.id}`}
                    title="确认删除当前司机？"
                    description="删除后该司机会从司机台账中移除，已有订单里的司机分配会自动清空。"
                    confirmLabel="确认删除"
                    tone="danger"
                    disabled={!canWriteDrivers}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-300 bg-white px-5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-100 disabled:text-rose-300"
                  >
                    删除当前司机
                  </ConfirmActionButton>
                </form>
              </div>
            ) : null}

            <DataTable
              columns={["姓名", "语言", "合同", "工时", "安全评分", "状态"]}
              rows={tableRows}
              selectedRowIndex={selectedRowIndex}
              onRowClick={(_, rowIndex) => setSelectedId(filteredRecords[rowIndex]?.id ?? null)}
              emptyMessage="当前筛选下没有司机。"
            />
          </div>
        </SectionCard>

        <SectionCard title="司机详情与安全评分记录" description="除了维护主数据，还可以把安全评分变化和说明沉淀成可回看的记录。">
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Driver</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.fullName}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge label={selectedRecord.statusLabel} tone={resolveDriverTone(selectedRecord.status)} />
                      <span className="text-xs text-slate-500">{selectedRecord.languageLabel}</span>
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
                    <form id={`delete-driver-badge-${selectedRecord.id}`} action={deleteDriver}>
                      <input type="hidden" name="driverId" value={selectedRecord.id} />
                      <ConfirmActionButton
                        formId={`delete-driver-badge-${selectedRecord.id}`}
                        title="确认删除这位司机？"
                        description="删除后司机会从当前台账中移除，订单里的司机引用也会被清空。"
                        confirmLabel="确认删除"
                        tone="danger"
                        disabled={!canWriteDrivers}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-rose-300 bg-white px-4 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-100 disabled:text-rose-300"
                      >
                        删除
                      </ConfirmActionButton>
                    </form>
                  </div>
                </div>
              </div>

              <StatStrip
                items={[
                  { label: "合同", value: selectedRecord.contractLabel },
                  { label: "电话", value: selectedRecord.phone || "未设置" },
                  { label: "月工时", value: selectedRecord.dutyHoursLabel },
                  { label: "安全评分", value: selectedRecord.safetyScoreLabel },
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
                      <button
                        disabled={!canWriteDrivers || selectedRecord.status === option.value}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {option.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>

              <form action={updateDriverBasics} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <input type="hidden" name="driverId" value={selectedRecord.id} />
                <Field label="姓名">
                  <input name="fullName" defaultValue={selectedRecord.fullName} disabled={!canWriteDrivers} className={inputClassName} />
                </Field>
                <Field label="语言能力">
                  <input name="languages" defaultValue={selectedRecord.languageLabel} disabled={!canWriteDrivers} className={inputClassName} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="合同类型">
                    <select name="contractType" defaultValue={selectedRecord.contractType} disabled={!canWriteDrivers} className={inputClassName}>
                      <option value="full_time">全职</option>
                      <option value="part_time">兼职</option>
                      <option value="partner">合作</option>
                    </select>
                  </Field>
                  <Field label="联系电话">
                    <input name="phone" defaultValue={selectedRecord.phone} disabled={!canWriteDrivers} className={inputClassName} />
                  </Field>
                  <Field label="月工时">
                    <input type="number" min="0" name="dutyHoursMonthly" defaultValue={selectedRecord.dutyHoursMonthly} disabled={!canWriteDrivers} className={inputClassName} />
                  </Field>
                  <Field label="当前安全评分">
                    <input type="number" min="0" max="100" step="0.1" name="safetyScore" defaultValue={selectedRecord.safetyScore} disabled={!canWriteDrivers} className={inputClassName} />
                  </Field>
                </div>
                <input type="hidden" name="status" value={selectedRecord.status} />
                <Field label="备注">
                  <textarea name="notes" rows={4} defaultValue={selectedRecord.notes} disabled={!canWriteDrivers} className={textareaClassName} />
                </Field>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {canWriteDrivers ? "保存后会同步影响司机台账、排班视图和订单指派参考。" : "当前账号只有查看权限。"}
                  </p>
                  <PendingSubmitButton disabled={!canWriteDrivers} pendingLabel="正在保存司机资料..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                    保存司机资料
                  </PendingSubmitButton>
                </div>
              </form>

              <form action={recordDriverSafetyScore} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <input type="hidden" name="driverId" value={selectedRecord.id} />
                <div>
                  <p className="text-sm font-medium text-slate-900">安全评分记录</p>
                  <p className="mt-1 text-sm text-slate-500">每次调整评分时留下文字说明，后续排班时能回看安全表现和处理依据。</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="新评分">
                    <input type="number" min="0" max="100" step="0.1" name="score" defaultValue={selectedRecord.safetyScore} disabled={!canWriteDrivers} className={inputClassName} />
                  </Field>
                  <Field label="记录说明">
                    <input name="note" placeholder="例如：本周无事故，客户反馈稳定" disabled={!canWriteDrivers} className={inputClassName} />
                  </Field>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">{canWriteDrivers ? "提交后会更新当前安全评分，并追加一条评分记录。" : "当前账号只有查看权限。"}</p>
                  <PendingSubmitButton disabled={!canWriteDrivers} pendingLabel="正在记录评分..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                    记录评分
                  </PendingSubmitButton>
                </div>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">评分记录明细</p>
                    <p className="mt-1 text-sm text-slate-500">这里保留安全评分调整记录，后续排班时可以作为公平分配与风险控制参考。</p>
                  </div>
                  <Badge label={`${selectedRecord.safetyLogs.length} 条`} tone="info" />
                </div>
                <div className="mt-4 space-y-3">
                  {selectedRecord.safetyLogs.length ? (
                    selectedRecord.safetyLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-900">{log.dateLabel}</p>
                          <Badge label={`评分 ${log.score}`} tone="info" />
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{log.note}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyStateCard title="还没有评分记录" description="后续每次调整安全评分，这里都会保留原因和分数，方便排班时回看。" />
                  )}
                </div>
              </div>

              <form id={`delete-driver-panel-${selectedRecord.id}`} action={deleteDriver} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <input type="hidden" name="driverId" value={selectedRecord.id} />
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-rose-900">删除司机</p>
                    <p className="mt-1 text-sm text-rose-700">
                      删除后该司机会从司机台账中移除，已有订单里的司机分配会自动清空。
                    </p>
                  </div>
                  <ConfirmActionButton
                    formId={`delete-driver-panel-${selectedRecord.id}`}
                    title="确认删除这位司机？"
                    description="删除后该司机会从司机台账中移除，已有订单里的司机分配会自动清空。"
                    confirmLabel="确认删除"
                    tone="danger"
                    disabled={!canWriteDrivers}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-300 bg-white px-5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-100 disabled:text-rose-300"
                  >
                    删除这位司机
                  </ConfirmActionButton>
                </div>
              </form>
            </div>
          ) : (
            <EmptyStateCard title="还没有选中司机" description="从左侧司机列表里点选一位司机，右侧就会展开资料、安全评分和删除等维护动作。" />
          )}
        </SectionCard>
      </section>

      <SlideOver
        open={detailDrawerOpen && !!selectedRecord}
        onClose={() => setDetailDrawerOpen(false)}
        title={selectedRecord?.fullName ?? "司机详情"}
        description="把司机状态、工时、安全评分和最近评分记录集中到一个抽屉里，方便排班前快速判断。"
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Driver Brief</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.fullName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={selectedRecord.statusLabel} tone={resolveDriverTone(selectedRecord.status)} />
                <span className="text-xs text-slate-500">{selectedRecord.languageLabel}</span>
              </div>
            </div>

            <StatStrip
              items={[
                { label: "合同", value: selectedRecord.contractLabel },
                { label: "电话", value: selectedRecord.phone || "未设置" },
                { label: "月工时", value: selectedRecord.dutyHoursLabel },
                { label: "安全评分", value: selectedRecord.safetyScoreLabel },
              ]}
              columnsClassName="md:grid-cols-2"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">排班风险判断</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {selectedRecord.status === "off_duty"
                  ? "司机当前处于休假或休息状态，建议暂时不要安排新的线路。"
                  : selectedRecord.status === "assigned"
                    ? "司机当前已有排班，安排新线路前建议先检查当天工作负载。"
                    : selectedRecord.status === "inactive"
                      ? "司机当前已停用，恢复前不会进入常规派单池。"
                      : "司机当前可派单，可结合工时和安全评分决定优先级。"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">最近评分记录</p>
                <Badge label={`${selectedRecord.safetyLogs.length} 条`} tone="info" />
              </div>
              <div className="mt-3 space-y-3">
                {selectedRecord.safetyLogs.length ? (
                  selectedRecord.safetyLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">{log.dateLabel}</p>
                        <Badge label={`评分 ${log.score}`} tone="info" />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{log.note}</p>
                    </div>
                  ))
                ) : (
                  <EmptyStateCard title="还没有评分记录" description="后续安全评分变化会优先显示在这里，方便排班前快速确认。" />
                )}
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

function resolveDriverTone(status: string) {
  if (status === "available") return "success" as const;
  if (status === "assigned") return "info" as const;
  if (status === "off_duty") return "warning" as const;
  return "neutral" as const;
}

const inputClassName =
  "h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";
