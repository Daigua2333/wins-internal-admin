import {
  customerRows,
  customerSummary,
  dashboardStats,
  driverRows,
  driverSummary,
  fleetRows,
  fleetSummary,
  guideRows,
  guideSummary,
  monthlyProfit,
  operationsSnapshots,
  orderRows,
  orderSummary,
  pricingRows,
  pricingSummary,
  profitRows,
  profitSummary,
  teamProfiles,
} from "@/lib/mock/data";
import { getRepositories } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatNumber } from "@/lib/utils/format";
import type { Stat } from "@/lib/mock/data";
import type { Profile } from "@/lib/types/domain";

type UiRow = Record<string, string>;
type SnapshotItem = {
  title: string;
  value: string;
  note: string;
  href?: string;
};
export type DashboardPipelineCard = {
  phase: string;
  count: string;
  detail: string;
  href: string;
  progress: number;
};
export type DashboardFocusItem = {
  time: string;
  title: string;
  description: string;
  href: string;
};
export type DashboardActionItem = {
  title: string;
  description: string;
  href: string;
  meta: string;
};
type ProfitPoint = {
  label: string;
  revenue: number;
  cost: number;
};
type SummaryItem = {
  title: string;
  value: string;
  detail: string;
};
export type OrderCreateOption = {
  id: string;
  label: string;
  hint?: string;
};
export type DispatchResourceOptions = {
  vehicles: OrderCreateOption[];
  drivers: OrderCreateOption[];
  guides: OrderCreateOption[];
};
export type OrderOperationsRecord = {
  id: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  title: string;
  serviceDate: string;
  assigneeId: string | null;
  assigneeName: string;
  vehicleId: string | null;
  vehicleName: string;
  driverId: string | null;
  driverName: string;
  guideId: string | null;
  guideName: string;
  status: string;
  statusLabel: string;
  revenueJpy: number;
  revenueLabel: string;
  totalCostJpy: number;
  totalCostLabel: string;
  grossProfitLabel: string;
  archivedAt: string | null;
  archiveCode: string | null;
  archiveSummary: string;
  archiveKeywords: string;
  notes: string;
};
export type OrderCostEntry = {
  id: string;
  orderId: string;
  category: string;
  categoryLabel: string;
  label: string;
  amountJpy: number;
  amountLabel: string;
  supplierName: string;
  notes: string;
};
export type DriverScheduleAssignment = {
  id: string;
  date: string;
  dateLabel: string;
  weekdayLabel: string;
  driverId: string;
  driverName: string;
  driverColor: string;
  vehicleId: string | null;
  vehicleName: string;
  vehiclePlateNumber: string;
  orderNo: string;
  routeTitle: string;
  statusLabel: string;
};
export type DriverDispatchCandidate = {
  orderId: string;
  orderNo: string;
  routeTitle: string;
  serviceDate: string;
  serviceDateLabel: string;
  statusLabel: string;
  currentDriverName: string;
  currentVehicleName: string;
};
export type DriverRouteLog = {
  id: string;
  driverId: string;
  date: string;
  dateLabel: string;
  routeTitle: string;
  orderNo: string;
  statusLabel: string;
  vehicleName: string;
  vehiclePlateNumber: string;
};
export type DriverFairnessRecord = {
  id: string;
  name: string;
  language: string;
  contractLabel: string;
  displayColor: string;
  defaultVehicleLabel: string;
  monthlyAttendanceDays: string;
  assignedDays: number;
  routeCount: number;
  fairnessLabel: string;
  fairnessTone: "balanced" | "busy" | "light";
};
export type DriverScheduleSnapshot = {
  month: string;
  monthLabel: string;
  scheduleDays: Array<{
    date: string;
    dateLabel: string;
    weekdayLabel: string;
    assignments: DriverScheduleAssignment[];
  }>;
  fairnessRecords: DriverFairnessRecord[];
  routeLogs: DriverRouteLog[];
  dispatchCandidates: DriverDispatchCandidate[];
  driverOptions: OrderCreateOption[];
  vehicleOptions: OrderCreateOption[];
};
export type DriverIncidentLog = {
  id: string;
  occurredOn: string;
  dateLabel: string;
  severity: "minor" | "major" | "critical";
  severityLabel: string;
  title: string;
  description: string;
  status: "open" | "reviewed" | "closed";
  statusLabel: string;
  orderNo: string;
};
export type DriverOperationsRecord = {
  id: string;
  fullName: string;
  languages: string[];
  languageLabel: string;
  contractType: "full_time" | "part_time" | "partner";
  contractLabel: string;
  phone: string;
  wechatId: string;
  lineId: string;
  attendanceDaysMonthly: number;
  attendanceDaysLabel: string;
  displayColor: string;
  defaultVehicleId: string | null;
  defaultVehicleLabel: string;
  status: string;
  statusLabel: string;
  notes: string;
  incidentLogs: DriverIncidentLog[];
};
export type GuideScheduleAssignment = {
  id: string;
  date: string;
  dateLabel: string;
  weekdayLabel: string;
  guideId: string;
  guideName: string;
  orderNo: string;
  routeTitle: string;
  statusLabel: string;
};
export type GuideDispatchCandidate = {
  orderId: string;
  orderNo: string;
  routeTitle: string;
  serviceDate: string;
  serviceDateLabel: string;
  statusLabel: string;
  currentGuideName: string;
};
export type GuideServiceLog = {
  id: string;
  dateLabel: string;
  note: string;
};
export type GuideOperationsRecord = {
  id: string;
  fullName: string;
  languages: string[];
  languageLabel: string;
  specialties: string[];
  specialtyLabel: string;
  licenseType: string;
  rating: number;
  ratingLabel: string;
  status: string;
  statusLabel: string;
  notes: string;
  serviceLogs: GuideServiceLog[];
};
export type GuideScheduleSnapshot = {
  scheduleDays: Array<{
    date: string;
    dateLabel: string;
    weekdayLabel: string;
    assignments: GuideScheduleAssignment[];
  }>;
  dispatchCandidates: GuideDispatchCandidate[];
  routeLogs: Array<{
    id: string;
    guideId: string;
    date: string;
    dateLabel: string;
    routeTitle: string;
    orderNo: string;
    statusLabel: string;
  }>;
};
export type VehicleOperationsRecord = {
  id: string;
  plateNumber: string;
  label: string;
  vehicleType: string;
  seatCapacity: number;
  seatLabel: string;
  ownerType: "owned" | "partner";
  ownerTypeLabel: string;
  inspectionDueOn: string;
  status: string;
  statusLabel: string;
  notes: string;
};
export type CustomerFollowLog = {
  id: string;
  dateLabel: string;
  note: string;
};
export type CustomerOrderTimelineEntry = {
  id: string;
  orderNo: string;
  title: string;
  serviceDate: string;
  serviceDateLabel: string;
  statusLabel: string;
  revenueLabel: string;
};
export type CustomerQuoteEntry = {
  id: string;
  quoteNo: string;
  title: string;
  serviceDateLabel: string;
  validUntilLabel: string;
  statusLabel: string;
  subtotalLabel: string;
};
export type CustomerOperationsRecord = {
  id: string;
  companyName: string;
  customerType: string;
  customerTypeLabel: string;
  companyProfile: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  wechatId: string;
  lineId: string;
  marketSegment: string;
  billingTerms: string;
  creditLimitJpy: number;
  creditLimitLabel: string;
  status: string;
  statusLabel: string;
  orderCount: number;
  orderCountLabel: string;
  notes: string;
  followLogs: CustomerFollowLog[];
  collaborationTasks: CustomerCollaborationTaskRecord[];
  orderTimeline: CustomerOrderTimelineEntry[];
  quoteEntries: CustomerQuoteEntry[];
};
export type CustomerCollaborationTaskRecord = {
  id: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  priority: string;
  priorityLabel: string;
  dueOn: string;
  dueOnLabel: string;
};
export type PricingOperationsRecord = {
  id: string;
  quoteNo: string;
  customerId: string;
  customerName: string;
  title: string;
  serviceDate: string;
  serviceDateLabel: string;
  validUntil: string;
  validUntilLabel: string;
  status: string;
  statusLabel: string;
  subtotalJpy: number;
  subtotalLabel: string;
  totalCostJpy: number;
  totalCostLabel: string;
  grossProfitLabel: string;
  grossMarginLabel: string;
  notes: string;
  linkedOrderId: string | null;
  linkedOrderNo: string | null;
};
export type ProfitOperationsRecord = {
  id: string;
  orderNo: string;
  project: string;
  customerName: string;
  serviceDate: string;
  serviceDateLabel: string;
  status: string;
  statusLabel: string;
  revenueJpy: number;
  revenueLabel: string;
  totalCostJpy: number;
  totalCostLabel: string;
  grossProfitJpy: number;
  grossProfitLabel: string;
  grossMarginRate: number;
  grossMarginLabel: string;
  costBreakdown: Array<{
    category: string;
    categoryLabel: string;
    amountJpy: number;
    amountLabel: string;
  }>;
};
export type SettingsWorkspaceSnapshot = {
  companyProfile: {
    companyName: string;
    brandName: string;
    officeAddress: string;
    settlementEntity: string;
    supportEmail: string;
    supportPhone: string;
  };
  notificationRules: {
    orderStatusAlerts: boolean;
    vehicleInspectionAlerts: boolean;
    quoteExpiryAlerts: boolean;
    customerCreditAlerts: boolean;
    reminderLeadDays: number;
  };
  operationsPolicy: {
    defaultCurrency: string;
    targetGrossMarginRate: number;
    dailyTourDefaultStartTime: string;
    conflictStrictMode: boolean;
    autoMarkScheduledOnAssignment: boolean;
  };
};
type CustomerOrderRow = {
  id: string;
  customer_id: string;
  order_no: string;
  title: string;
  service_date: string | null;
  status: string;
  revenue_jpy: number | null;
};
type CustomerQuoteRow = {
  id: string;
  customer_id: string;
  quote_no: string;
  title: string;
  service_date: string | null;
  valid_until: string | null;
  status: string;
  subtotal_jpy: number | null;
};
export type OperationsCalendarEvent = {
  id: string;
  date: string;
  orderNo: string;
  customerId: string;
  title: string;
  customerName: string;
  status: string;
  statusLabel: string;
  assigneeId: string | null;
  assigneeName: string;
  vehicleId: string | null;
  vehicleName: string;
  driverId: string | null;
  driverName: string;
  guideId: string | null;
  guideName: string;
  revenueJpy: number;
  revenueLabel: string;
  totalCostJpy: number;
  totalCostLabel: string;
  grossProfitLabel: string;
  notes: string;
};
export type OperationsCalendarSnapshot = {
  today: string;
  defaultMonth: string;
  events: OperationsCalendarEvent[];
};
export type OperationsReminderItem = {
  id: string;
  category: "order" | "quote" | "vehicle";
  categoryLabel: string;
  title: string;
  detail: string;
  date: string;
  dateLabel: string;
  tone: "warning" | "info" | "neutral";
  href: string;
};
export type OperationsReminderSnapshot = {
  items: OperationsReminderItem[];
  counts: {
    order: number;
    quote: number;
    vehicle: number;
  };
};
export type PaymentReceiptRecord = {
  id: string;
  orderId: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  title: string;
  serviceDate: string;
  serviceDateLabel: string;
  receivedOn: string;
  receivedOnLabel: string;
  amountJpy: number;
  amountLabel: string;
  method: string;
  methodLabel: string;
  status: string;
  statusLabel: string;
  referenceNo: string;
  notes: string;
};
export type FinanceReceivableRecord = {
  id: string;
  orderId: string;
  orderNo: string;
  customerId: string;
  customerName: string;
  title: string;
  serviceDate: string;
  serviceDateLabel: string;
  billingTerms: string;
  revenueJpy: number;
  revenueLabel: string;
  receivedJpy: number;
  receivedLabel: string;
  outstandingJpy: number;
  outstandingLabel: string;
  agingLabel: string;
  statusLabel: string;
};
export type FinanceCustomerStatementRecord = {
  id: string;
  customerId: string;
  customerName: string;
  orderCount: number;
  outstandingOrders: number;
  totalRevenueJpy: number;
  totalRevenueLabel: string;
  totalReceivedJpy: number;
  totalReceivedLabel: string;
  totalOutstandingJpy: number;
  totalOutstandingLabel: string;
  lastReceiptDateLabel: string;
};
export type SupplierPaymentRecord = {
  id: string;
  orderId: string;
  orderNo: string;
  customerName: string;
  supplierName: string;
  category: string;
  categoryLabel: string;
  paidOn: string;
  paidOnLabel: string;
  amountJpy: number;
  amountLabel: string;
  method: string;
  methodLabel: string;
  status: string;
  statusLabel: string;
  referenceNo: string;
  notes: string;
};

export async function getOrderWorkbenchRows(): Promise<UiRow[]> {
  const { enabled, orders } = getRepositories();
  const mockRows = orderRows.map((row) => ({
    orderNo: row.orderNo,
    customer: row.customer,
    itinerary: row.itinerary,
    date: row.date,
    assignee: row.assignee,
    status: row.status,
    amount: row.amount,
    notes: row.notes,
  }));

  if (!enabled) {
    return mockRows;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        order_no,
        title,
        service_date,
        status,
        revenue_jpy,
        customer:customers(company_name),
        assignee:profiles!orders_assignee_profile_id_fkey(full_name)
      `,
    )
    .order("service_date", { ascending: true })
    .limit(50);

  if (error || !data) {
    return mockRows;
  }

  return data.map((row: any) => ({
    orderNo: row.order_no,
    customer: row.customer?.company_name ?? "未关联客户",
    itinerary: row.title,
    date: row.service_date ?? "未安排",
    assignee: row.assignee?.full_name ?? "待分配",
    status: mapOrderStatus(row.status),
    amount: formatCurrency(Number(row.revenue_jpy ?? 0)),
  }));
}

export async function getOrderCreateOptions(): Promise<{
  customers: OrderCreateOption[];
  assignees: OrderCreateOption[];
}> {
  const { enabled, customers, profiles } = getRepositories();

  if (!enabled) {
    return {
      customers: customerRows.map((row, index) => ({
        id: `mock-customer-${index + 1}`,
        label: row.company,
        hint: row.contact,
      })),
      assignees: teamProfiles
        .filter((profile) => profile.active)
        .map((profile) => ({
          id: profile.id,
          label: profile.full_name,
          hint: profile.email,
        })),
    };
  }

  const [customerData, profileData] = await Promise.all([customers.list({ limit: 100 }), profiles.list({ limit: 100 })]);

  return {
    customers: customerData.map((customer) => ({
      id: customer.id,
      label: customer.company_name,
      hint: customer.contact_name,
    })),
    assignees: profileData
      .filter((profile) => profile.active)
      .map((profile) => ({
        id: profile.id,
        label: profile.full_name,
        hint: profile.email,
      })),
  };
}

export async function getOrderOperationsRecords(): Promise<OrderOperationsRecord[]> {
  const { enabled } = getRepositories();

  if (!enabled) {
    return buildMockOrderOperationsRecords();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
        id,
        order_no,
        customer_id,
        title,
        service_date,
        status,
        assignee_profile_id,
        vehicle_id,
        driver_id,
        guide_id,
        revenue_jpy,
        total_cost_jpy,
        archived_at,
        archive_code,
        archive_summary,
        archive_keywords,
        notes,
        customer:customers(company_name),
        assignee:profiles!orders_assignee_profile_id_fkey(full_name),
        vehicle:vehicles(label,plate_number),
        driver:drivers(full_name),
        guide:guides(full_name)
      `,
    )
    .order("service_date", { ascending: true })
    .limit(1000);

  if (error && /archive_|archived_at/.test(error.message)) {
    const fallback = await supabase
      .from("orders")
      .select(
        `
          id,
          order_no,
          customer_id,
          title,
          service_date,
          status,
          assignee_profile_id,
          vehicle_id,
          driver_id,
          guide_id,
          revenue_jpy,
          total_cost_jpy,
          notes,
          customer:customers(company_name),
          assignee:profiles!orders_assignee_profile_id_fkey(full_name),
          vehicle:vehicles(label,plate_number),
          driver:drivers(full_name),
          guide:guides(full_name)
        `,
      )
      .order("service_date", { ascending: true })
      .limit(1000);

    if (!fallback.error && fallback.data?.length) {
      return fallback.data.map((row: any) => mapOrderOperationsRecord(row));
    }
  }

  if (error || !data?.length) {
    return buildMockOrderOperationsRecords();
  }

  return data.map((row: any) => mapOrderOperationsRecord(row));
}

