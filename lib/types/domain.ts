export type AppRole = "admin" | "operations" | "sales" | "finance" | "dispatch";

export type OrderStatus = "draft" | "pending_confirmation" | "scheduled" | "in_progress" | "completed" | "cancelled";
export type VehicleStatus = "available" | "maintenance" | "assigned" | "inactive";
export type StaffStatus = "available" | "assigned" | "off_duty" | "inactive";
export type QuoteStatus = "draft" | "sent" | "accepted" | "expired" | "rejected";
export type CustomerStatus = "active" | "nurturing" | "settled" | "inactive";
export type PaymentReceiptMethod = "bank_transfer" | "cash" | "credit_card" | "other";
export type PaymentReceiptStatus = "pending" | "received" | "reconciled";
export type SupplierPaymentStatus = "pending" | "paid" | "reconciled";

export type TimestampFields = {
  created_at: string;
  updated_at: string;
};

export type Profile = TimestampFields & {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  phone: string | null;
  active: boolean;
};

export type Customer = TimestampFields & {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  market_segment: string;
  billing_terms: string | null;
  credit_limit_jpy: number | null;
  status: CustomerStatus;
  notes: string | null;
};

export type Vehicle = TimestampFields & {
  id: string;
  plate_number: string;
  label: string;
  vehicle_type: string;
  seat_capacity: number;
  owner_type: "owned" | "partner";
  inspection_due_on: string | null;
  status: VehicleStatus;
  notes: string | null;
};

export type Driver = TimestampFields & {
  id: string;
  profile_id: string | null;
  full_name: string;
  languages: string[];
  contract_type: "full_time" | "part_time" | "partner";
  phone: string | null;
  duty_hours_monthly: number;
  safety_score: number;
  status: StaffStatus;
  notes: string | null;
};

export type Guide = TimestampFields & {
  id: string;
  profile_id: string | null;
  full_name: string;
  languages: string[];
  specialties: string[];
  license_type: string | null;
  rating: number | null;
  status: StaffStatus;
  notes: string | null;
};

export type Quote = TimestampFields & {
  id: string;
  quote_no: string;
  customer_id: string;
  title: string;
  service_date: string | null;
  valid_until: string | null;
  status: QuoteStatus;
  subtotal_jpy: number;
  total_cost_jpy: number;
  gross_profit_jpy: number;
  gross_margin_rate: number;
  notes: string | null;
};

export type Order = TimestampFields & {
  id: string;
  order_no: string;
  customer_id: string;
  quote_id: string | null;
  title: string;
  service_date: string | null;
  status: OrderStatus;
  assignee_profile_id: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  guide_id: string | null;
  revenue_jpy: number;
  total_cost_jpy: number;
  gross_profit_jpy: number;
  gross_margin_rate: number;
  archived_at: string | null;
  archive_code: string | null;
  archive_summary: string | null;
  archive_keywords: string | null;
  notes: string | null;
};

export type TripCost = TimestampFields & {
  id: string;
  order_id: string;
  category: "vehicle" | "driver" | "guide" | "hotel" | "meal" | "ticket" | "misc";
  label: string;
  amount_jpy: number;
  supplier_name: string | null;
  notes: string | null;
};

export type AppSetting = TimestampFields & {
  key: string;
  category: string;
  label: string;
  content: Record<string, unknown>;
  active: boolean;
  notes: string | null;
};

export type PaymentReceipt = TimestampFields & {
  id: string;
  order_id: string;
  customer_id: string;
  received_on: string;
  amount_jpy: number;
  method: PaymentReceiptMethod;
  status: PaymentReceiptStatus;
  reference_no: string | null;
  notes: string | null;
};

export type SupplierPayment = TimestampFields & {
  id: string;
  order_id: string;
  supplier_name: string;
  category: "vehicle" | "driver" | "guide" | "hotel" | "meal" | "ticket" | "misc";
  paid_on: string;
  amount_jpy: number;
  method: PaymentReceiptMethod;
  status: SupplierPaymentStatus;
  reference_no: string | null;
  notes: string | null;
};
