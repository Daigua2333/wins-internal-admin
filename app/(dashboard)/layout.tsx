import { NAVIGATION_ITEMS } from "@/lib/auth/navigation";
import { ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/auth/roles";
import { getCurrentProfile, getCurrentUser, hasPermission } from "@/lib/auth/session";
import { AccountDisabledCard } from "@/components/ui/account-disabled-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getOperationsReminderSnapshot, getOrderCreateOptions } from "@/lib/loaders/admin";
import { getNotificationSettings, getOperationsPolicySettings } from "@/lib/settings/runtime";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, user, canCreateOrder, orderOptions, notificationSettings, operationsPolicy] = await Promise.all([
    getCurrentProfile(),
    getCurrentUser(),
    hasPermission("orders.write"),
    getOrderCreateOptions(),
    getNotificationSettings(),
    getOperationsPolicySettings(),
  ]);
  const reminders = await getOperationsReminderSnapshot(notificationSettings.reminderLeadDays);

  const navItems =
    profile
      ? NAVIGATION_ITEMS.filter((item) => !item.permission || canAccessPermission(profile.role, item.permission))
      : NAVIGATION_ITEMS.filter((item) => !item.permission);

  if (profile && !profile.active) {
    return <AccountDisabledCard />;
  }

  return (
    <DashboardShell
      navItems={navItems}
      userEmail={user?.email}
      roleLabel={profile ? ROLE_LABELS[profile.role] : "未分配角色"}
      canCreateOrder={canCreateOrder}
      orderOptions={orderOptions}
      reminders={reminders}
      defaultStartTime={operationsPolicy.dailyTourDefaultStartTime}
      reminderLeadDays={notificationSettings.reminderLeadDays}
      targetGrossMarginRate={operationsPolicy.targetGrossMarginRate}
    >
      {children}
    </DashboardShell>
  );
}

function canAccessPermission(role: keyof typeof ROLE_LABELS, permission: string) {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}