function mapOrderOperationsRecord(row: any): OrderOperationsRecord {
  return {
    id: row.id,
    orderNo: row.order_no,
    customerId: row.customer_id,
    customerName: row.customer?.company_name ?? "未关联客户",
    title: row.title,
    serviceDate: row.service_date ?? "",
    assigneeId: row.assignee_profile_id ?? null,
    assigneeName: row.assignee?.full_name ?? "待分配",
    vehicleId: row.vehicle_id ?? null,
    vehicleName: row.vehicle?.label ?? row.vehicle?.plate_number ?? "待分配",
    driverId: row.driver_id ?? null,
    driverName: row.driver?.full_name ?? "待分配",
    guideId: row.guide_id ?? null,
    guideName: row.guide?.full_name ?? "待分配",
    status: row.status,
    statusLabel: mapOrderStatus(row.status),
    revenueJpy: Number(row.revenue_jpy ?? 0),
    revenueLabel: formatCurrency(Number(row.revenue_jpy ?? 0)),
    totalCostJpy: Number(row.total_cost_jpy ?? 0),
    totalCostLabel: formatCurrency(Number(row.total_cost_jpy ?? 0)),
    grossProfitLabel: formatCurrency(Number(row.revenue_jpy ?? 0) - Number(row.total_cost_jpy ?? 0)),
    archivedAt: row.archived_at ?? null,
    archiveCode: row.archive_code ?? null,
    archiveSummary: row.archive_summary ?? "",
    archiveKeywords: row.archive_keywords ?? "",
    notes: row.notes ?? "",
  };
}

export async function getDispatchResourceOptions(): Promise<DispatchResourceOptions> {
  const { enabled, vehicles, drivers, guides } = getRepositories();

  if (!enabled) {
    return {
      vehicles: fleetRows.map((row, index) => ({
        id: `mock-vehicle-${index + 1}`,
        label: row.plateNo,
        hint: row.type,
      })),
      drivers: driverRows.map((row, index) => ({
        id: `mock-driver-${index + 1}`,
        label: row.name,
        hint: row.language,
      })),
      guides: guideRows.map((row, index) => ({
        id: `mock-guide-${index + 1}`,
        label: row.name,
        hint: row.specialty,
      })),
    };
  }

  const [vehicleData, driverData, guideData] = await Promise.all([
    vehicles.list({ limit: 100 }),
    drivers.list({ limit: 100 }),
    guides.list({ limit: 100 }),
  ]);

  return {
    vehicles: vehicleData.map((vehicle) => ({
      id: vehicle.id,
      label: vehicle.plate_number,
      hint: vehicle.vehicle_type,
    })),
    drivers: driverData.map((driver) => ({
      id: driver.id,
      label: driver.full_name,
      hint: Array.isArray(driver.languages) ? driver.languages.join(" / ") : "",
    })),
    guides: guideData.map((guide) => ({
      id: guide.id,
      label: guide.full_name,
      hint: Array.isArray(guide.specialties) ? guide.specialties.join(" / ") : "",
    })),
  };
}

export async function getOrderCostEntries(): Promise<OrderCostEntry[]> {
  const { enabled } = getRepositories();

  if (!enabled) {
    return buildMockOrderOperationsRecords().flatMap((order, index) => {
      const vehicleCost = Math.round(order.revenueJpy * 0.34);
      const driverCost = Math.round(order.revenueJpy * 0.09);
      const guideCost = Math.round(order.revenueJpy * 0.1);
      const miscCost = Math.max(order.totalCostJpy - vehicleCost - driverCost - guideCost, 0);

      return [
        {
          id: `mock-cost-${index + 1}-vehicle`,
          orderId: order.id,
          category: "vehicle",
          categoryLabel: "车辆",
          label: `${order.vehicleName} 车辆费用`,
          amountJpy: vehicleCost,
          amountLabel: formatCurrency(vehicleCost),
          supplierName: order.vehicleName.includes("合作") ? "合作车队" : "WINS 自有车辆",
          notes: "按当前订单车型与线路里程估算。",
        },
        {
          id: `mock-cost-${index + 1}-driver`,
          orderId: order.id,
          category: "driver",
          categoryLabel: "司机",
          label: `${order.driverName} 司机服务费`,
          amountJpy: driverCost,
          amountLabel: formatCurrency(driverCost),
          supplierName: order.driverName,
          notes: "包含当日基础工时与线路补贴。",
        },
        {
          id: `mock-cost-${index + 1}-guide`,
          orderId: order.id,
          category: "guide",
          categoryLabel: "导游",
          label: `${order.guideName} 导游服务费`,
          amountJpy: guideCost,
          amountLabel: formatCurrency(guideCost),
          supplierName: order.guideName,
          notes: "按语种、服务时长和线路复杂度估算。",
        },
        {
          id: `mock-cost-${index + 1}-misc`,
          orderId: order.id,
          category: "misc",
          categoryLabel: "杂费",
          label: "餐食 / 停车 / 运营杂费",
          amountJpy: miscCost,
          amountLabel: formatCurrency(miscCost),
          supplierName: "WINS Operations",
          notes: "用于演示成本拆分和利润核算。",
        },
      ];
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_costs")
    .select("id, order_id, category, label, amount_jpy, supplier_name, notes")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data?.length) {
    return [];
  }

  return (data as Array<any>).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    category: row.category,
    categoryLabel: mapCostCategory(row.category),
    label: row.label,
    amountJpy: Number(row.amount_jpy ?? 0),
    amountLabel: formatCurrency(Number(row.amount_jpy ?? 0)),
    supplierName: row.supplier_name ?? "未记录",
    notes: row.notes ?? "",
  }));
}

export async function getVehicleWorkbenchRows(): Promise<UiRow[]> {
  const { enabled, vehicles } = getRepositories();

  if (!enabled) {
    return fleetRows;
  }

  const data = await vehicles.list({ limit: 50 });

  if (!data.length) {
    return fleetRows;
  }

  return data.map((row) => ({
    plateNo: row.plate_number,
    type: row.vehicle_type,
    seats: String(row.seat_capacity),
    driver: row.label,
    inspection: row.inspection_due_on ?? "未设置",
    status: mapVehicleStatus(row.status),
  }));
}

export async function getVehicleOperationsRecords(): Promise<VehicleOperationsRecord[]> {
  const { enabled, vehicles } = getRepositories();

  if (!enabled) {
    return fleetRows.map((row, index) => ({
      id: `mock-vehicle-${index + 1}`,
      plateNumber: row.plateNo,
      label: `${row.type} ${index + 1}号车`,
      vehicleType: row.type,
      seatCapacity: Number(row.seats),
      seatLabel: `${row.seats} 座`,
      ownerType: index % 2 === 0 ? "owned" : "partner",
      ownerTypeLabel: index % 2 === 0 ? "自有车辆" : "合作车队",
      inspectionDueOn: row.inspection,
      status: mapVehicleStatusToCode(row.status),
      statusLabel: row.status,
      notes: row.status === "保养中" ? "建议在本周内安排替补车辆。" : "可用于东京市区和机场接送任务。",
    }));
  }

  const data = await vehicles.list({ limit: 100 });

  if (!data.length) {
    return [];
  }

  return data.map((vehicle) => ({
    id: vehicle.id,
    plateNumber: vehicle.plate_number,
    label: vehicle.label,
    vehicleType: vehicle.vehicle_type,
    seatCapacity: Number(vehicle.seat_capacity ?? 0),
    seatLabel: `${Number(vehicle.seat_capacity ?? 0)} 座`,
    ownerType: vehicle.owner_type,
    ownerTypeLabel: vehicle.owner_type === "owned" ? "自有车辆" : "合作车队",
    inspectionDueOn: vehicle.inspection_due_on ?? "",
    status: vehicle.status,
    statusLabel: mapVehicleStatus(vehicle.status),
    notes: vehicle.notes ?? "",
  }));
}

export async function getCustomerWorkbenchRows(): Promise<UiRow[]> {
  const { enabled, customers } = getRepositories();

  if (!enabled) {
    return customerRows;
  }

  const supabase = await createClient();
  const data = await customers.list({ limit: 50 });

  if (!data.length) {
    return customerRows;
  }

  const rowsWithCounts = await Promise.all(
    data.map(async (customer) => {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customer.id);

      return {
        company: customer.company_name,
        contact: customer.contact_name,
        market: customer.market_segment,
        orders: String(count ?? 0),
        balance: customer.credit_limit_jpy ? formatCurrency(Number(customer.credit_limit_jpy)) : "¥0",
        status: mapCustomerStatus(customer.status),
      };
    }),
  );

  return rowsWithCounts;
}

export async function getCustomerOperationsRecords(): Promise<CustomerOperationsRecord[]> {
  const { enabled, customers } = getRepositories();

  if (!enabled) {
    return customerRows.map((row, index) => ({
      id: `mock-customer-${index + 1}`,
      companyName: row.company,
      customerType: index < 2 ? "long_term" : index === 2 ? "short_term" : "one_time",
      customerTypeLabel: index < 2 ? "长期合作" : index === 2 ? "短期合作" : "一次性客户",
      companyProfile: index < 2 ? "稳定合作的东京入境旅游渠道伙伴，持续安排一日游与企业团。" : "按具体项目合作的旅游客户，保留完整档案便于未来再次联络。",
      contactName: row.contact,
      contactEmail: `contact${index + 1}@wins-demo.jp`,
      contactPhone: "03-0000-0000",
      wechatId: index % 2 === 0 ? `wins_customer_${index + 1}` : "",
      lineId: index % 2 === 1 ? `wins.customer.${index + 1}` : "",
      marketSegment: row.market,
      billingTerms: index % 2 === 0 ? "月末締め翌月末払い" : "当月締め翌月15日払い",
      creditLimitJpy: parseCurrencyLabel(row.balance),
      creditLimitLabel: row.balance,
      status: mapCustomerStatusToCode(row.status),
      statusLabel: mapCustomerStatus(mapCustomerStatusToCode(row.status)),
      orderCount: Number(row.orders),
      orderCountLabel: `${row.orders} 单`,
      notes: "当前为 mock 客户档案，可继续补联系人偏好、账期和跟进结论。",
      followLogs: buildMockCustomerFollowLogs(index + 1),
      collaborationTasks: buildMockCustomerCollaborationTasks(index + 1),
      orderTimeline: buildMockCustomerOrderTimeline(index + 1, row.company),
      quoteEntries: buildMockCustomerQuoteEntries(index + 1, row.company),
    }));
  }

  const supabase = await createClient();
  const data = await customers.list({ limit: 100 });

  if (!data.length) {
    return [];
  }

  const customerIds = data.map((customer) => customer.id);
  const [{ data: orderData }, { data: quoteData }, { data: taskData, error: taskError }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,customer_id,order_no,title,service_date,status,revenue_jpy")
      .in("customer_id", customerIds)
      .order("service_date", { ascending: false }),
    supabase
      .from("quotations")
      .select("id,customer_id,quote_no,title,service_date,valid_until,status,subtotal_jpy")
      .in("customer_id", customerIds)
      .order("updated_at", { ascending: false }),
    supabase
      .from("customer_collaboration_tasks")
      .select("id,customer_id,title,description,status,priority,due_on")
      .in("customer_id", customerIds)
      .order("due_on", { ascending: true }),
  ]);
  if (taskError) {
    console.error("[customers:collaboration-tasks]", taskError.message);
  }

  const ordersByCustomer = new Map<string, CustomerOrderRow[]>();
  for (const order of (orderData ?? []) as CustomerOrderRow[]) {
    const rows = ordersByCustomer.get(order.customer_id) ?? [];
    rows.push(order);
    ordersByCustomer.set(order.customer_id, rows);
  }

  const quotesByCustomer = new Map<string, CustomerQuoteRow[]>();
  for (const quote of (quoteData ?? []) as CustomerQuoteRow[]) {
    const rows = quotesByCustomer.get(quote.customer_id) ?? [];
    rows.push(quote);
    quotesByCustomer.set(quote.customer_id, rows);
  }

  const records = await Promise.all(
    data.map(async (customer) => {
      const customerOrders = ordersByCustomer.get(customer.id) ?? [];
      const customerQuotes = quotesByCustomer.get(customer.id) ?? [];

      return {
        id: customer.id,
        companyName: customer.company_name,
        customerType: customer.customer_type ?? "long_term",
        customerTypeLabel: mapCustomerType(customer.customer_type ?? "long_term"),
        companyProfile: customer.company_profile ?? "",
        contactName: customer.contact_name,
        contactEmail: customer.contact_email ?? "",
        contactPhone: customer.contact_phone ?? "",
        wechatId: customer.wechat_id ?? "",
        lineId: customer.line_id ?? "",
        marketSegment: customer.market_segment,
        billingTerms: customer.billing_terms ?? "",
        creditLimitJpy: Number(customer.credit_limit_jpy ?? 0),
        creditLimitLabel: formatCurrency(Number(customer.credit_limit_jpy ?? 0)),
        status: customer.status,
        statusLabel: mapCustomerStatus(customer.status),
        orderCount: customerOrders.length,
        orderCountLabel: `${customerOrders.length} 单`,
        notes: customer.notes ?? "",
        followLogs: parseCustomerFollowLogs(customer.notes),
        collaborationTasks: ((taskData as Array<any> | null) ?? [])
          .filter((task) => task.customer_id === customer.id)
          .map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description ?? "",
            status: task.status,
            statusLabel: mapCollaborationTaskStatus(task.status),
            priority: task.priority,
            priorityLabel: mapCollaborationTaskPriority(task.priority),
            dueOn: task.due_on ?? "",
            dueOnLabel: task.due_on ? formatDateDetail(task.due_on) : "未设置",
          })),
        orderTimeline: customerOrders.slice(0, 8).map((order) => ({
          id: order.id,
          orderNo: order.order_no,
          title: order.title,
          serviceDate: order.service_date ?? "",
          serviceDateLabel: order.service_date ? formatMonthDay(new Date(`${order.service_date}T00:00:00`)) : "未设置",
          statusLabel: mapOrderStatus(order.status),
          revenueLabel: formatCurrency(Number(order.revenue_jpy ?? 0)),
        })),
        quoteEntries: customerQuotes.slice(0, 8).map((quote) => ({
          id: quote.id,
          quoteNo: quote.quote_no,
          title: quote.title,
          serviceDateLabel: quote.service_date ? formatMonthDay(new Date(`${quote.service_date}T00:00:00`)) : "未设置",
          validUntilLabel: quote.valid_until ? formatMonthDay(new Date(`${quote.valid_until}T00:00:00`)) : "未设置",
          statusLabel: mapQuoteStatus(quote.status),
          subtotalLabel: formatCurrency(Number(quote.subtotal_jpy ?? 0)),
        })),
      } satisfies CustomerOperationsRecord;
    }),
  );

  return records;
}

