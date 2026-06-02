import { ProfitOverview } from "@/components/charts/profit-overview";
import { PageIntro } from "@/components/layout/page-intro";
import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { dashboardPipeline, dashboardTimeline } from "@/lib/mock/data";
import {
  getDashboardProfitSeries,
  getDashboardRecentOrders,
  getDashboardSnapshots,
  getDashboardStats,
} from "@/lib/loaders/admin";

export default async function DashboardPage() {
  const [stats, snapshots, profitSeries, recentOrders] = await Promise.all([
    getDashboardStats(),
    getDashboardSnapshots(),
    getDashboardProfitSeries(),
    getDashboardRecentOrders(),
  ]);

  return (
    <>
      <PageIntro
        eyebrow="Operations Overview"
        title="东京入境业务总览"
        description="将订单状态、排车排班、客户跟进与利润情况收拢到一个响应式首页，方便运营负责人快速掌握当天业务压力与资源调度。"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="运营驾驶舱"
          description="把今日接机、运力、待处理报价三类运营信息压缩成高识别度概览，方便主管在移动端也能快速判断优先级。"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {snapshots.map((item) => (
              <div
                key={item.title}
                className="panel-hover relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,#fff,rgba(248,250,252,0.92))] p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
              >
                <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 rounded-full bg-cyan-100/35 blur-2xl" />
                <p className="text-sm text-slate-500">{item.title}</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{item.value}</p>
                <p className="mt-2 text-sm text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="订单推进漏斗" description="为销售与调度提供从确认到出团的阶段性压力观察。">
          <div className="space-y-4">
            {dashboardPipeline.map((item, index) => (
              <div key={item.phase} className="rounded-[1.5rem] border border-slate-200/80 bg-white/86 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{item.phase}</p>
                    <p className="mt-1 text-slate-500">{item.detail}</p>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900">{item.count}</p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-emerald-500 shadow-sm"
                    style={{ width: `${88 - index * 19}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="利润趋势" description="Mock 数据展示近 6 个月营收与成本走势，后续可替换为 Supabase 聚合查询。">
          <ProfitOverview data={profitSeries} />
        </SectionCard>

        <SectionCard title="今日重点提醒" description="用于展示车辆保养、订单待确认、导游排班冲突等关键消息。">
          <div className="space-y-3">
            {dashboardTimeline.map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200/80 bg-[linear-gradient(180deg,#fff,rgba(248,250,252,0.9))] p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                <div className="rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-950/10">{item.time}</div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="最近订单" description="首页快速预览最新订单，便于直接跳转到订单管理模块。">
          <DataTable columns={["订单号", "客户", "行程", "日期", "负责人", "状态", "金额"]} rows={recentOrders} />
        </SectionCard>

        <SectionCard title="今日协同建议" description="把最常见的运营动作放在首页，形成更像真实工作台的操作感。">
          <div className="space-y-3">
            {[
              ["确认 3 个接机订单", "优先补齐航班号、落地时间、人数与行李数量。"],
              ["锁定 2 台周末巴士", "富士山团队出发前建议提前完成合作车队确认。"],
              ["催复 1 份企业报价", "Asia Incentive Co. 的 VIP 接待单需要在今晚前定价。"],
            ].map(([title, desc]) => (
              <div key={title} className="panel-hover rounded-[1.5rem] border border-slate-200/80 bg-white/88 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                <p className="text-sm font-medium text-slate-900">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </>
  );
}
