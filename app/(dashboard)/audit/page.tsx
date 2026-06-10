import { AuditLogWorkbench } from "@/components/audit/audit-log-workbench";
import { PageIntro } from "@/components/layout/page-intro";
import { AccessDeniedCard } from "@/components/ui/access-denied-card";
import { SummaryGrid } from "@/components/ui/summary-grid";
import { hasPermission } from "@/lib/auth/session";
import { getAuditLogRecords, getAuditSummaryItems } from "@/lib/loaders/admin";

export default async function AuditPage() {
  const [canReadAudit, records, summaryItems] = await Promise.all([
    hasPermission("audit.read"),
    getAuditLogRecords(),
    getAuditSummaryItems(),
  ]);

  if (!canReadAudit) {
    return <AccessDeniedCard description="操作日志仅向管理员、运营和财务角色开放。" />;
  }

  return (
    <>
      <PageIntro
        eyebrow="Audit Trail"
        title="操作日志与变更追溯"
        description="集中查看关键业务和系统操作，追溯谁在什么时间修改了客户任务、订单、财务流水、账号权限或系统设置。"
      />
      <SummaryGrid items={summaryItems} />
      <AuditLogWorkbench records={records} />
    </>
  );
}