export async function getDriverWorkbenchRows(): Promise<UiRow[]> {
  const { enabled, drivers } = getRepositories();

  if (!enabled) {
    return driverRows;
  }

  const data = await drivers.list({ limit: 50 });

  if (!data.length) {
    return driverRows;
  }

  return data.map((row) => ({
    name: row.full_name,
    language: Array.isArray(row.languages) ? row.languages.join(" / ") : "",
    contract: mapContractType(row.contract_type),
    attendanceDays: `${Number(row.attendance_days_monthly ?? 0)} 天`,
    defaultVehicle: row.default_vehicle_id ?? "未绑定",
    status: mapStaffStatus(row.status),
  }));
}

export async function getDriverOperationsRecords(): Promise<DriverOperationsRecord[]> {
  const { enabled, drivers, vehicles } = getRepositories();

  if (!enabled) {
    return driverRows.map((row, index) => ({
      id: `mock-driver-${index + 1}`,
      fullName: row.name,
      languages: row.language.split(" / "),
      languageLabel: row.language,
      contractType: row.contract === "全职" ? "full_time" : row.contract === "兼职" ? "part_time" : "partner",
      contractLabel: row.contract,
      phone: index === 0 ? "090-3200-8821" : index === 1 ? "090-5143-1200" : "090-7651-4450",
      wechatId: index % 2 === 0 ? `wins_driver_${index + 1}` : "",
      lineId: index % 2 === 1 ? `wins.line.${index + 1}` : "",
      attendanceDaysMonthly: [12, 8, 10, 11, 9][index] ?? 0,
      attendanceDaysLabel: `${[12, 8, 10, 11, 9][index] ?? 0} 天`,
      displayColor: ["#0f766e", "#2563eb", "#d97706", "#be123c", "#7c3aed"][index] ?? "#0f766e",
      defaultVehicleId: `mock-vehicle-${(index % fleetRows.length) + 1}`,
      defaultVehicleLabel: fleetRows[index % fleetRows.length]?.plateNo ?? "未绑定",
      status: mapStaffStatusToCode(row.status),
      statusLabel: row.status,
      notes: row.status === "休假中" ? "本周安排年假，暂不参与高峰排班。" : "适合东京市区、机场线与包车任务。",
      incidentLogs: buildMockDriverIncidentLogs(index + 1),
    }));
  }

  const [data, vehicleData, supabase] = await Promise.all([drivers.list({ limit: 100 }), vehicles.list({ limit: 200 }), createClient()]);

  if (!data.length) {
    return [];
  }

  const { data: incidentData } = await supabase
    .from("driver_incidents")
    .select("id,driver_id,order_id,occurred_on,severity,title,description,status,order:orders(order_no)")
    .order("occurred_on", { ascending: false })
    .limit(500);

  return data.map((driver) => ({
    id: driver.id,
    fullName: driver.full_name,
    languages: Array.isArray(driver.languages) ? driver.languages : [],
    languageLabel: Array.isArray(driver.languages) ? driver.languages.join(" / ") : "",
    contractType: driver.contract_type,
    contractLabel: mapContractType(driver.contract_type),
    phone: driver.phone ?? "",
    wechatId: driver.wechat_id ?? "",
    lineId: driver.line_id ?? "",
    attendanceDaysMonthly: Number(driver.attendance_days_monthly ?? 0),
    attendanceDaysLabel: `${Number(driver.attendance_days_monthly ?? 0)} 天`,
    displayColor: driver.display_color ?? "#0f766e",
    defaultVehicleId: driver.default_vehicle_id ?? null,
    defaultVehicleLabel: vehicleData.find((vehicle) => vehicle.id === driver.default_vehicle_id)?.plate_number ?? "未绑定",
    status: driver.status,
    statusLabel: mapStaffStatus(driver.status),
    notes: driver.notes ?? "",
    incidentLogs: ((incidentData as Array<any> | null) ?? [])
      .filter((incident) => incident.driver_id === driver.id)
      .map(mapDriverIncidentLog),
  }));
}

export async function getDriverScheduleSnapshot(monthInput?: string): Promise<DriverScheduleSnapshot> {
  const { enabled, drivers, vehicles } = getRepositories();
  const month = normalizeMonthInput(monthInput);

  if (!enabled) {
    return buildMockDriverScheduleSnapshot(month);
  }

  const [driverData, vehicleData, supabase] = await Promise.all([drivers.list({ limit: 100 }), vehicles.list({ limit: 200 }), createClient()]);

  const { startDate, endDate } = getMonthBounds(month);
  const { data: orderData, error } = await supabase
    .from("orders")
    .select("id, order_no, title, service_date, driver_id, vehicle_id, status")
    .gte("service_date", startDate)
    .lte("service_date", endDate)
    .neq("status", "cancelled")
    .order("service_date", { ascending: true })
    .limit(1000);

  if (error) {
    console.error("[drivers:schedule]", error.message);
  }

  const monthlyOrders = (orderData as Array<any> | null) ?? [];
  const assignments = monthlyOrders
    .filter((row) => row.driver_id && row.service_date)
    .map((row) => {
      const serviceDate = String(row.service_date);
      const day = new Date(`${serviceDate}T00:00:00`);
      const driver = driverData.find((item) => item.id === row.driver_id);
      const vehicle = vehicleData.find((item) => item.id === row.vehicle_id);

      return {
        id: row.id,
        date: serviceDate,
        dateLabel: formatMonthDay(day),
        weekdayLabel: formatWeekday(day),
        driverId: row.driver_id,
        driverName: driver?.full_name ?? "未匹配司机",
        driverColor: driver?.display_color ?? "#64748b",
        vehicleId: row.vehicle_id ?? null,
        vehicleName: vehicle?.label ?? "待配车",
        vehiclePlateNumber: vehicle?.plate_number ?? "未配车",
        orderNo: row.order_no,
        routeTitle: row.title,
        statusLabel: mapOrderStatus(row.status),
      } satisfies DriverScheduleAssignment;
    });

  const scheduleDays = buildMonthDateList(month).map((date) => {
    const day = new Date(`${date}T00:00:00`);

    return {
      date,
      dateLabel: formatMonthDay(day),
      weekdayLabel: formatWeekday(day),
      assignments: assignments.filter((item) => item.date === date),
    };
  });

  const fairnessRecords = driverData
    .map((driver) => {
      const driverAssignments = assignments.filter((item) => item.driverId === driver.id);
      const assignedDays = new Set(driverAssignments.map((item) => item.date)).size;
      const routeCount = driverAssignments.length;

      return {
        id: driver.id,
        name: driver.full_name,
        language: Array.isArray(driver.languages) ? driver.languages.join(" / ") : "",
        contractLabel: mapContractType(driver.contract_type),
        displayColor: driver.display_color ?? "#0f766e",
        defaultVehicleLabel: vehicleData.find((vehicle) => vehicle.id === driver.default_vehicle_id)?.plate_number ?? "未绑定",
        monthlyAttendanceDays: `${assignedDays} 天`,
        assignedDays,
        routeCount,
        ...resolveFairnessState(assignedDays, routeCount),
      };
    })
    .sort((left, right) => right.routeCount - left.routeCount);

  const routeLogs = assignments
    .map((assignment) => ({
      id: assignment.id,
      driverId: assignment.driverId,
      date: assignment.date,
      dateLabel: assignment.dateLabel,
      routeTitle: assignment.routeTitle,
      orderNo: assignment.orderNo,
      statusLabel: assignment.statusLabel,
      vehicleName: assignment.vehicleName,
      vehiclePlateNumber: assignment.vehiclePlateNumber,
    }))
    .sort((left, right) => right.date.localeCompare(left.date));

  return {
    month,
    monthLabel: formatMonthLabel(month),
    scheduleDays,
    fairnessRecords,
    routeLogs,
    dispatchCandidates: monthlyOrders
      .filter((row) => row.service_date)
      .map((row) => {
        const day = new Date(`${row.service_date}T00:00:00`);
        const driver = driverData.find((item) => item.id === row.driver_id);

        return {
          orderId: row.id,
          orderNo: row.order_no,
          routeTitle: row.title,
          serviceDate: row.service_date,
          serviceDateLabel: formatMonthDay(day),
          statusLabel: mapOrderStatus(row.status),
          currentDriverName: driver?.full_name ?? "待分配",
          currentVehicleName: vehicleData.find((vehicle) => vehicle.id === row.vehicle_id)?.plate_number ?? "待配车",
        } satisfies DriverDispatchCandidate;
      })
      .sort((left, right) => left.serviceDate.localeCompare(right.serviceDate))
      .slice(0, 100),
    driverOptions: driverData.map((driver) => ({
      id: driver.id,
      label: driver.full_name,
      hint: vehicleData.find((vehicle) => vehicle.id === driver.default_vehicle_id)?.plate_number ?? "未绑定默认车辆",
    })),
    vehicleOptions: vehicleData.map((vehicle) => ({
      id: vehicle.id,
      label: vehicle.plate_number,
      hint: vehicle.label,
    })),
  };
}

export async function getGuideWorkbenchRows(): Promise<UiRow[]> {
  const { enabled, guides } = getRepositories();

  if (!enabled) {
    return guideRows;
  }

  const data = await guides.list({ limit: 50 });

  if (!data.length) {
    return guideRows;
  }

  return data.map((row) => ({
    name: row.full_name,
    specialty: Array.isArray(row.specialties) ? row.specialties.join(" / ") : "未设置",
    language: Array.isArray(row.languages) ? row.languages.join(" / ") : "",
    license: row.license_type ?? "未设置",
    rating: row.rating ? String(row.rating) : "-",
    status: mapStaffStatus(row.status),
  }));
}

export async function getGuideOperationsRecords(): Promise<GuideOperationsRecord[]> {
  const { enabled, guides } = getRepositories();

  if (!enabled) {
    return guideRows.map((row, index) => ({
      id: `mock-guide-${index + 1}`,
      fullName: row.name,
      specialties: row.specialty.split(" / "),
      specialtyLabel: row.specialty,
      languages: row.language.split(" / "),
      languageLabel: row.language,
      licenseType: row.license,
      rating: Number(row.rating),
      ratingLabel: row.rating,
      status: mapStaffStatusToCode(row.status === "待命中" ? "可派单" : row.status === "休息中" ? "休假中" : row.status),
      statusLabel: row.status,
      notes: "当前为 mock 导游档案，可继续补服务强项、资质和客户反馈。",
      serviceLogs: buildMockGuideServiceLogs(index + 1),
    }));
  }

  const data = await guides.list({ limit: 100 });

  if (!data.length) {
    return [];
  }

  return data.map((guide) => ({
    id: guide.id,
    fullName: guide.full_name,
    specialties: Array.isArray(guide.specialties) ? guide.specialties : [],
    specialtyLabel: Array.isArray(guide.specialties) ? guide.specialties.join(" / ") : "",
    languages: Array.isArray(guide.languages) ? guide.languages : [],
    languageLabel: Array.isArray(guide.languages) ? guide.languages.join(" / ") : "",
    licenseType: guide.license_type ?? "",
    rating: Number(guide.rating ?? 0),
    ratingLabel: guide.rating ? String(guide.rating) : "0.0",
    status: guide.status,
    statusLabel: mapGuideStatus(guide.status),
    notes: guide.notes ?? "",
    serviceLogs: parseGuideServiceLogs(guide.notes),
  }));
}

export async function getGuideScheduleSnapshot(): Promise<GuideScheduleSnapshot> {
  const { enabled, guides } = getRepositories();

  if (!enabled) {
    return buildMockGuideScheduleSnapshot();
  }

  const [guideData, supabase] = await Promise.all([guides.list({ limit: 100 }), createClient()]);

  if (!guideData.length) {
    return buildMockGuideScheduleSnapshot();
  }

  const { data: orderData, error } = await supabase
    .from("orders")
    .select("id, order_no, title, service_date, guide_id, status")
    .not("guide_id", "is", null)
    .order("service_date", { ascending: true })
    .limit(300);

  if (error || !orderData) {
    return buildMockGuideScheduleSnapshot();
  }

  const assignments = (orderData as Array<any>)
    .filter((row) => row.guide_id && row.service_date)
    .map((row) => {
      const serviceDate = String(row.service_date);
      const day = new Date(`${serviceDate}T00:00:00`);
      const guide = guideData.find((item) => item.id === row.guide_id);

      return {
        id: row.id,
        date: serviceDate,
        dateLabel: formatMonthDay(day),
        weekdayLabel: formatWeekday(day),
        guideId: row.guide_id,
        guideName: guide?.full_name ?? "未匹配导游",
        orderNo: row.order_no,
        routeTitle: row.title,
        statusLabel: mapOrderStatus(row.status),
      } satisfies GuideScheduleAssignment;
    });

  if (!assignments.length) {
    return buildMockGuideScheduleSnapshot();
  }

  const uniqueDates = Array.from(new Set(assignments.map((item) => item.date))).slice(0, 7);
  const scheduleDays = uniqueDates.map((date) => {
    const day = new Date(`${date}T00:00:00`);

    return {
      date,
      dateLabel: formatMonthDay(day),
      weekdayLabel: formatWeekday(day),
      assignments: assignments.filter((item) => item.date === date),
    };
  });

  const routeLogs = assignments
    .map((assignment) => ({
      id: assignment.id,
      guideId: assignment.guideId,
      date: assignment.date,
      dateLabel: assignment.dateLabel,
      routeTitle: assignment.routeTitle,
      orderNo: assignment.orderNo,
      statusLabel: assignment.statusLabel,
    }))
    .sort((left, right) => right.date.localeCompare(left.date));

  return {
    scheduleDays,
    routeLogs,
    dispatchCandidates: (orderData as Array<any>)
      .filter((row) => row.service_date)
      .map((row) => {
        const day = new Date(`${row.service_date}T00:00:00`);
        const guide = guideData.find((item) => item.id === row.guide_id);

        return {
          orderId: row.id,
          orderNo: row.order_no,
          routeTitle: row.title,
          serviceDate: row.service_date,
          serviceDateLabel: formatMonthDay(day),
          statusLabel: mapOrderStatus(row.status),
          currentGuideName: guide?.full_name ?? "待分配",
        } satisfies GuideDispatchCandidate;
      })
      .sort((left, right) => left.serviceDate.localeCompare(right.serviceDate))
      .slice(0, 20),
  };
}

