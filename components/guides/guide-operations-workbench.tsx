"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { createGuide, deleteGuide, recordGuideServiceLog, updateGuideBasics, updateGuideStatus } from "@/app/(dashboard)/guides/actions";
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
import type { GuideOperationsRecord } from "@/lib/loaders/admin";

type GuideOperationsWorkbenchProps = {
  records: GuideOperationsRecord[];
  canWriteGuides: boolean;
};

const filterItems = ["全部", "待命中", "已排班", "休息中", "停用", "中文服务", "高端定制"];
const statusOptions = [
  { value: "available", label: "待命中" },
  { value: "assigned", label: "已排班" },
  { value: "off_duty", label: "休息中" },
  { value: "inactive", label: "停用" },
];

export function GuideOperationsWorkbench({ records, canWriteGuides }: GuideOperationsWorkbenchProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("全部");
  const [selectedId, setSelectedId] = useState<string | null>(records[0]?.id ?? null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const haystack = [record.fullName, record.languageLabel, record.specialtyLabel, record.statusLabel, record.licenseType].join(" ").toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      const matchesFilter =
        activeFilter === "全部" ||
        record.statusLabel === activeFilter ||
        (activeFilter === "中文服务" && record.languageLabel.includes("中文")) ||
        (activeFilter === "高端定制" && record.specialtyLabel.includes("高端定制"));
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
    specialty: record.specialtyLabel,
    language: record.languageLabel,
    license: record.licenseType || "未设置",
    rating: record.ratingLabel,
    status: record.statusLabel,
  }));

  const createGuideForm = (
    <form action={createGuide} className="grid gap-4">
      <div className="rounded-[1.5rem] border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,0.95),rgba(248,250,252,0.92))] px-4 py-4">
        <StatStrip
          items={[
            { label: "服务目标", value: "高质量导览资源池", accent: "text-cyan-700" },
            { label: "关键维度", value: "语言 / 专长 / 评分", accent: "text-cyan-700" },
            { label: "后续影响", value: "排班质量 / 客诉风险", accent: "text-cyan-700" },
          ]}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <FormSection title="导游主体信息" description="先把姓名、服务语言、专长和资质录完整，作为排班和客户匹配的核心资料。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="姓名">
              <input name="fullName" placeholder="佐藤美纪" disabled={!canWriteGuides} className={inputClassName} />
            </Field>
            <Field label="语言能力">
              <input name="languages" placeholder="中文 / 日语 / 英语" disabled={!canWriteGuides} className={inputClassName} />
            </Field>
            <Field label="专长">
              <input name="specialties" placeholder="机场接送 / 企业团 / 高端定制" disabled={!canWriteGuides} className={inputClassName} />
            </Field>
            <Field label="资质">
              <input name="licenseType" placeholder="全国通译案内士" disabled={!canWriteGuides} className={inputClassName} />
            </Field>
          </div>
        </FormSection>
        <FormSection title="服务表现与补充说明" description="评分、当前状态和备注会一起影响后续的导游调度和服务质量判断。">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="评分">
              <input type="number" min="0" max="5" step="0.1" name="rating" placeholder="4.8" disabled={!canWriteGuides} className={inputClassName} />
            </Field>
            <Field label="当前状态">
              <select name="status" defaultValue="available" disabled={!canWriteGuides} className={inputClassName}>
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
              <textarea name="notes" rows={4} disabled={!canWriteGuides} placeholder="记录擅长景点、客户偏好或资质补充" className={textareaClassName} />
            </Field>
          </div>
        </FormSection>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {canWriteGuides ? "新增后导游会进入导游台账，也会进入订单排导游的数据参考。" : "当前账号只能查看导游资料。"}
        </p>
        <PendingSubmitButton disabled={!canWriteGuides} pendingLabel="正在保存导游..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
          保存导游
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
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">新增导游入口</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">把导游建档收进弹层后，资源页第一屏可以更专注于排班、服务表现和客户匹配判断。</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            disabled={!canWriteGuides}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建导游
          </button>
        </div>
      </div>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="导游建档工作台"
        description="在弹层里录入导游主数据，不打断当前导游工作台的排班与服务质量视角。"
        eyebrow="Create Guide"
        maxWidthClassName="max-w-5xl"
      >
        {createGuideForm}
      </Dialog>

      <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="导游真实工作台" description="在这里直接维护导游资料、状态、服务记录和删除操作。">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索导游姓名、服务语言、专长领域"
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
              <span>{canWriteGuides ? "选中后可更新状态、专长、资质和服务记录" : "当前角色仅可查看导游详情"}</span>
            </div>

            {selectedRecord ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">当前选中：{selectedRecord.fullName}</p>
                  <p className="mt-1 text-sm text-slate-500">这里就是导游工作台的主操作区，支持直接维护或删除当前导游。</p>
                </div>
                <form id={`delete-guide-inline-${selectedRecord.id}`} action={deleteGuide}>
                  <input type="hidden" name="guideId" value={selectedRecord.id} />
                  <ConfirmActionButton
                    formId={`delete-guide-inline-${selectedRecord.id}`}
                    title="确认删除当前导游？"
                    description="删除后该导游会从台账中移除，已有订单里的导游分配会自动清空。"
                    confirmLabel="确认删除"
                    tone="danger"
                    disabled={!canWriteGuides}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-300 bg-white px-5 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-100 disabled:text-rose-300"
                  >
                    删除当前导游
                  </ConfirmActionButton>
                </form>
              </div>
            ) : null}

            <DataTable
              columns={["姓名", "专长", "语言", "资质", "评分", "状态"]}
              rows={tableRows}
              selectedRowIndex={selectedRowIndex}
              onRowClick={(_, rowIndex) => setSelectedId(filteredRecords[rowIndex]?.id ?? null)}
              emptyMessage="当前筛选下没有导游。"
            />
          </div>
        </SectionCard>

        <SectionCard title="导游详情与服务记录" description="除了维护主数据，还可以把服务表现和客户反馈沉淀成可回看的记录。">
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Guide</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.fullName}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge label={selectedRecord.statusLabel} tone={resolveGuideTone(selectedRecord.status)} />
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
                    <form id={`delete-guide-badge-${selectedRecord.id}`} action={deleteGuide}>
                      <input type="hidden" name="guideId" value={selectedRecord.id} />
                      <ConfirmActionButton
                        formId={`delete-guide-badge-${selectedRecord.id}`}
                        title="确认删除这位导游？"
                        description="删除后导游会从当前台账中移除，订单里的导游引用也会被清空。"
                        confirmLabel="确认删除"
                        tone="danger"
                        disabled={!canWriteGuides}
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
                  { label: "专长", value: selectedRecord.specialtyLabel },
                  { label: "语言", value: selectedRecord.languageLabel },
                  { label: "资质", value: selectedRecord.licenseType || "未设置" },
                  { label: "评分", value: selectedRecord.ratingLabel },
                ]}
                columnsClassName="md:grid-cols-2"
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">状态切换</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <form key={option.value} action={updateGuideStatus}>
                      <input type="hidden" name="guideId" value={selectedRecord.id} />
                      <input type="hidden" name="status" value={option.value} />
                      <button
                        disabled={!canWriteGuides || selectedRecord.status === option.value}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        {option.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>

              <form action={updateGuideBasics} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <input type="hidden" name="guideId" value={selectedRecord.id} />
                <Field label="姓名">
                  <input name="fullName" defaultValue={selectedRecord.fullName} disabled={!canWriteGuides} className={inputClassName} />
                </Field>
                <Field label="语言能力">
                  <input name="languages" defaultValue={selectedRecord.languageLabel} disabled={!canWriteGuides} className={inputClassName} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="专长">
                    <input name="specialties" defaultValue={selectedRecord.specialtyLabel} disabled={!canWriteGuides} className={inputClassName} />
                  </Field>
                  <Field label="资质">
                    <input name="licenseType" defaultValue={selectedRecord.licenseType} disabled={!canWriteGuides} className={inputClassName} />
                  </Field>
                  <Field label="评分">
                    <input type="number" min="0" max="5" step="0.1" name="rating" defaultValue={selectedRecord.rating} disabled={!canWriteGuides} className={inputClassName} />
                  </Field>
                </div>
                <input type="hidden" name="status" value={selectedRecord.status} />
                <Field label="备注">
                  <textarea name="notes" rows={4} defaultValue={selectedRecord.notes} disabled={!canWriteGuides} className={textareaClassName} />
                </Field>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {canWriteGuides ? "保存后会同步影响导游台账、排班视图和订单指派参考。" : "当前账号只有查看权限。"}
                  </p>
                  <PendingSubmitButton disabled={!canWriteGuides} pendingLabel="正在保存导游资料..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                    保存导游资料
                  </PendingSubmitButton>
                </div>
              </form>

              <form action={recordGuideServiceLog} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                <input type="hidden" name="guideId" value={selectedRecord.id} />
                <div>
                  <p className="text-sm font-medium text-slate-900">服务记录</p>
                  <p className="mt-1 text-sm text-slate-500">每次带团后的服务表现、客户反馈和特殊处理，都可以在这里留痕。</p>
                </div>
                <Field label="记录说明">
                  <input name="note" placeholder="例如：VIP 团客户对讲解节奏和临场应变评价很高" disabled={!canWriteGuides} className={inputClassName} />
                </Field>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">{canWriteGuides ? "提交后会追加一条服务记录。" : "当前账号只有查看权限。"}</p>
                  <PendingSubmitButton disabled={!canWriteGuides} pendingLabel="正在记录服务表现..." className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                    记录服务表现
                  </PendingSubmitButton>
                </div>
              </form>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">服务记录明细</p>
                    <p className="mt-1 text-sm text-slate-500">这里保留导游服务记录，后续安排重点客户或高端团时更容易做判断。</p>
                  </div>
                  <Badge label={`${selectedRecord.serviceLogs.length} 条`} tone="info" />
                </div>
                <div className="mt-4 space-y-3">
                  {selectedRecord.serviceLogs.length ? (
                    selectedRecord.serviceLogs.map((log) => (
                      <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-900">{log.dateLabel}</p>
                        <p className="mt-2 text-sm text-slate-600">{log.note}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyStateCard title="还没有服务记录" description="后续每次带团后的表现和反馈都会沉淀在这里，方便安排重点客户或高端团。" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyStateCard title="还没有选中导游" description="从左侧导游列表里点选一位导游，右侧就会展开资料、服务记录和删除等维护动作。" />
          )}
        </SectionCard>
      </section>

      <SlideOver
        open={detailDrawerOpen && !!selectedRecord}
        onClose={() => setDetailDrawerOpen(false)}
        title={selectedRecord?.fullName ?? "导游详情"}
        description="把导游语言、专长、评分和最近服务记录集中到一个抽屉里，方便安排高要求团队时快速判断。"
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Guide Brief</p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{selectedRecord.fullName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge label={selectedRecord.statusLabel} tone={resolveGuideTone(selectedRecord.status)} />
                <span className="text-xs text-slate-500">{selectedRecord.languageLabel}</span>
              </div>
            </div>

            <StatStrip
              items={[
                { label: "专长", value: selectedRecord.specialtyLabel },
                { label: "语言", value: selectedRecord.languageLabel },
                { label: "资质", value: selectedRecord.licenseType || "未设置" },
                { label: "评分", value: selectedRecord.ratingLabel },
              ]}
              columnsClassName="md:grid-cols-2"
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">服务匹配判断</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {selectedRecord.status === "off_duty"
                  ? "导游当前处于休息或不可派状态，安排新服务前建议先确认可用时间。"
                  : selectedRecord.status === "assigned"
                    ? "导游当前已有排班，安排高强度团前建议先核对同日负载。"
                    : selectedRecord.status === "inactive"
                      ? "导游当前已停用，恢复前不会进入常规分配池。"
                      : "导游当前可待命，可结合专长、语言和评分决定分配优先级。"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">最近服务记录</p>
                <Badge label={`${selectedRecord.serviceLogs.length} 条`} tone="info" />
              </div>
              <div className="mt-3 space-y-3">
                {selectedRecord.serviceLogs.length ? (
                  selectedRecord.serviceLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-900">{log.dateLabel}</p>
                      <p className="mt-2 text-sm text-slate-600">{log.note}</p>
                    </div>
                  ))
                ) : (
                  <EmptyStateCard title="还没有服务记录" description="后续导游服务表现会优先显示在这里，方便快速筛选合适人选。" />
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

function resolveGuideTone(status: string) {
  if (status === "assigned") return "success" as const;
  if (status === "available") return "info" as const;
  if (status === "off_duty") return "warning" as const;
  return "neutral" as const;
}

const inputClassName =
  "min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white";

const textareaClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white";
