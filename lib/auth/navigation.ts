import type { Route } from "next";

export type NavConfigItem = {
  title: string;
  href: Route;
  permission?: string;
};

export const NAVIGATION_ITEMS: NavConfigItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "运营日历", href: "/calendar", permission: "orders.read" },
  { title: "订单管理", href: "/orders", permission: "orders.read" },
  { title: "车辆管理", href: "/fleet", permission: "vehicles.read" },
  { title: "司机管理", href: "/drivers", permission: "drivers.read" },
  { title: "导游管理", href: "/guides", permission: "guides.read" },
  { title: "客户信息", href: "/customers", permission: "customers.read" },
  { title: "报价单管理", href: "/pricing", permission: "quotations.read" },
  { title: "成本与利润", href: "/profit", permission: "profit.read" },
  { title: "回款与对账", href: "/finance", permission: "finance.read" },
  { title: "操作日志", href: "/audit", permission: "audit.read" },
  { title: "系统设置", href: "/settings", permission: "settings.read" },
];