export async function getPricingWorkbenchRows(): Promise<UiRow[]> {
  const { enabled, quotes } = getRepositories();

  if (!enabled) {
    return pricingRows;
  }

  const supabase = await createClient();
  const repoRows = await quotes.list({ limit: 50 });
  const quoteIds = repoRows.map((row) => row.id);

  if (!quoteIds.length) {
    return pricingRows;
  }

  const { data, error } = await supabase
    .from("quotations")
    .select("id,quote_no,title,service_date,valid_until,status,customer:customers(company_name)")
    .in("id", quoteIds)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return pricingRows;
  }

  return data.map((row: any) => ({
    quoteNo: row.quote_no,
    client: row.customer?.company_name ?? "未关联客户",
    product: row.title,
    issueDate: row.service_date ?? "未设置",
    validUntil: row.valid_until ?? "未设置",
    status: mapQuoteStatus(row.status),
  }));
}

export async function getPricingOperationsRecords(): Promise<PricingOperationsRecord[]> {
  const { enabled, quotes } = getRepositories();

  if (!enabled) {
    return pricingRows.map((row, index) => ({
      id: `mock-quote-${index + 1}`,
      quoteNo: row.quoteNo,
      customerId: `mock-customer-${index + 1}`,
      customerName: row.client,
      title: row.product,
      serviceDate: row.issueDate,
      serviceDateLabel: row.issueDate,
      validUntil: row.validUntil,
      validUntilLabel: row.validUntil,
      status: mapQuoteStatusToCode(row.status),
      statusLabel: row.status,
      subtotalJpy: index === 0 ? 320000 : index === 1 ? 180000 : 540000,
      subtotalLabel: index === 0 ? "¥320,000" : index === 1 ? "¥180,000" : "¥540,000",
      totalCostJpy: index === 0 ? 214000 : index === 1 ? 128000 : 372000,
      totalCostLabel: index === 0 ? "¥214,000" : index === 1 ? "¥128,000" : "¥372,000",
      grossProfitLabel: index === 0 ? "¥106,000" : index === 1 ? "¥52,000" : "¥168,000",
      grossMarginLabel: index === 0 ? "33.1%" : index === 1 ? "28.9%" : "31.1%",
      notes: "当前为 mock 报价单档案，可继续补有效期、成本和客户反馈。",
      linkedOrderId: index === 2 ? "mock-order-from-quote-3" : null,
      linkedOrderNo: index === 2 ? "WIN-20260528-001" : null,
    }));
  }

  const supabase = await createClient();
  const [{ data, error }, { data: linkedOrders }] = await Promise.all([
    supabase
    .from("quotations")
    .select("id,quote_no,customer_id,title,service_date,valid_until,status,subtotal_jpy,total_cost_jpy,gross_profit_jpy,gross_margin_rate,notes,customer:customers(company_name)")
    .order("updated_at", { ascending: false })
    .limit(100),
    supabase.from("orders").select("id,order_no,quote_id").not("quote_id", "is", null),
  ]);

  if (error || !data) {
    return [];
  }

  const linkedOrderMap = new Map<string, { id: string; order_no: string }>();
  for (const order of (linkedOrders as Array<{ id: string; order_no: string; quote_id: string | null }> | null) ?? []) {
    if (order.quote_id) {
      linkedOrderMap.set(order.quote_id, { id: order.id, order_no: order.order_no });
    }
  }

  return data.map((row: any) => ({
    id: row.id,
    quoteNo: row.quote_no,
    customerId: row.customer_id,
    customerName: row.customer?.company_name ?? "未关联客户",
    title: row.title,
    serviceDate: row.service_date ?? "",
    serviceDateLabel: row.service_date ? formatMonthDay(new Date(`${row.service_date}T00:00:00`)) : "未设置",
    validUntil: row.valid_until ?? "",
    validUntilLabel: row.valid_until ? formatMonthDay(new Date(`${row.valid_until}T00:00:00`)) : "未设置",
    status: row.status,
    statusLabel: mapQuoteStatus(row.status),
    subtotalJpy: Number(row.subtotal_jpy ?? 0),
    subtotalLabel: formatCurrency(Number(row.subtotal_jpy ?? 0)),
    totalCostJpy: Number(row.total_cost_jpy ?? 0),
    totalCostLabel: formatCurrency(Number(row.total_cost_jpy ?? 0)),
    grossProfitLabel: formatCurrency(Number(row.gross_profit_jpy ?? 0)),
    grossMarginLabel: `${Number(row.gross_margin_rate ?? 0).toFixed(1)}%`,
    notes: row.notes ?? "",
    linkedOrderId: linkedOrderMap.get(row.id)?.id ?? null,
    linkedOrderNo: linkedOrderMap.get(row.id)?.order_no ?? null,
  }));
}

export async function getProfitOperationsRecords(): Promise<ProfitOperationsRecord[]> {
  const { enabled, orders } = getRepositories();

  if (!enabled) {
    return profitRows.map((row, index) => ({
      id: `mock-profit-${index + 1}`,
      orderNo: `WIN-2026052${index + 1}-00${index + 1}`,
      project: row.project,
      customerName: customerRows[index % customerRows.length]?.company ?? "未关联客户",
      serviceDate: `2026-05-2${index + 1}`,
      serviceDateLabel: `5/2${index + 1}`,
      status: index === 0 ? "completed" : index === 1 ? "in_progress" : "scheduled",
      statusLabel: index === 0 ? "已完成" : index === 1 ? "进行中" : "已排车",
      revenueJpy: parseCurrencyLabel(row.revenue),
      revenueLabel: row.revenue,
      totalCostJpy: parseCurrencyLabel(row.cost),
      totalCostLabel: row.cost,
      grossProfitJpy: parseCurrencyLabel(row.profit),
      grossProfitLabel: row.profit,
      grossMarginRate: Number(row.margin.replace("%", "")),
      grossMarginLabel: row.margin,
      costBreakdown: [
        { category: "vehicle", categoryLabel: "车辆", amountJpy: 86000, amountLabel: "¥86,000" },
        { category: "driver", categoryLabel: "司机", amountJpy: 48000, amountLabel: "¥48,000" },
        { category: "guide", categoryLabel: "导游", amountJpy: 42000, amountLabel: "¥42,000" },
        { category: "misc", categoryLabel: "其他", amountJpy: Math.max(parseCurrencyLabel(row.cost) - 176000, 0), amountLabel: formatCurrency(Math.max(parseCurrencyLabel(row.cost) - 176000, 0)) },
      ],
    }));
  }

  const supabase = await createClient();
  const orderData = await orders.list({ limit: 100 });

  if (!orderData.length) {
    return [];
  }

  const orderIds = orderData.map((order) => order.id);
  const [{ data: relationRows }, { data: tripCosts }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,order_no,service_date,status,customer:customers(company_name)")
      .in("id", orderIds),
    supabase.from("trip_costs").select("id,order_id,category,amount_jpy").in("order_id", orderIds),
  ]);

  const relationMap = new Map<string, { order_no: string; service_date: string | null; status: string; customerName: string }>();
  for (const row of (relationRows as Array<any> | null) ?? []) {
    relationMap.set(row.id, {
      order_no: row.order_no,
      service_date: row.service_date,
      status: row.status,
      customerName: row.customer?.company_name ?? "未关联客户",
    });
  }

  const costMap = new Map<string, Map<string, number>>();
  for (const cost of (tripCosts as Array<any> | null) ?? []) {
    const byCategory = costMap.get(cost.order_id) ?? new Map<string, number>();
    byCategory.set(cost.category, (byCategory.get(cost.category) ?? 0) + Number(cost.amount_jpy ?? 0));
    costMap.set(cost.order_id, byCategory);
  }

  return orderData.map((order) => {
    const relation = relationMap.get(order.id);
    const serviceDate = relation?.service_date ?? order.service_date ?? "";
    const serviceDateLabel = serviceDate ? formatMonthDay(new Date(`${serviceDate}T00:00:00`)) : "未设置";
    const breakdown = Array.from((costMap.get(order.id) ?? new Map()).entries()).map(([category, amount]) => ({
      category,
      categoryLabel: mapTripCostCategory(category),
      amountJpy: amount,
      amountLabel: formatCurrency(amount),
    }));

    return {
      id: order.id,
      orderNo: relation?.order_no ?? order.order_no,
      project: order.title,
      customerName: relation?.customerName ?? "未关联客户",
      serviceDate,
      serviceDateLabel,
      status: relation?.status ?? order.status,
      statusLabel: mapOrderStatus(relation?.status ?? order.status),
      revenueJpy: Number(order.revenue_jpy ?? 0),
      revenueLabel: formatCurrency(Number(order.revenue_jpy ?? 0)),
      totalCostJpy: Number(order.total_cost_jpy ?? 0),
      totalCostLabel: formatCurrency(Number(order.total_cost_jpy ?? 0)),
      grossProfitJpy: Number(order.gross_profit_jpy ?? 0),
      grossProfitLabel: formatCurrency(Number(order.gross_profit_jpy ?? 0)),
      grossMarginRate: Number(order.gross_margin_rate ?? 0),
      grossMarginLabel: `${Number(order.gross_margin_rate ?? 0).toFixed(1)}%`,
      costBreakdown: breakdown.sort((left, right) => right.amountJpy - left.amountJpy),
    } satisfies ProfitOperationsRecord;
  });
}

export async function getProfitWorkbenchRows(): Promise<UiRow[]> {
  const { enabled, orders } = getRepositories();

  if (!enabled) {
    return profitRows;
  }

  const data = await orders.list({ limit: 50 });

  if (!data.length) {
    return profitRows;
  }

  return data.map((row) => ({
    project: row.title,
    revenue: formatCurrency(Number(row.revenue_jpy ?? 0)),
    cost: formatCurrency(Number(row.total_cost_jpy ?? 0)),
    profit: formatCurrency(Number(row.gross_profit_jpy ?? 0)),
    margin: `${Number(row.gross_margin_rate ?? 0).toFixed(1)}%`,
    status: mapProfitStatus(row.status),
  }));
}

export async function getOrderSummaryItems(): Promise<SummaryItem[]> {
  const { enabled, orders } = getRepositories();

  if (!enabled) {
    return orderSummary;
  }

  const data = await orders.list({ limit: 200 });

  if (!data.length) {
    return orderSummary;
  }

  const pendingConfirmation = data.filter((item) => item.status === "pending_confirmation").length;
  const scheduled = data.filter((item) => item.status === "scheduled").length;
  const thisWeekDepartures = data.filter((item) => isDateWithinDays(item.service_date, 7)).length;
  const openOrders = data.filter((item) => !["completed", "cancelled"].includes(item.status)).length;

  return [
    { title: "待确认订单", value: `${formatNumber(pendingConfirmation)} 单`, detail: "优先补齐航班、人数与接送时间" },
    { title: "已排车订单", value: `${formatNumber(scheduled)} 单`, detail: "车辆已锁定，可继续补司机与导游信息" },
    { title: "本周出团", value: `${formatNumber(thisWeekDepartures)} 单`, detail: "按未来 7 天服务日期自动统计" },
    { title: "待跟进订单", value: `${formatNumber(openOrders)} 单`, detail: "包含待确认、已排车和进行中的订单" },
  ];
}

export async function getFleetSummaryItems(): Promise<SummaryItem[]> {
  const { enabled, vehicles } = getRepositories();

  if (!enabled) {
    return fleetSummary;
  }

  const data = await vehicles.list({ limit: 200 });

  if (!data.length) {
    return fleetSummary;
  }

  const ownedVehicles = data.filter((item) => item.owner_type === "owned").length;
  const partnerVehicles = data.filter((item) => item.owner_type === "partner").length;
  const inspectionAlerts = data.filter((item) => isDateWithinDays(item.inspection_due_on, 7)).length;
  const dispatchableVehicles = data.filter((item) => item.status === "available").length;

  return [
    { title: "自有车辆", value: `${formatNumber(ownedVehicles)} 台`, detail: "已纳入内部台账与点检周期管理" },
    { title: "合作车辆", value: `${formatNumber(partnerVehicles)} 台`, detail: "高峰期可作为补位调度资源" },
    { title: "本周保养预警", value: `${formatNumber(inspectionAlerts)} 台`, detail: "未来 7 天内到期的点检或保养提醒" },
    { title: "今日可调度", value: `${formatNumber(dispatchableVehicles)} 台`, detail: "当前状态为可调度的车辆资源" },
  ];
}

export async function getCustomerSummaryItems(): Promise<SummaryItem[]> {
  const { enabled, customers } = getRepositories();

  if (!enabled) {
    return customerSummary;
  }

  const data = await customers.list({ limit: 200 });

  const longTermCustomers = data.filter((item) => item.customer_type === "long_term").length;
  const shortTermCustomers = data.filter((item) => item.customer_type === "short_term").length;
  const oneTimeCustomers = data.filter((item) => item.customer_type === "one_time").length;
  const newThisMonth = data.filter((item) => isInCurrentMonth(item.created_at)).length;

  return [
    { title: "长期合作", value: `${formatNumber(longTermCustomers)} 家`, detail: "适合持续制定服务标准与合作任务" },
    { title: "短期合作", value: `${formatNumber(shortTermCustomers)} 家`, detail: "按项目或阶段性需求维护完整档案" },
    { title: "一次性客户", value: `${formatNumber(oneTimeCustomers)} 家`, detail: "完成后保留资料，未来可随时重新调出" },
    { title: "本月新增", value: `${formatNumber(newThisMonth)} 家`, detail: "按客户建档时间自动统计" },
  ];
}

