import type { AppRole } from "@/lib/types/domain";

export const APP_ROLES: AppRole[] = ["admin", "operations", "sales", "finance", "dispatch"];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "管理员",
  operations: "运营",
  sales: "销售",
  finance: "财务",
  dispatch: "调度",
};

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  admin: ["*"],
  operations: ["orders.read", "orders.write", "customers.read", "customers.write", "profit.read", "finance.read", "audit.read", "guides.read", "guides.write", "drivers.read", "drivers.write", "vehicles.read", "vehicles.write", "quotations.read", "quotations.write"],
  sales: ["customers.read", "customers.write", "quotations.read", "quotations.write", "orders.read"],
  finance: ["orders.read", "profit.read", "profit.write", "finance.read", "finance.write", "audit.read", "customers.read", "quotations.read"],
  dispatch: ["orders.read", "orders.write", "vehicles.read", "vehicles.write", "drivers.read", "drivers.write", "guides.read", "guides.write"],
};
