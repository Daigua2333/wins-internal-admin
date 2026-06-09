import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { PageIntro } from "@/components/layout/page-intro";
import { ProfitOperationsWorkbench } from "@/components/profit/profit-operations-workbench";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { hasPermission } from "@/lib/auth/session";
import { getDashboardProfitSeries, getProfitOperationsRecords, getProfitSummaryItems } from "@/lib/loaders/admin";

export default async function ProfitPage() {
  const [records, summaryItems, chartData, canReadProfit, canMaintainCosts] = await Promise.all([
    getProfitOperationsRecords(),
    getProfitSummaryItems(),
    getDashboardProfitSeries(),
    hasPermission("profit.read"),
    hasPermission("orders.write"),
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

      <ProfitOperationsWorkbench records={records} canViewSensitiveMetrics={canReadProfit} canMaintainCosts={canMaintainCosts} chartData={chartData} />
    </>
  );
}