export async function getDriverSummaryItems(): Promise<SummaryItem[]> {
  const { enabled, drivers } = getRepositories();

  if (!enabled) {
    return driverSummary;
  }

  const data = await drivers.list({ limit: 200 });

  if (!data.length) {
    return driverSummary;
  }

  const availableDrivers = data.filter((item) => item.status === "available").length;
  const chineseSpeakingDrivers = data.filter((item) => item.languages.some((language) => language.includes("中文"))).length;
  const offDutyDrivers = data.filter((item) => item.status === "off_duty").length;
  const averageAttendanceDays =
    data.reduce((sum, item) => sum + Number(item.attendance_days_monthly ?? 0), 0) / Math.max(data.length, 1);
  const boundVehicles = data.filter((item) => Boolean(item.default_vehicle_id)).length;

  return [
    { title: "可派单司机", value: `${formatNumber(availableDrivers)} 人`, detail: `其中 ${formatNumber(chineseSpeakingDrivers)} 人可执行中文接待` },
    { title: "休假中", value: `${formatNumber(offDutyDrivers)} 人`, detail: "旺季排班前建议提前确认替补资源" },
    { title: "本月平均出勤", value: `${averageAttendanceDays.toFixed(1)} 天`, detail: "基于司机档案中的月度出勤天数" },
    { title: "默认车辆已绑定", value: `${formatNumber(boundVehicles)} 人`, detail: "排班时可自动带入常用车辆，并允许按日修改" },
  ];
}

export async function getGuideSummaryItems(): Promise<SummaryItem[]> {
  const { enabled, guides } = getRepositories();

  if (!enabled) {
    return guideSummary;
  }

  const data = await guides.list({ limit: 200 });

  if (!data.length) {
    return guideSummary;
  }

  const schedulableGuides = data.filter((item) => item.status === "available").length;
  const chineseSpeakingGuides = data.filter((item) => item.languages.some((language) => language.includes("中文"))).length;
  const topRatedGuides = data.filter((item) => Number(item.rating ?? 0) >= 4.8).length;
  const assignedGuides = data.filter((item) => item.status === "assigned").length;
  const missingCredentials = data.filter((item) => !item.license_type).length;

  return [
    { title: "可排班导游", value: `${formatNumber(schedulableGuides)} 人`, detail: `其中 ${formatNumber(chineseSpeakingGuides)} 人可服务中文市场` },
    { title: "高分导游", value: `${formatNumber(topRatedGuides)} 人`, detail: "评分 4.8 以上，适合高端团或重点客户" },
    { title: "当前已排班", value: `${formatNumber(assignedGuides)} 人`, detail: "按导游档案中的当前状态实时统计" },
    { title: "待补资质", value: `${formatNumber(missingCredentials)} 人`, detail: "尚未填写执照或资质信息的导游档案" },
  ];
}

export async function getPricingSummaryItems(): Promise<SummaryItem[]> {
  const { enabled, quotes } = getRepositories();

  if (!enabled) {
    return pricingSummary;
  }

  const data = await quotes.list({ limit: 200 });

  const pendingQuotes = data.filter((item) => ["draft", "sent"].includes(item.status)).length;
  const createdThisWeek = data.filter((item) => isDateWithinDays(item.created_at, 7)).length;
  const acceptedQuotes = data.filter((item) => item.status === "accepted").length;
  const acceptanceRate = (acceptedQuotes / Math.max(data.length, 1)) * 100;
  const expectedAmount = data
    .filter((item) => ["draft", "sent", "accepted"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.subtotal_jpy ?? 0), 0);

  return [
    { title: "待确认报价", value: `${formatNumber(pendingQuotes)} 份`, detail: "包含草稿和已发送、待客户回复的报价" },
    { title: "本周新建", value: `${formatNumber(createdThisWeek)} 份`, detail: "按最近 7 天新增报价自动统计" },
    { title: "平均成交率", value: `${acceptanceRate.toFixed(1)}%`, detail: "基于当前报价单状态估算整体转化" },
    { title: "预计签单额", value: formatCurrency(expectedAmount), detail: "含待确认、已发送与已接受报价的预计金额" },
  ];
}

export async function getProfitSummaryItems(): Promise<SummaryItem[]> {
  const { enabled, orders } = getRepositories();

  if (!enabled) {
    return profitSummary;
  }

  const data = await orders.list({ limit: 200 });

  const totalRevenue = data.reduce((sum, item) => sum + Number(item.revenue_jpy ?? 0), 0);
  const totalCost = data.reduce((sum, item) => sum + Number(item.total_cost_jpy ?? 0), 0);
  const totalProfit = data.reduce((sum, item) => sum + Number(item.gross_profit_jpy ?? 0), 0);
  const averageMargin =
    data.reduce((sum, item) => sum + Number(item.gross_margin_rate ?? 0), 0) / Math.max(data.length, 1);

  return [
    { title: "本月总营收", value: formatCurrency(totalRevenue), detail: "按当前订单收入字段实时汇总" },
    { title: "本月总成本", value: formatCurrency(totalCost), detail: "含车辆、人力及其他订单成本累计" },
    { title: "本月毛利润", value: formatCurrency(totalProfit), detail: "订单毛利润字段合计后的当前结果" },
    { title: "平均毛利率", value: `${averageMargin.toFixed(1)}%`, detail: "基于当前订单毛利率字段实时计算" },
  ];
}

export async function getRoleManagementProfiles(): Promise<Profile[]> {
  const { enabled, profiles } = getRepositories();

  if (!enabled) {
    return teamProfiles;
  }

  const data = await profiles.list({ limit: 50 });

  if (!data.length) {
    return teamProfiles;
  }

  return data;
}

export async function getSettingsWorkspaceSnapshot(): Promise<SettingsWorkspaceSnapshot> {
  const fallback = buildMockSettingsWorkspaceSnapshot();
  const { enabled } = getRepositories();

  if (!enabled) {
    return fallback;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, content")
    .in("key", ["company_profile", "notification_rules", "operations_policy"]);

  if (error || !data) {
    return fallback;
  }

  const settingMap = new Map<string, any>();
  for (const row of data as Array<{ key: string; content: unknown }>) {
    settingMap.set(row.key, row.content ?? {});
  }

  const companyProfile = settingMap.get("company_profile") ?? {};
  const notificationRules = settingMap.get("notification_rules") ?? {};
  const operationsPolicy = settingMap.get("operations_policy") ?? {};

  return {
    companyProfile: {
      companyName: readStringSetting(companyProfile.companyName, fallback.companyProfile.companyName),
      brandName: readStringSetting(companyProfile.brandName, fallback.companyProfile.brandName),
      officeAddress: readStringSetting(companyProfile.officeAddress, fallback.companyProfile.officeAddress),
      settlementEntity: readStringSetting(companyProfile.settlementEntity, fallback.companyProfile.settlementEntity),
      supportEmail: readStringSetting(companyProfile.supportEmail, fallback.companyProfile.supportEmail),
      supportPhone: readStringSetting(companyProfile.supportPhone, fallback.companyProfile.supportPhone),
    },
    notificationRules: {
      orderStatusAlerts: readBooleanSetting(notificationRules.orderStatusAlerts, fallback.notificationRules.orderStatusAlerts),
      vehicleInspectionAlerts: readBooleanSetting(notificationRules.vehicleInspectionAlerts, fallback.notificationRules.vehicleInspectionAlerts),
      quoteExpiryAlerts: readBooleanSetting(notificationRules.quoteExpiryAlerts, fallback.notificationRules.quoteExpiryAlerts),
      customerCreditAlerts: readBooleanSetting(notificationRules.customerCreditAlerts, fallback.notificationRules.customerCreditAlerts),
      reminderLeadDays: readNumberSetting(notificationRules.reminderLeadDays, fallback.notificationRules.reminderLeadDays),
    },
    operationsPolicy: {
      defaultCurrency: readStringSetting(operationsPolicy.defaultCurrency, fallback.operationsPolicy.defaultCurrency),
      targetGrossMarginRate: readNumberSetting(operationsPolicy.targetGrossMarginRate, fallback.operationsPolicy.targetGrossMarginRate),
      dailyTourDefaultStartTime: readStringSetting(
        operationsPolicy.dailyTourDefaultStartTime,
        fallback.operationsPolicy.dailyTourDefaultStartTime,
      ),
      conflictStrictMode: readBooleanSetting(operationsPolicy.conflictStrictMode, fallback.operationsPolicy.conflictStrictMode),
      autoMarkScheduledOnAssignment: readBooleanSetting(
        operationsPolicy.autoMarkScheduledOnAssignment,
        fallback.operationsPolicy.autoMarkScheduledOnAssignment,
      ),
    },
  };
}

export async function getDashboardStats(): Promise<Stat[]> {
  const { enabled, orders } = getRepositories();

  if (!enabled) {
    return dashboardStats;
  }

  const data = await orders.list({ limit: 200 });

  if (!data.length) {
    return dashboardStats;
  }

  const totalOrders = data.length;
  const inProgress = data.filter((item) => ["scheduled", "in_progress"].includes(item.status)).length;
  const pending = data.filter((item) => item.status === "pending_confirmation").length;
  const totalRevenue = data.reduce((sum, item) => sum + Number(item.revenue_jpy ?? 0), 0);
  const avgMargin =
    data.reduce((sum, item) => sum + Number(item.gross_margin_rate ?? 0), 0) / Math.max(data.length, 1);

  return [
    { title: "本月订单数", value: String(totalOrders), change: "实时统计", tone: "positive", href: "/orders" },
    {
      title: "进行中行程",
      value: String(inProgress),
      change: `${pending} 个待确认`,
      tone: pending > 0 ? "warning" : "neutral",
      href: "/orders?status=进行中",
    },
    { title: "本月营收", value: formatCurrency(totalRevenue), change: "实时汇总", tone: "positive", href: "/finance" },
    { title: "平均毛利率", value: `${avgMargin.toFixed(1)}%`, change: "实时计算", tone: "positive", href: "/profit" },
  ];
}

export async function getDashboardSnapshots(): Promise<SnapshotItem[]> {
  const fallback = operationsSnapshots.map((item) => ({
    ...item,
    href: item.title === "在途车辆" ? "/fleet?status=已派出" : item.title === "待处理报价" ? "/pricing?status=待确认" : "/orders",
  }));
  const { enabled, vehicles, quotes } = getRepositories();

  if (!enabled) {
    return fallback;
  }

  const [orderData, vehicleData, quoteData] = await Promise.all([
    getOrderOperationsRecords(),
    vehicles.list({ limit: 100 }),
    quotes.list({ limit: 100 }),
  ]);

  if (!orderData.length && !vehicleData.length && !quoteData.length) {
    return fallback;
  }

  const activeOrders = orderData.filter((item) => !["completed", "cancelled"].includes(item.status)).length;
  const pendingOrders = orderData.filter((item) => item.status === "pending_confirmation" || item.status === "draft").length;
  const activeVehicles = vehicleData.filter((item) => item.status === "available" || item.status === "assigned").length;
  const assignedVehicles = vehicleData.filter((item) => item.status === "assigned").length;
  const maintenanceVehicles = vehicleData.filter((item) => item.status === "maintenance").length;
  const pendingQuotes = quoteData.filter((item) => ["draft", "sent"].includes(item.status)).length;
  const expiringQuotes = quoteData.filter((item) => item.valid_until).length;

  return [
    {
      title: "订单运转",
      value: `${formatNumber(activeOrders)} 单`,
      note: `其中待确认 ${formatNumber(pendingOrders)} 单`,
      href: "/orders?status=待确认",
    },
    {
      title: "在途车辆",
      value: `${formatNumber(assignedVehicles || activeVehicles)} 台`,
      note: `保养中 ${formatNumber(maintenanceVehicles)} 台`,
      href: assignedVehicles > 0 ? "/fleet?status=已派出" : "/fleet",
    },
    {
      title: "待处理报价",
      value: `${formatNumber(pendingQuotes)} 份`,
      note: `有效期内 ${formatNumber(expiringQuotes)} 份`,
      href: "/pricing?status=待确认",
    },
  ];
}

export async function getDashboardPipelineCards(): Promise<DashboardPipelineCard[]> {
  const records = await getOrderOperationsRecords();

  const pendingCount = records.filter((record) => record.status === "draft" || record.status === "pending_confirmation").length;
  const scheduledCount = records.filter((record) => record.status === "scheduled").length;
  const thisWeekCount = records.filter(
    (record) => record.serviceDate && !["cancelled", "completed"].includes(record.status) && isDateWithinDays(record.serviceDate, 7),
  ).length;
  const maxCount = Math.max(pendingCount, scheduledCount, thisWeekCount, 1);

  return [
    {
      phase: "待确认",
      count: formatNumber(pendingCount),
      detail: "客户确认 / 航班信息补全",
      href: "/orders?status=待确认",
      progress: calculateDashboardProgress(pendingCount, maxCount),
    },
    {
      phase: "已排资源",
      count: formatNumber(scheduledCount),
      detail: "车辆、司机与导游已锁定",
      href: "/orders?status=已排车",
      progress: calculateDashboardProgress(scheduledCount, maxCount),
    },
    {
      phase: "本周出团",
      count: formatNumber(thisWeekCount),
      detail: "点击进入运营日历追溯每日细节",
      href: "/calendar",
      progress: calculateDashboardProgress(thisWeekCount, maxCount),
    },
  ];
}

export async function getDashboardFocusItems(reminderLeadDays = 3): Promise<DashboardFocusItem[]> {
  const reminders = await getOperationsReminderSnapshot(reminderLeadDays);

  if (reminders.items.length) {
    return reminders.items.slice(0, 3).map((item) => ({
      time: item.dateLabel,
      title: item.title,
      description: item.detail,
      href: item.href,
    }));
  }

  return [
    {
      time: "今日",
      title: "暂无紧急提醒",
      description: "近期待出团、报价到期和车辆点检队列暂时没有高优先级事项。",
      href: "/calendar",
    },
    {
      time: "订单",
      title: "复核订单工作台",
      description: "可以继续检查待确认订单、排车状态和成本录入情况。",
      href: "/orders",
    },
    {
      time: "资源",
      title: "查看车辆与排班",
      description: "进入车辆或日历页面确认本周运力安排是否足够。",
      href: "/fleet",
    },
  ];
}

export async function getDashboardActionItems(): Promise<DashboardActionItem[]> {
  const [orders, quotations, vehicles] = await Promise.all([
    getOrderOperationsRecords(),
    getPricingOperationsRecords(),
    getVehicleOperationsRecords(),
  ]);

  const pendingOrders = orders.filter((record) => record.status === "draft" || record.status === "pending_confirmation").length;
  const thisWeekTours = orders.filter(
    (record) => record.serviceDate && !["cancelled", "completed"].includes(record.status) && isDateWithinDays(record.serviceDate, 7),
  ).length;
  const pendingQuotes = quotations.filter((record) => record.status === "draft" || record.status === "sent").length;
  const maintenanceVehicles = vehicles.filter((record) => record.status === "maintenance").length;

  return [
    {
      title: "处理待确认订单",
      description: "优先补齐航班、人数、接送时间和客户确认状态。",
      href: "/orders?status=待确认",
      meta: `${formatNumber(pendingOrders)} 单`,
    },
    {
      title: "打开运营日历",
      description: "按日期追溯订单、车辆、司机、导游、成本和运营留痕。",
      href: "/calendar",
      meta: `${formatNumber(thisWeekTours)} 个本周行程`,
    },
    {
      title: "跟进待处理报价",
      description: "查看草稿与已发送报价，推动报价转订单。",
      href: "/pricing?status=待确认",
      meta: `${formatNumber(pendingQuotes)} 份`,
    },
    {
      title: "检查车辆状态",
      description: "确认已派出、保养中和可调度车辆是否满足后续出团需求。",
      href: maintenanceVehicles > 0 ? "/fleet?status=保养中" : "/fleet",
      meta: `${formatNumber(maintenanceVehicles)} 台保养中`,
    },
  ];
}

export async function getDashboardProfitSeries(): Promise<ProfitPoint[]> {
  const { enabled, orders } = getRepositories();

  if (!enabled) {
    return monthlyProfit;
  }

  const data = await orders.list({ limit: 200 });

  if (!data.length) {
    return monthlyProfit;
  }

  const grouped = new Map<string, { revenue: number; cost: number }>();

  for (const item of data) {
    const label = item.service_date ? new Date(item.service_date).toLocaleString("en-US", { month: "short" }) : "N/A";
    const current = grouped.get(label) ?? { revenue: 0, cost: 0 };
    current.revenue += Number(item.revenue_jpy ?? 0) / 1000000;
    current.cost += Number(item.total_cost_jpy ?? 0) / 1000000;
    grouped.set(label, current);
  }

  const result = Array.from(grouped.entries()).map(([label, value]) => ({
    label,
    revenue: Number(value.revenue.toFixed(1)),
    cost: Number(value.cost.toFixed(1)),
  }));

  return result.length ? result : monthlyProfit;
}

export async function getDashboardRecentOrders(): Promise<UiRow[]> {
  const rows = await getOrderWorkbenchRows();
  return rows.slice(0, 5);
}

export async function getCalendarSummaryItems(): Promise<SummaryItem[]> {
  const records = await getOrderOperationsRecords();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonthRecords = records.filter((record) => {
    if (!record.serviceDate) return false;
    const target = new Date(`${record.serviceDate}T00:00:00`);
    return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
  });

  const activeDays = new Set(thisMonthRecords.map((record) => record.serviceDate)).size;
  const pendingCount = thisMonthRecords.filter((record) => record.status === "pending_confirmation").length;
  const scheduledCount = thisMonthRecords.filter((record) => record.status === "scheduled").length;
  const totalRevenue = thisMonthRecords.reduce((sum, record) => sum + record.revenueJpy, 0);

  return [
    { title: "本月有团日期", value: `${formatNumber(activeDays)} 天`, detail: "方便快速追溯每天的排班、车辆和服务细节" },
    { title: "待确认日程", value: `${formatNumber(pendingCount)} 单`, detail: "优先补齐尚未落定的接机、用车和服务安排" },
    { title: "已排车日程", value: `${formatNumber(scheduledCount)} 单`, detail: "可直接按日期追踪车辆、司机和导游分配情况" },
    { title: "本月日历营收", value: formatCurrency(totalRevenue), detail: "按当前月份日历中的订单收入实时汇总" },
  ];
}

export async function getOperationsCalendarSnapshot(): Promise<OperationsCalendarSnapshot> {
  const records = await getOrderOperationsRecords();

  const datedRecords = records.filter((record) => record.serviceDate);
  const todayLabel = formatTokyoDateKey();
  const defaultMonth = todayLabel.slice(0, 7);

  return {
    today: todayLabel,
    defaultMonth,
    events: datedRecords
      .sort((left, right) => left.serviceDate.localeCompare(right.serviceDate) || left.orderNo.localeCompare(right.orderNo))
      .map((record) => ({
        id: record.id,
        date: record.serviceDate,
        orderNo: record.orderNo,
        customerId: record.customerId,
        title: record.title,
        customerName: record.customerName,
        status: record.status,
        statusLabel: record.statusLabel,
        assigneeId: record.assigneeId,
        assigneeName: record.assigneeName,
        vehicleId: record.vehicleId,
        vehicleName: record.vehicleName,
        driverId: record.driverId,
        driverName: record.driverName,
        guideId: record.guideId,
        guideName: record.guideName,
        revenueJpy: record.revenueJpy,
        revenueLabel: record.revenueLabel,
        totalCostJpy: record.totalCostJpy,
        totalCostLabel: record.totalCostLabel,
        grossProfitLabel: record.grossProfitLabel,
        notes: record.notes,
      })),
  };
}

export async function getOperationsReminderSnapshot(reminderLeadDays = 3): Promise<OperationsReminderSnapshot> {
  const [orders, quotations, vehicles] = await Promise.all([
    getOrderOperationsRecords(),
    getPricingOperationsRecords(),
    getVehicleOperationsRecords(),
  ]);

  const items: OperationsReminderItem[] = [];

  for (const order of orders) {
    if (
      order.serviceDate &&
      order.status !== "completed" &&
      order.status !== "cancelled" &&
      isDateWithinDays(order.serviceDate, reminderLeadDays)
    ) {
      items.push({
        id: `order-${order.id}`,
        category: "order",
        categoryLabel: "订单提醒",
        title: `${order.orderNo} 即将出团`,
        detail: `${order.customerName} · ${order.title}，当前状态 ${order.statusLabel}，请确认排车与服务人员安排。`,
        date: order.serviceDate,
        dateLabel: formatDateDetail(order.serviceDate),
        tone: order.status === "scheduled" || order.status === "in_progress" ? "info" : "warning",
        href: `/orders?focus=${order.id}`,
      });
    }
  }

  for (const quotation of quotations) {
    if (
      quotation.validUntil &&
      (quotation.status === "draft" || quotation.status === "sent") &&
      isDateWithinDays(quotation.validUntil, reminderLeadDays)
    ) {
      items.push({
        id: `quote-${quotation.id}`,
        category: "quote",
        categoryLabel: "报价提醒",
        title: `${quotation.quoteNo} 即将到期`,
        detail: `${quotation.customerName} · ${quotation.title}，当前状态 ${quotation.statusLabel}，建议尽快跟进确认。`,
        date: quotation.validUntil,
        dateLabel: formatDateDetail(quotation.validUntil),
        tone: "warning",
        href: "/pricing",
      });
    }
  }

  for (const vehicle of vehicles) {
    if (vehicle.inspectionDueOn && isDateWithinDays(vehicle.inspectionDueOn, reminderLeadDays)) {
      items.push({
        id: `vehicle-${vehicle.id}`,
        category: "vehicle",
        categoryLabel: "车辆提醒",
        title: `${vehicle.plateNumber} 点检即将到期`,
        detail: `${vehicle.label} · ${vehicle.vehicleType}，当前状态 ${vehicle.statusLabel}，建议提前安排保养与替补车辆。`,
        date: vehicle.inspectionDueOn,
        dateLabel: formatDateDetail(vehicle.inspectionDueOn),
        tone: vehicle.status === "maintenance" ? "neutral" : "info",
        href: "/fleet",
      });
    }
  }

  items.sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title));

  return {
    items,
    counts: {
      order: items.filter((item) => item.category === "order").length,
      quote: items.filter((item) => item.category === "quote").length,
      vehicle: items.filter((item) => item.category === "vehicle").length,
    },
  };
}

