"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Save, Shield, Bell, Building2 } from "lucide-react";

import { SectionCard } from "@/components/ui/section-card";

type SettingItem = {
  title: string;
  description: string;
};

type MockSettingsStudioProps = {
  items: SettingItem[];
};

const iconMap = [Building2, Shield, Bell];

export function MockSettingsStudio({ items }: MockSettingsStudioProps) {
  const [selectedTitle, setSelectedTitle] = useState(items[0]?.title ?? "");

  const selectedItem = useMemo(
    () => items.find((item) => item.title === selectedTitle) ?? items[0],
    [items, selectedTitle],
  );

  if (!selectedItem) return null;

  return (
    <section className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
      <SectionCard title="配置目录" description="点击左侧配置项，右边会出现 mock 编辑面板。">
        <div className="space-y-3">
          {items.map((item, index) => {
            const Icon = iconMap[index] ?? Building2;
            const active = item.title === selectedItem.title;

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => setSelectedTitle(item.title)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                  active ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-2xl p-2 ${active ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="配置编辑器"
        description="当前是展示型 mock 编辑界面，后续可替换成真实表单与 Supabase 配置表。"
        action={
          <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">
            <Save className="h-4 w-4" />
            保存变更
          </button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Selected Config</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{selectedItem.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{selectedItem.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">配置名称</p>
              <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{selectedItem.title}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-900">状态</p>
              <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">已启用</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-900">说明</p>
            <div className="mt-3 min-h-28 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              {selectedItem.description}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-cyan-200 bg-cyan-50/70 p-4">
            <p className="text-sm font-medium text-cyan-900">接入建议</p>
            <p className="mt-2 text-sm leading-6 text-cyan-800">
              这里后续适合接入角色权限表、通知模板表、系统参数表，并通过 Supabase RLS 控制编辑权限。
            </p>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
