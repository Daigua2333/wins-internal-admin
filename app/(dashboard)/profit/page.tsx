import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { PageIntro } from "@/components/layout/page-intro";
import { ModuleToolbar } from "@/components/ui/module-toolbar";
import { ProfitOperationsWorkbench } from "@/components/profit/profit-operations-workbench";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { hasPermission } from "@/lib/auth/session";
import { getDashboardProfitSeries, getProfitOperationsRecords, getProfitSummaryItems } from "@/lib/loaders/admin";

export default async function ProfitPage() {
  const [records, summaryItems, chartData, canReadProfit, canWriteProfit] = await Promise.all([
    getProfitOperationsRecords(),
    getProfitSummaryItems(),
    getDashboardProfitSeries(),
    hasPermission("profit.read"),
    hasPermission("profit.write"),
  ]);

  if (!canReadProfit) {
    return <AccessDeniedCard description="成本与利润模块仅向具备财务敏感数据查看权限的角色开放。" />;
  }

  return (
    <>
      <PageIntro
        eyebrow="Cost & Profit"
        title="成本与利润模块"
        description="针对每个订单或行程计算收入、车辆成本、司机成本、导游成本、酒店餐食与其他杂费，为运营和财务提供清晰的利润视角。"
      />

      <SummaryGrid items={summaryItems} />

      <ModuleToolbar
        searchPlaceholder="利润页已切换到真实分析工作台"
        filters={["盈利中", "正常", "已取消", "本月项目"]}
        primaryAction="利润基于订单自动汇总"
        canCreate={canWriteProfit}
        readOnlyHint="当前角色可查看利润，利润分析以订单与成本明细自动生成"
      />

      <ProfitOperationsWorkbench records={records} canViewSensitiveMetrics={canReadProfit} chartData={chartData} />
    </>
  );
}