export async function getFinanceOrderOptions(): Promise<OrderCreateOption[]> {
  const records = await getOrderOperationsRecords();

  return records
    .filter((record) => record.status !== "cancelled" && record.revenueJpy > 0)
    .map((record) => ({
      id: record.id,
      label: `${record.orderNo} · ${record.customerName}`,
      hint: record.title,
    }));
}

export async function getPaymentReceiptRecords(): Promise<PaymentReceiptRecord[]> {
  const { enabled } = getRepositories();

  if (!enabled) {
    return buildMockPaymentReceiptRecords();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_receipts")
    .select(
      `
        id,
        order_id,
        customer_id,
        received_on,
        amount_jpy,
        method,
        status,
        reference_no,
        notes,
        order:orders(order_no,service_date,title),
        customer:customers(company_name)
      `,
    )
    .order("received_on", { ascending: false })
    .limit(200);

  if (error || !data) {
    return [];
  }

  return (data as Array<any>).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    orderNo: row.order?.order_no ?? "未关联订单",
    customerId: row.customer_id,
    customerName: row.customer?.company_name ?? "未关联客户",
    title: row.order?.title ?? "未命名订单",
    serviceDate: row.order?.service_date ?? "",
    serviceDateLabel: row.order?.service_date ? formatDateDetail(row.order.service_date) : "未设置",
    receivedOn: row.received_on,
    receivedOnLabel: formatDateDetail(row.received_on),
    amountJpy: Number(row.amount_jpy ?? 0),
    amountLabel: formatCurrency(Number(row.amount_jpy ?? 0)),
    method: row.method,
    methodLabel: mapPaymentMethod(row.method),
    status: row.status,
    statusLabel: mapPaymentReceiptStatus(row.status),
    referenceNo: row.reference_no ?? "",
    notes: row.notes ?? "",
  }));
}

export async function getSupplierPaymentRecords(): Promise<SupplierPaymentRecord[]> {
  const { enabled } = getRepositories();

  if (!enabled) {
    return buildMockSupplierPaymentRecords();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplier_payments")
    .select(
      `
        id,
        order_id,
        supplier_name,
        category,
        paid_on,
        amount_jpy,
        method,
        status,
        reference_no,
        notes,
        order:orders(order_no,customer:customers(company_name))
      `,
    )
    .order("paid_on", { ascending: false })
    .limit(200);

  if (error || !data) {
    return [];
  }

  return (data as Array<any>).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    orderNo: row.order?.order_no ?? "未关联订单",
    customerName: row.order?.customer?.company_name ?? "未关联客户",
    supplierName: row.supplier_name,
    category: row.category,
    categoryLabel: mapCostCategory(row.category),
    paidOn: row.paid_on,
    paidOnLabel: formatDateDetail(row.paid_on),
    amountJpy: Number(row.amount_jpy ?? 0),
    amountLabel: formatCurrency(Number(row.amount_jpy ?? 0)),
    method: row.method,
    methodLabel: mapPaymentMethod(row.method),
    status: row.status,
    statusLabel: mapSupplierPaymentStatus(row.status),
    referenceNo: row.reference_no ?? "",
    notes: row.notes ?? "",
  }));
}

export async function getFinanceReceivableRecords(): Promise<FinanceReceivableRecord[]> {
  const [orders, receipts, customers] = await Promise.all([
    getOrderOperationsRecords(),
    getPaymentReceiptRecords(),
    getCustomerOperationsRecords(),
  ]);

  const receiptTotals = new Map<string, number>();

  for (const receipt of receipts) {
    if (receipt.status === "pending") {
      continue;
    }
    receiptTotals.set(receipt.orderId, (receiptTotals.get(receipt.orderId) ?? 0) + receipt.amountJpy);
  }

  return orders
    .filter((order) => order.status !== "cancelled" && order.revenueJpy > 0)
    .map((order) => {
      const receivedJpy = receiptTotals.get(order.id) ?? 0;
      const outstandingJpy = Math.max(order.revenueJpy - receivedJpy, 0);
      const customer = customers.find((item) => item.id === order.customerId);

      return {
        id: `receivable-${order.id}`,
        orderId: order.id,
        orderNo: order.orderNo,
        customerId: order.customerId,
        customerName: order.customerName,
        title: order.title,
        serviceDate: order.serviceDate,
        serviceDateLabel: order.serviceDate ? formatDateDetail(order.serviceDate) : "未设置",
        billingTerms: customer?.billingTerms || "未设置账期",
        revenueJpy: order.revenueJpy,
        revenueLabel: order.revenueLabel,
        receivedJpy,
        receivedLabel: formatCurrency(receivedJpy),
        outstandingJpy,
        outstandingLabel: formatCurrency(outstandingJpy),
        agingLabel: resolveReceivableAgingLabel(order.serviceDate, outstandingJpy),
        statusLabel: outstandingJpy === 0 ? "已回款" : receivedJpy > 0 ? "部分回款" : "未回款",
      } satisfies FinanceReceivableRecord;
    })
    .sort((left, right) => right.outstandingJpy - left.outstandingJpy || left.serviceDate.localeCompare(right.serviceDate));
}

export async function getFinanceCustomerStatementRecords(): Promise<FinanceCustomerStatementRecord[]> {
  const [receivables, receipts] = await Promise.all([getFinanceReceivableRecords(), getPaymentReceiptRecords()]);
  return buildCustomerStatementRecords(receivables, receipts);
}

export async function getFinanceSummaryItems(): Promise<SummaryItem[]> {
  const [receivables, receipts, payments] = await Promise.all([
    getFinanceReceivableRecords(),
    getPaymentReceiptRecords(),
    getSupplierPaymentRecords(),
  ]);

  const totalOutstanding = receivables.reduce((sum, item) => sum + item.outstandingJpy, 0);
  const thisMonthReceived = receipts
    .filter((item) => item.status !== "pending" && isInCurrentMonth(item.receivedOn))
    .reduce((sum, item) => sum + item.amountJpy, 0);
  const thisMonthPaid = payments
    .filter((item) => item.status !== "pending" && isInCurrentMonth(item.paidOn))
    .reduce((sum, item) => sum + item.amountJpy, 0);
  const netCash = thisMonthReceived - thisMonthPaid;

  return [
    { title: "未回款总额", value: formatCurrency(totalOutstanding), detail: "按订单营收减去已确认回款后的当前余额" },
    { title: "本月已回款", value: formatCurrency(thisMonthReceived), detail: "只统计已到账或已对账状态的本月回款" },
    { title: "本月已付款", value: formatCurrency(thisMonthPaid), detail: "按供应商付款台账统计本月已支付金额" },
    { title: "本月净现金流", value: formatCurrency(netCash), detail: "用本月已回款减去本月已付款，帮助快速感知现金压力" },
  ];
}

function mapOrderStatus(status: string) {
  const statusMap: Record<string, string> = {
    draft: "草稿",
    pending_confirmation: "待确认",
    scheduled: "已排车",
    in_progress: "进行中",
    completed: "已完成",
    cancelled: "已取消",
  };

  return statusMap[status] ?? status;
}

