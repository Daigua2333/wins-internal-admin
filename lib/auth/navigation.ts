import type { Route } from "next";

export type NavConfigItem = {
  title: string;
  href: Route;
  permission?: string;
  group: "overview" | "operations" | "resources" | "governance";
};

export const NAVIGATION_ITEMS: NavConfigItem[] = [
  { title: "Dashboard", href: "/dashboard", group: "overview" },
  { title: "运营日历", href: "/calendar", permission: "orders.read", group: "operations" },
  { title: "订单管理", href: "/orders", permission: "orders.read", group: "operations" },
  { title: "客户信息", href: "/customers", permission: "customers.read", group: "operations" },
  { title: "报价单管理", href: "/pricing", permission: "quotations.read", group: "operations" },
  { title: "车辆管理", href: "/fleet", permission: "vehicles.read", group: "resources" },
  { title: "司机管理", href: "/drivers", permission: "drivers.read", group: "resources" },
  { title: "导游管理", href: "/guides", permission: "guides.read", group: "resources" },
  { title: "成本与利润", href: "/profit", permission: "profit.read", group: "governance" },
  { title: "回款与对账", href: "/finance", permission: "finance.read", group: "governance" },
  { title: "操作日志", href: "/audit", permission: "audit.read", group: "governance" },
  { title: "系统设置", href: "/settings", permission: "settings.read", group: "governance" },
];
