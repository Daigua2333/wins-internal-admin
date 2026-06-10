import type { AppRole } from "@/lib/types/domain";

export type PermissionLevel = "none" | "read" | "write" | "manage";

export type PermissionModule = {
  key: string;
  label: string;
  description: string;
  readPermission?: string;
  writePermission?: string;
  managePermission?: string;
};

export type PermissionGroup = {
  label: string;
  modules: PermissionModule[];
};

export type RoleDefinition = {
  label: string;
  shortLabel: string;
  description: string;
  responsibility: string;
  riskNote: string;
  accentClass: string;
};

export const APP_ROLES: AppRole[] = ["admin", "operations", "sales", "finance", "dispatch"];

export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  admin: {
    label: "系统管理员",
    shortLabel: "管理员",
    description: "维护账号、角色和全局配置，并可访问所有业务模块。",
    responsibility: "系统治理与最终授权",
    riskNote: "高权限角色，建议仅分配给少数负责人。",
    accentClass: "border-amber-200 bg-amber-50/80 text-amber-900",
  },
  operations: {
    label: "运营负责人",
    shortLabel: "运营",
    description: "负责订单、客户、资源与利润概览，覆盖日常运营全流程。",
    responsibility: "业务统筹与跨模块协调",
    riskNote: "可修改大部分运营数据，但不能管理账号与系统设置。",
    accentClass: "border-cyan-200 bg-cyan-50/80 text-cyan-900",
  },
  sales: {
    label: "销售与客户",
    shortLabel: "销售",
    description: "维护客户、报价与订单信息，不参与排班和财务写入。",
    responsibility: "客户关系、询价与报价转化",
    riskNote: "只能读取订单，不能改动调度和财务数据。",
    accentClass: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
  },
  finance: {
    label: "财务与对账",
    shortLabel: "财务",
    description: "管理回款、供应商付款与利润数据，并可查看审计记录。",
    responsibility: "回款、成本、利润与对账",
    riskNote: "可读取业务订单，但不能修改订单和运营资源。",
    accentClass: "border-blue-200 bg-blue-50/80 text-blue-900",
  },
  dispatch: {
    label: "调度执行",
    shortLabel: "调度",
    description: "管理订单执行、车辆、司机和导游排班。",
    responsibility: "排车、排班与现场执行",
    riskNote: "不能访问利润、回款、客户维护和系统设置。",
    accentClass: "border-orange-200 bg-orange-50/80 text-orange-900",
  },
};

export const ROLE_LABELS: Record<AppRole, string> = Object.fromEntries(
  APP_ROLES.map((role) => [role, ROLE_DEFINITIONS[role].shortLabel]),
) as Record<AppRole, string>;

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  admin: ["*"],
  operations: [
    "orders.read",
    "orders.write",
    "customers.read",
    "customers.write",
    "profit.read",
    "finance.read",
    "audit.read",
    "guides.read",
    "guides.write",
    "drivers.read",
    "drivers.write",
    "vehicles.read",
    "vehicles.write",
    "quotations.read",
    "quotations.write",
  ],
  sales: ["customers.read", "customers.write", "quotations.read", "quotations.write", "orders.read"],
  finance: ["orders.read", "profit.read", "profit.write", "finance.read", "finance.write", "audit.read", "customers.read", "quotations.read"],
  dispatch: ["orders.read", "orders.write", "vehicles.read", "vehicles.write", "drivers.read", "drivers.write", "guides.read", "guides.write"],
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "订单与客户",
    modules: [
      { key: "orders", label: "订单与运营日历", description: "订单创建、状态流转、归档和排班", readPermission: "orders.read", writePermission: "orders.write" },
      { key: "customers", label: "客户档案", description: "客户信息、合作任务和跟进记录", readPermission: "customers.read", writePermission: "customers.write" },
      { key: "quotations", label: "报价单", description: "报价创建、维护和转订单", readPermission: "quotations.read", writePermission: "quotations.write" },
    ],
  },
  {
    label: "运营资源",
    modules: [
      { key: "vehicles", label: "车辆", description: "车辆档案、状态和司机匹配", readPermission: "vehicles.read", writePermission: "vehicles.write" },
      { key: "drivers", label: "司机", description: "司机档案、排班和事故记录", readPermission: "drivers.read", writePermission: "drivers.write" },
      { key: "guides", label: "导游", description: "导游档案、资质和服务记录", readPermission: "guides.read", writePermission: "guides.write" },
    ],
  },
  {
    label: "财务与治理",
    modules: [
      { key: "profit", label: "成本与利润", description: "成本拆分和利润分析", readPermission: "profit.read", writePermission: "profit.write" },
      { key: "finance", label: "回款与对账", description: "客户回款和供应商付款", readPermission: "finance.read", writePermission: "finance.write" },
      { key: "audit", label: "操作日志", description: "查看重要操作的审计留痕", readPermission: "audit.read" },
      { key: "settings", label: "系统与账号设置", description: "角色、账号和系统参数管理", managePermission: "settings.read" },
    ],
  },
];

export function roleHasPermission(role: AppRole, permission: string) {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function getRoleModuleLevel(role: AppRole, module: PermissionModule): PermissionLevel {
  if (module.managePermission && roleHasPermission(role, module.managePermission)) {
    return "manage";
  }

  if (module.writePermission && roleHasPermission(role, module.writePermission)) {
    return "write";
  }

  if (module.readPermission && roleHasPermission(role, module.readPermission)) {
    return "read";
  }

  return "none";
}