function mapOrderStatusToCode(statusLabel: string) {
  const statusMap: Record<string, string> = {
    草稿: "draft",
    待确认: "pending_confirmation",
    已排车: "scheduled",
    进行中: "in_progress",
    已完成: "completed",
    已取消: "cancelled",
  };

  return statusMap[statusLabel] ?? "draft";
}

function mapVehicleStatus(status: string) {
  const statusMap: Record<string, string> = {
    available: "可调度",
    maintenance: "保养中",
    assigned: "已派出",
    inactive: "停用",
  };

  return statusMap[status] ?? status;
}

function mapVehicleStatusToCode(statusLabel: string) {
  const statusMap: Record<string, string> = {
    可调度: "available",
    保养中: "maintenance",
    已派出: "assigned",
    停用: "inactive",
  };

  return statusMap[statusLabel] ?? "available";
}

function mapCustomerStatus(status: string) {
  const statusMap: Record<string, string> = {
    active: "合作中",
    nurturing: "跟进中",
    settled: "已结清",
    inactive: "已停用",
  };

  return statusMap[status] ?? status;
}

function mapCustomerStatusToCode(statusLabel: string) {
  const statusMap: Record<string, string> = {
    合作中: "active",
    长期合作: "active",
    跟进中: "nurturing",
    已结清: "settled",
    已停用: "inactive",
  };

  return statusMap[statusLabel] ?? "active";
}

function mapCustomerType(type: string) {
  const typeMap: Record<string, string> = {
    long_term: "长期合作",
    short_term: "短期合作",
    one_time: "一次性客户",
  };

  return typeMap[type] ?? type;
}

function mapCollaborationTaskStatus(status: string) {
  const statusMap: Record<string, string> = {
    todo: "待处理",
    in_progress: "进行中",
    waiting: "等待客户",
    completed: "已完成",
    cancelled: "已取消",
  };

  return statusMap[status] ?? status;
}

function mapCollaborationTaskPriority(priority: string) {
  const priorityMap: Record<string, string> = {
    low: "低",
    normal: "普通",
    high: "高",
    urgent: "紧急",
  };

  return priorityMap[priority] ?? priority;
}

function mapContractType(contractType: string) {
  const contractMap: Record<string, string> = {
    full_time: "全职",
    part_time: "兼职",
    partner: "合作",
  };

  return contractMap[contractType] ?? contractType;
}

function mapStaffStatus(status: string) {
  const statusMap: Record<string, string> = {
    available: "可派单",
    assigned: "已排班",
    off_duty: "休假中",
    inactive: "停用",
  };

  return statusMap[status] ?? status;
}

function mapGuideStatus(status: string) {
  const label = mapStaffStatus(status);
  if (label === "可派单") return "待命中";
  if (label === "休假中") return "休息中";
  return label;
}

function mapStaffStatusToCode(statusLabel: string) {
  const statusMap: Record<string, string> = {
    可派单: "available",
    已排班: "assigned",
    休假中: "off_duty",
    停用: "inactive",
  };

  return statusMap[statusLabel] ?? "available";
}

function mapQuoteStatus(status: string) {
  const statusMap: Record<string, string> = {
    draft: "待确认",
    sent: "已发送",
    accepted: "已接受",
    expired: "已过期",
    rejected: "已拒绝",
  };

  return statusMap[status] ?? status;
}

function mapQuoteStatusToCode(statusLabel: string) {
  const statusMap: Record<string, string> = {
    待确认: "draft",
    已发送: "sent",
    已接受: "accepted",
    已过期: "expired",
    已拒绝: "rejected",
  };

  return statusMap[statusLabel] ?? "draft";
}

function buildMockDriverScheduleSnapshot(month: string): DriverScheduleSnapshot {
  const colors = ["#0f766e", "#2563eb", "#d97706", "#be123c", "#7c3aed"];
  const matchingOrders = orderRows.filter((order) => order.date.startsWith(month));
  const assignments: DriverScheduleAssignment[] = matchingOrders.map((order, index) => {
    const driverIndex = index % driverRows.length;
    const vehicleIndex = index % fleetRows.length;
    const day = new Date(`${order.date}T00:00:00`);

    return {
      id: `mock-order-${index + 1}`,
      date: order.date,
      dateLabel: formatMonthDay(day),
      weekdayLabel: formatWeekday(day),
      driverId: `mock-driver-${driverIndex + 1}`,
      driverName: driverRows[driverIndex]?.name ?? "未匹配司机",
      driverColor: colors[driverIndex] ?? "#64748b",
      vehicleId: `mock-vehicle-${vehicleIndex + 1}`,
      vehicleName: fleetRows[vehicleIndex]?.type ?? "待配车",
      vehiclePlateNumber: fleetRows[vehicleIndex]?.plateNo ?? "未配车",
      orderNo: order.orderNo,
      routeTitle: order.itinerary,
      statusLabel: order.status,
    };
  });

  const scheduleDays = buildMonthDateList(month).map((date) => {
    const day = new Date(`${date}T00:00:00`);
    return {
      date,
      dateLabel: formatMonthDay(day),
      weekdayLabel: formatWeekday(day),
      assignments: assignments.filter((item) => item.date === date),
    };
  });

  const fairnessRecords = driverRows.map((row, index) => {
    const driverId = `mock-driver-${index + 1}`;
    const driverAssignments = assignments.filter((item) => item.driverId === driverId);
    const assignedDays = new Set(driverAssignments.map((item) => item.date)).size;
    const routeCount = driverAssignments.length;

    return {
      id: driverId,
      name: row.name,
      language: row.language,
      contractLabel: row.contract,
      displayColor: colors[index] ?? "#64748b",
      defaultVehicleLabel: fleetRows[index % fleetRows.length]?.plateNo ?? "未绑定",
      monthlyAttendanceDays: `${assignedDays} 天`,
      assignedDays,
      routeCount,
      ...resolveFairnessState(assignedDays, routeCount),
    };
  });

  const routeLogs = assignments
    .map((assignment) => ({
      id: assignment.id,
      driverId: assignment.driverId,
      date: assignment.date,
      dateLabel: assignment.dateLabel,
      routeTitle: assignment.routeTitle,
      orderNo: assignment.orderNo,
      statusLabel: assignment.statusLabel,
      vehicleName: assignment.vehicleName,
      vehiclePlateNumber: assignment.vehiclePlateNumber,
    }))
    .sort((left, right) => right.date.localeCompare(left.date));

  return {
    month,
    monthLabel: formatMonthLabel(month),
    scheduleDays,
    fairnessRecords,
    routeLogs,
    dispatchCandidates: matchingOrders.map((order, index) => ({
      orderId: `mock-order-${index + 1}`,
      orderNo: order.orderNo,
      routeTitle: order.itinerary,
      serviceDate: order.date,
      serviceDateLabel: formatMonthDay(new Date(`${order.date}T00:00:00`)),
      statusLabel: order.status,
      currentDriverName: assignments[index]?.driverName ?? "待分配",
      currentVehicleName: assignments[index]?.vehiclePlateNumber ?? "待配车",
    })),
    driverOptions: driverRows.map((row, index) => ({
      id: `mock-driver-${index + 1}`,
      label: row.name,
      hint: fleetRows[index % fleetRows.length]?.plateNo ?? "未绑定默认车辆",
    })),
    vehicleOptions: fleetRows.map((row, index) => ({
      id: `mock-vehicle-${index + 1}`,
      label: row.plateNo,
      hint: row.type,
    })),
  };
}

function buildMockDriverIncidentLogs(seed: number): DriverIncidentLog[] {
  return [
    {
      id: `mock-incident-${seed}-1`,
      occurredOn: "2026-06-02",
      dateLabel: "2026/06/02",
      severity: seed === 4 ? "major" : "minor",
      severityLabel: seed === 4 ? "较严重" : "轻微",
      title: seed === 4 ? "停车场倒车擦碰" : "无人员受伤的轻微擦碰",
      description: "已完成现场确认和内部复盘，等待关闭记录。",
      status: "reviewed",
      statusLabel: "已复盘",
      orderNo: "未关联订单",
    },
  ];
}

function buildMockGuideServiceLogs(seed: number): GuideServiceLog[] {
  return [
    {
      id: `mock-guide-service-${seed}-1`,
      dateLabel: "2026-05-27",
      note: "完成东京市区一日游带团，客户反馈讲解清晰、节奏稳定。",
    },
    {
      id: `mock-guide-service-${seed}-2`,
      dateLabel: "2026-05-20",
      note: "执行企业会奖接待，临场协助餐厅与景点衔接顺畅。",
    },
  ];
}

function buildMockCustomerFollowLogs(seed: number): CustomerFollowLog[] {
  return [
    {
      id: `mock-customer-follow-${seed}-1`,
      dateLabel: "2026-05-26",
      note: "已确认暑期东京一日游需求，等待对方内部核预算。",
    },
    {
      id: `mock-customer-follow-${seed}-2`,
      dateLabel: "2026-05-18",
      note: "客户希望增加中文司机和购物点安排，销售已回传可选方案。",
    },
  ];
}

function buildMockCustomerCollaborationTasks(seed: number): CustomerCollaborationTaskRecord[] {
  return [
    {
      id: `mock-customer-task-${seed}-1`,
      title: seed % 2 === 0 ? "确认巴士 Wi-Fi 配置" : "准备中文接待资料",
      description: seed % 2 === 0 ? "确认执行车辆可提供稳定 Wi-Fi，并在出团前回传连接方式。" : "整理中文行程单、集合点地图和紧急联系方式。",
      status: seed % 2 === 0 ? "in_progress" : "todo",
      statusLabel: seed % 2 === 0 ? "进行中" : "待处理",
      priority: "high",
      priorityLabel: "高",
      dueOn: "2026-06-18",
      dueOnLabel: "2026年6月18日",
    },
  ];
}

function buildMockCustomerOrderTimeline(seed: number, companyName: string): CustomerOrderTimelineEntry[] {
  const baseDate = new Date(`2026-05-${String(10 + seed).padStart(2, "0")}T00:00:00`);

  return [
    {
      id: `mock-customer-order-${seed}-1`,
      orderNo: `WIN-2605${String(seed).padStart(2, "0")}-01`,
      title: `${companyName} 东京一日游`,
      serviceDate: baseDate.toISOString().slice(0, 10),
      serviceDateLabel: formatMonthDay(baseDate),
      statusLabel: "已排车",
      revenueLabel: formatCurrency(268000),
    },
    {
      id: `mock-customer-order-${seed}-2`,
      orderNo: `WIN-2605${String(seed).padStart(2, "0")}-02`,
      title: `${companyName} 富士山包车`,
      serviceDate: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      serviceDateLabel: formatMonthDay(new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000)),
      statusLabel: "已完成",
      revenueLabel: formatCurrency(198000),
    },
  ];
}

function buildMockCustomerQuoteEntries(seed: number, companyName: string): CustomerQuoteEntry[] {
  const baseDate = new Date(`2026-06-${String(3 + seed).padStart(2, "0")}T00:00:00`);

  return [
    {
      id: `mock-customer-quote-${seed}-1`,
      quoteNo: `Q-WIN-2605${String(seed).padStart(2, "0")}-01`,
      title: `${companyName} 夏季东京团报价`,
      serviceDateLabel: formatMonthDay(baseDate),
      validUntilLabel: formatMonthDay(new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000)),
      statusLabel: "已发送",
      subtotalLabel: formatCurrency(320000),
    },
    {
      id: `mock-customer-quote-${seed}-2`,
      quoteNo: `Q-WIN-2605${String(seed).padStart(2, "0")}-02`,
      title: `${companyName} 企业会奖行程`,
      serviceDateLabel: formatMonthDay(new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000)),
      validUntilLabel: formatMonthDay(new Date(baseDate.getTime() + 24 * 24 * 60 * 60 * 1000)),
      statusLabel: "待确认",
      subtotalLabel: formatCurrency(560000),
    },
  ];
}

function parseCustomerFollowLogs(notes: string | null): CustomerFollowLog[] {
  if (!notes) {
    return [];
  }

  return notes
    .split("\n")
    .filter((line) => line.startsWith("[follow]"))
    .map((line, index) => {
      const match = line.match(/^\[follow\]\[(.+?)\]\s*(.+)$/);

      if (!match) {
        return null;
      }

      return {
        id: `follow-${index}-${match[1]}`,
        dateLabel: match[1],
        note: match[2],
      } satisfies CustomerFollowLog;
    })
    .filter(Boolean) as CustomerFollowLog[];
}

function mapDriverIncidentLog(row: any): DriverIncidentLog {
  const severityLabels = { minor: "轻微", major: "较严重", critical: "重大" } as const;
  const statusLabels = { open: "待处理", reviewed: "已复盘", closed: "已关闭" } as const;
  const order = Array.isArray(row.order) ? row.order[0] : row.order;

  return {
    id: row.id,
    occurredOn: row.occurred_on,
    dateLabel: row.occurred_on ? String(row.occurred_on).replaceAll("-", "/") : "未记录",
    severity: row.severity,
    severityLabel: severityLabels[row.severity as keyof typeof severityLabels] ?? row.severity,
    title: row.title,
    description: row.description,
    status: row.status,
    statusLabel: statusLabels[row.status as keyof typeof statusLabels] ?? row.status,
    orderNo: order?.order_no ?? "未关联订单",
  };
}

function parseGuideServiceLogs(notes: string | null): GuideServiceLog[] {
  if (!notes) {
    return [];
  }

  return notes
    .split("\n")
    .filter((line) => line.startsWith("[service]"))
    .map((line, index) => {
      const match = line.match(/^\[service\]\[(.+?)\]\s*(.+)$/);

      if (!match) {
        return null;
      }

      return {
        id: `guide-service-${index}-${match[1]}`,
        dateLabel: match[1],
        note: match[2],
      } satisfies GuideServiceLog;
    })
    .filter(Boolean) as GuideServiceLog[];
}

