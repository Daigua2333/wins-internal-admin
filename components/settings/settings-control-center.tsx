"use client";

import { Bell, Building2, Save, SlidersHorizontal } from "lucide-react";

import {
  updateCompanyProfile,
  updateNotificationRules,
  updateOperationsPolicy,
} from "@/app/(dashboard)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import type { SettingsWorkspaceSnapshot } from "@/lib/loaders/admin";

type SettingsControlCenterProps = {
  snapshot: SettingsWorkspaceSnapshot;
};

export function SettingsControlCenter({ snapshot }: SettingsControlCenterProps) {
  return (
    <section className="space-y-4">
      <SectionCard
        title="配置中心"
        description="把公司信息、通知规则和运营参数真正落成可维护配置，作为后台长期运行的基础。"
        action={<Badge label="管理员可编辑" tone="warning" />}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <ConfigPreview
            icon={Building2}
            title="公司信息"
            lines={[snapshot.companyProfile.companyName, snapshot.companyProfile.officeAddress, snapshot.companyProfile.supportEmail]}
          />
          <ConfigPreview
            icon={Bell}
            title="通知规则"
            lines={[
              snapshot.notificationRules.orderStatusAlerts ? "订单状态提醒已启用" : "订单状态提醒已关闭",
              `${snapshot.notificationRules.reminderLeadDays} 天前触发提醒`,
              snapshot.notificationRules.quoteExpiryAlerts ? "报价到期提醒已启用" : "报价到期提醒已关闭",
            ]}
          />
          <ConfigPreview
            icon={SlidersHorizontal}
            title="运营参数"
            lines={[
              `目标毛利率 ${snapshot.operationsPolicy.targetGrossMarginRate}%`,
              `默认货币 ${snapshot.operationsPolicy.defaultCurrency}`,
              `一日游默认出发 ${snapshot.operationsPolicy.dailyTourDefaultStartTime}`,
            ]}
          />
        </div>
      </SectionCard>

      <section className="grid gap-4 2xl:grid-cols-3">
        <SectionCard
          title="公司信息"
          description="维护后台内统一显示的公司名称、品牌、东京办公室信息和结算主体。"
          action={<ActionHint />}
        >
          <form action={updateCompanyProfile} className="space-y-4">
            <Field label="公司名称">
              <input name="companyName" defaultValue={snapshot.companyProfile.companyName} className={inputClassName} />
            </Field>
            <Field label="品牌简称">
              <input name="brandName" defaultValue={snapshot.companyProfile.brandName} className={inputClassName} />
            </Field>
            <Field label="东京办公室地址">
              <textarea name="officeAddress" rows={4} defaultValue={snapshot.companyProfile.officeAddress} className={textareaClassName} />
            </Field>
            <Field label="结算主体">
              <input name="settlementEntity" defaultValue={snapshot.companyProfile.settlementEntity} className={inputClassName} />
            </Field>
            <Field label="支持邮箱">
              <input name="supportEmail" defaultValue={snapshot.companyProfile.supportEmail} className={inputClassName} />
            </Field>
            <Field label="支持电话">
              <input name="supportPhone" defaultValue={snapshot.companyProfile.supportPhone} className={inputClassName} />
            </Field>
            <SaveButton />
          </form>
        </SectionCard>

        <SectionCard
          title="通知规则"
          description="配置订单、车辆、报价和授信提醒，让运营和财务更容易及时发现异常。"
          action={<ActionHint />}
        >
          <form action={updateNotificationRules} className="space-y-4">
            <Toggle name="orderStatusAlerts" label="订单状态变更提醒" defaultChecked={snapshot.notificationRules.orderStatusAlerts} />
            <Toggle
              name="vehicleInspectionAlerts"
              label="车辆保养 / 点检提醒"
              defaultChecked={snapshot.notificationRules.vehicleInspectionAlerts}
            />
            <Toggle name="quoteExpiryAlerts" label="报价单到期提醒" defaultChecked={snapshot.notificationRules.quoteExpiryAlerts} />
            <Toggle name="customerCreditAlerts" label="客户授信与账期提醒" defaultChecked={snapshot.notificationRules.customerCreditAlerts} />
            <Field label="提前提醒天数">
              <input type="number" min="0" max="30" name="reminderLeadDays" defaultValue={snapshot.notificationRules.reminderLeadDays} className={inputClassName} />
            </Field>
            <SaveButton />
          </form>
        </SectionCard>

        <SectionCard
          title="运营参数"
          description="配置默认货币、目标毛利率和调度策略，给后续自动化规则预留统一入口。"
          action={<ActionHint />}
        >
          <form action={updateOperationsPolicy} className="space-y-4">
            <Field label="默认货币">
              <input name="defaultCurrency" defaultValue={snapshot.operationsPolicy.defaultCurrency} className={inputClassName} />
            </Field>
            <Field label="目标毛利率 %">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                name="targetGrossMarginRate"
                defaultValue={snapshot.operationsPolicy.targetGrossMarginRate}
                className={inputClassName}
              />
            </Field>
            <Field label="一日游默认出发时间">
              <input
                type="time"
                name="dailyTourDefaultStartTime"
                defaultValue={snapshot.operationsPolicy.dailyTourDefaultStartTime}
                className={inputClassName}
              />
            </Field>
            <Toggle
              name="conflictStrictMode"
              label="资源冲突严格阻止保存"
              defaultChecked={snapshot.operationsPolicy.conflictStrictMode}
            />
            <Toggle
              name="autoMarkScheduledOnAssignment"
              label="排车 / 排人后自动改为已排车"
              defaultChecked={snapshot.operationsPolicy.autoMarkScheduledOnAssignment}
            />
            <SaveButton />
          </form>
        </SectionCard>
      </section>
    </section>
  );
}

function ConfigPreview({
  icon: Icon,
  title,
  lines,
}: {
  icon: typeof Building2;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-2 text-slate-700">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
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

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 text-cyan-700" />
    </label>
  );
}

function ActionHint() {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">实时保存到配置表</span>;
}

function SaveButton() {
  return (
    <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800">
      <Save className="mr-2 h-4 w-4" />
      保存设置
    </button>
  );
}

const inputClassName =
  "min-h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white";

const textareaClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white";