function readStringSetting(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readBooleanSetting(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function readNumberSetting(value: unknown, fallback: number) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function buildMockGuideScheduleSnapshot(): GuideScheduleSnapshot {
  const assignments: GuideScheduleAssignment[] = [
    {
      id: "mock-guide-route-1",
      date: "2026-05-28",
      dateLabel: "5/28",
      weekdayLabel: "Thu",
      guideId: "mock-guide-1",
      guideName: "佐藤美纪",
      orderNo: "WIN-20260528-001",
      routeTitle: "Tokyo Highlights Day Tour",
      statusLabel: "已排车",
    },
    {
      id: "mock-guide-route-2",
      date: "2026-05-29",
      dateLabel: "5/29",
      weekdayLabel: "Fri",
      guideId: "mock-guide-2",
      guideName: "松本优子",
      orderNo: "WIN-20260529-002",
      routeTitle: "Mt. Fuji Premium Day Tour",
      statusLabel: "待确认",
    },
  ];

  const uniqueDates = Array.from(new Set(assignments.map((item) => item.date)));
  const scheduleDays = uniqueDates.map((date) => ({
    date,
    dateLabel: assignments.find((item) => item.date === date)?.dateLabel ?? date,
    weekdayLabel: assignments.find((item) => item.date === date)?.weekdayLabel ?? "",
    assignments: assignments.filter((item) => item.date === date),
  }));

  return {
    scheduleDays,
    routeLogs: assignments
      .map((assignment) => ({
        id: assignment.id,
        guideId: assignment.guideId,
        date: assignment.date,
        dateLabel: assignment.dateLabel,
        routeTitle: assignment.routeTitle,
        orderNo: assignment.orderNo,
        statusLabel: assignment.statusLabel,
      }))
      .sort((left, right) => right.date.localeCompare(left.date)),
    dispatchCandidates: [
      {
        orderId: "mock-order-guide-1",
        orderNo: "WIN-20260530-001",
        routeTitle: "Narita Arrival Support",
        serviceDate: "2026-05-30",
        serviceDateLabel: "5/30",
        statusLabel: "待确认",
        currentGuideName: "待分配",
      },
      {
        orderId: "mock-order-guide-2",
        orderNo: "WIN-20260531-002",
        routeTitle: "Corporate Tokyo Program",
        serviceDate: "2026-05-31",
        serviceDateLabel: "5/31",
        statusLabel: "已排车",
        currentGuideName: "佐藤美纪",
      },
    ],
  };
}

function buildMockSettingsWorkspaceSnapshot(): SettingsWorkspaceSnapshot {
  return {
    companyProfile: {
      companyName: "WINS International Travel Group",
      brandName: "WINS",
      officeAddress: "Tokyo Office, Shinjuku-ku, Tokyo",
      settlementEntity: "WINS International Travel Group Japan",
      supportEmail: "ops@winskokusai.com",
      supportPhone: "+81-3-0000-0000",
    },
    notificationRules: {
      orderStatusAlerts: true,
      vehicleInspectionAlerts: true,
      quoteExpiryAlerts: true,
      customerCreditAlerts: true,
      reminderLeadDays: 3,
    },
    operationsPolicy: {
      defaultCurrency: "JPY",
      targetGrossMarginRate: 28,
      dailyTourDefaultStartTime: "08:30",
      conflictStrictMode: true,
      autoMarkScheduledOnAssignment: true,
    },
  };
}

function resolveFairnessState(assignedDays: number, routeCount: number) {
  if (routeCount >= 3 || assignedDays >= 3) {
    return {
      fairnessLabel: "本周较忙",
      fairnessTone: "busy" as const,
    };
  }

  if (routeCount <= 1 && assignedDays <= 1) {
    return {
      fairnessLabel: "可补排班",
      fairnessTone: "light" as const,
    };
  }

  return {
    fairnessLabel: "较为均衡",
    fairnessTone: "balanced" as const,
  };
}

function formatMonthDay(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(value);
}

function normalizeMonthInput(value?: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  return formatTokyoDateKey().slice(0, 7);
}

function getMonthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    startDate: `${month}-01`,
    endDate: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function buildMonthDateList(month: string) {
  const { startDate, endDate } = getMonthBounds(month);
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    dates.push(`${month}-${String(current.getDate()).padStart(2, "0")}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${year} 年 ${monthNumber} 月`;
}

function formatTokyoDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? String(value.getFullYear());
  const month = parts.find((part) => part.type === "month")?.value ?? String(value.getMonth() + 1).padStart(2, "0");
  const day = parts.find((part) => part.type === "day")?.value ?? String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatWeekday(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(value);
}

function mapProfitStatus(status: string) {
  const statusMap: Record<string, string> = {
    draft: "正常",
    pending_confirmation: "正常",
    scheduled: "正常",
    in_progress: "盈利中",
    completed: "盈利中",
    cancelled: "已取消",
  };

  return statusMap[status] ?? status;
}

function mapTripCostCategory(category: string) {
  const categoryMap: Record<string, string> = {
    vehicle: "车辆",
    driver: "司机",
    guide: "导游",
    hotel: "酒店",
    meal: "餐食",
    ticket: "门票",
    misc: "其他",
  };

  return categoryMap[category] ?? category;
}

function isDateWithinDays(dateString: string | null | undefined, days: number) {
  if (!dateString) {
    return false;
  }

  const target = new Date(dateString);

  if (Number.isNaN(target.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);

  return target >= today && target <= end;
}

function calculateDashboardProgress(value: number, maxValue: number) {
  if (maxValue <= 0 || value <= 0) {
    return 12;
  }

  return Math.min(100, Math.max(18, Math.round((value / maxValue) * 88)));
}

function isInCurrentMonth(dateString: string | null | undefined) {
  if (!dateString) {
    return false;
  }

  const target = new Date(dateString);

  if (Number.isNaN(target.getTime())) {
    return false;
  }

  const today = new Date();

  return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
}

function mapCostCategory(category: string) {
  const categoryMap: Record<string, string> = {
    vehicle: "车辆",
    driver: "司机",
    guide: "导游",
    hotel: "酒店",
    meal: "餐食",
    ticket: "门票",
    misc: "杂费",
  };

  return categoryMap[category] ?? category;
}

function buildMockOrderOperationsRecords(): OrderOperationsRecord[] {
  return orderRows.map((row, index) => {
    const customerIndex = Math.max(
      customerRows.findIndex((customer) => customer.company === row.customer),
      0,
    );
    const resourceIndex = index % Math.max(fleetRows.length, 1);
    const driverIndex = index % Math.max(driverRows.length, 1);
    const guideIndex = index % Math.max(guideRows.length, 1);
    const assignee = teamProfiles.find((profile) => profile.full_name === row.assignee) ?? teamProfiles[index % teamProfiles.length];
    const revenueJpy = parseCurrencyLabel(row.amount);
    const totalCostJpy = Math.round(revenueJpy * 0.677);

    return {
      id: `mock-order-${index + 1}`,
      orderNo: row.orderNo,
      customerId: `mock-customer-${customerIndex + 1}`,
      customerName: row.customer,
      title: row.itinerary,
      serviceDate: row.date,
      assigneeId: assignee?.id ?? null,
      assigneeName: row.assignee,
      vehicleId: `mock-vehicle-${resourceIndex + 1}`,
      vehicleName: fleetRows[resourceIndex]?.plateNo ?? "待分配",
      driverId: `mock-driver-${driverIndex + 1}`,
      driverName: driverRows[driverIndex]?.name ?? "待分配",
      guideId: `mock-guide-${guideIndex + 1}`,
      guideName: guideRows[guideIndex]?.name ?? "待分配",
      status: mapOrderStatusToCode(row.status),
      statusLabel: row.status,
      revenueJpy,
      revenueLabel: row.amount,
      totalCostJpy,
      totalCostLabel: formatCurrency(totalCostJpy),
      grossProfitLabel: formatCurrency(revenueJpy - totalCostJpy),
      archivedAt: row.archivedAt ?? null,
      archiveCode: row.archiveCode ?? null,
      archiveSummary: row.archiveSummary ?? "",
      archiveKeywords: row.archiveKeywords ?? "",
      notes: row.notes ?? "当前为 2026-06 演示订单，可继续测试排车、派导游、成本、回款和日历功能。",
    };
  });
}

function buildMockPaymentReceiptRecords(): PaymentReceiptRecord[] {
  const orders = buildMockOrderOperationsRecords();

  return orders.slice(0, 4).map((order, index) => {
    const status = index === 0 ? "reconciled" : index === 1 ? "received" : index === 2 ? "pending" : "received";
    const ratio = index === 0 ? 1 : index === 1 ? 0.55 : index === 2 ? 0.35 : 0.2;
    const receivedOn = shiftDate(order.serviceDate || "2026-05-29", index + 1);

    return {
      id: `mock-receipt-${index + 1}`,
      orderId: order.id,
      orderNo: order.orderNo,
      customerId: order.customerId,
      customerName: order.customerName,
      title: order.title,
      serviceDate: order.serviceDate,
      serviceDateLabel: order.serviceDate ? formatDateDetail(order.serviceDate) : "未设置",
      receivedOn,
      receivedOnLabel: formatDateDetail(receivedOn),
      amountJpy: Math.round(order.revenueJpy * ratio),
      amountLabel: formatCurrency(Math.round(order.revenueJpy * ratio)),
      method: index % 2 === 0 ? "bank_transfer" : "credit_card",
      methodLabel: index % 2 === 0 ? "银行转账" : "信用卡",
      status,
      statusLabel: mapPaymentReceiptStatus(status),
      referenceNo: `RCPT-202605-${String(index + 1).padStart(3, "0")}`,
      notes: status === "pending" ? "客户已承诺本周内付款，待财务确认到账。" : "已完成第一版回款登记。",
    };
  });
}

function buildMockSupplierPaymentRecords(): SupplierPaymentRecord[] {
  const orders = buildMockOrderOperationsRecords();

  return orders.slice(0, 4).map((order, index) => {
    const status = index === 0 ? "reconciled" : index === 1 ? "paid" : index === 2 ? "pending" : "paid";
    const category = ["vehicle", "guide", "hotel", "meal"][index] ?? "misc";
    const paidOn = shiftDate(order.serviceDate || "2026-05-29", index + 2);

    return {
      id: `mock-supplier-payment-${index + 1}`,
      orderId: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      supplierName: index === 0 ? "Tokyo Partner Bus" : index === 1 ? "佐藤 美纪" : index === 2 ? "Shinjuku Hotel Desk" : "Asakusa Meal Partner",
      category,
      categoryLabel: mapCostCategory(category),
      paidOn,
      paidOnLabel: formatDateDetail(paidOn),
      amountJpy: Math.round(order.totalCostJpy * (index === 0 ? 0.42 : index === 1 ? 0.26 : index === 2 ? 0.18 : 0.14)),
      amountLabel: formatCurrency(Math.round(order.totalCostJpy * (index === 0 ? 0.42 : index === 1 ? 0.26 : index === 2 ? 0.18 : 0.14))),
      method: index % 2 === 0 ? "bank_transfer" : "credit_card",
      methodLabel: index % 2 === 0 ? "银行转账" : "信用卡",
      status,
      statusLabel: mapSupplierPaymentStatus(status),
      referenceNo: `PAY-202605-${String(index + 1).padStart(3, "0")}`,
      notes: status === "pending" ? "待财务确认月底统一付款。" : "已完成第一版付款登记。",
    };
  });
}

function buildCustomerStatementRecords(
  receivables: FinanceReceivableRecord[],
  receipts: PaymentReceiptRecord[],
): FinanceCustomerStatementRecord[] {
  const grouped = new Map<
    string,
    {
      customerName: string;
      orderCount: number;
      outstandingOrders: number;
      totalRevenueJpy: number;
      totalReceivedJpy: number;
      totalOutstandingJpy: number;
      lastReceiptDate: string;
    }
  >();

  for (const receivable of receivables) {
    const current = grouped.get(receivable.customerId) ?? {
      customerName: receivable.customerName,
      orderCount: 0,
      outstandingOrders: 0,
      totalRevenueJpy: 0,
      totalReceivedJpy: 0,
      totalOutstandingJpy: 0,
      lastReceiptDate: "",
    };

    current.orderCount += 1;
    current.totalRevenueJpy += receivable.revenueJpy;
    current.totalReceivedJpy += receivable.receivedJpy;
    current.totalOutstandingJpy += receivable.outstandingJpy;
    if (receivable.outstandingJpy > 0) {
      current.outstandingOrders += 1;
    }
    grouped.set(receivable.customerId, current);
  }

  for (const receipt of receipts) {
    const current = grouped.get(receipt.customerId);
    if (!current) {
      continue;
    }
    if (!current.lastReceiptDate || receipt.receivedOn > current.lastReceiptDate) {
      current.lastReceiptDate = receipt.receivedOn;
    }
  }

  return Array.from(grouped.entries())
    .map(([customerId, value]) => ({
      id: `statement-${customerId}`,
      customerId,
      customerName: value.customerName,
      orderCount: value.orderCount,
      outstandingOrders: value.outstandingOrders,
      totalRevenueJpy: value.totalRevenueJpy,
      totalRevenueLabel: formatCurrency(value.totalRevenueJpy),
      totalReceivedJpy: value.totalReceivedJpy,
      totalReceivedLabel: formatCurrency(value.totalReceivedJpy),
      totalOutstandingJpy: value.totalOutstandingJpy,
      totalOutstandingLabel: formatCurrency(value.totalOutstandingJpy),
      lastReceiptDateLabel: value.lastReceiptDate ? formatDateDetail(value.lastReceiptDate) : "暂无回款",
    }))
    .sort((left, right) => right.totalOutstandingJpy - left.totalOutstandingJpy || left.customerName.localeCompare(right.customerName));
}

function parseCurrencyLabel(value: string) {
  const numeric = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isNaN(numeric) ? 0 : numeric;
}

function formatDateDetail(value: string) {
  const target = new Date(`${value}T00:00:00`);

  if (Number.isNaN(target.getTime())) {
    return value;
  }

  return `${target.getMonth() + 1}/${target.getDate()}`;
}

function mapPaymentMethod(method: string) {
  const methodMap: Record<string, string> = {
    bank_transfer: "银行转账",
    cash: "现金",
    credit_card: "信用卡",
    other: "其他",
  };

  return methodMap[method] ?? method;
}

function mapPaymentReceiptStatus(status: string) {
  const statusMap: Record<string, string> = {
    pending: "待到账",
    received: "已到账",
    reconciled: "已对账",
  };

  return statusMap[status] ?? status;
}

function mapSupplierPaymentStatus(status: string) {
  const statusMap: Record<string, string> = {
    pending: "待付款",
    paid: "已付款",
    reconciled: "已对账",
  };

  return statusMap[status] ?? status;
}

function resolveReceivableAgingLabel(serviceDate: string | null | undefined, outstandingJpy: number) {
  if (!serviceDate) {
    return "未设日期";
  }

  if (outstandingJpy <= 0) {
    return "已结清";
  }

  const target = new Date(`${serviceDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(target.getTime())) {
    return "待核对";
  }

  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "未到期";
  }

  if (diffDays <= 7) {
    return `逾期 ${diffDays} 天`;
  }

  if (diffDays <= 30) {
    return "逾期 30 天内";
  }

  return "逾期 30 天以上";
}

function isPastDate(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const target = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(target.getTime())) {
    return false;
  }

  return target < today;
}

function shiftDate(value: string, days: number) {
  const target = new Date(`${value}T00:00:00`);

  if (Number.isNaN(target.getTime())) {
    return value;
  }

  target.setDate(target.getDate() + days);
  return target.toISOString().slice(0, 10);
}
