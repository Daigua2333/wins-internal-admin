import type {
  CustomerStatus,
  OrderStatus,
  QuoteStatus,
  VehicleStatus,
  StaffStatus,
  AppRole,
  PaymentReceiptMethod,
  PaymentReceiptStatus,
  SupplierPaymentStatus,
} from "@/lib/types/domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: AppRole;
          phone: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: AppRole;
          phone?: string | null;
          active?: boolean;
        };
        Update: {
          email?: string;
          full_name?: string;
          role?: AppRole;
          phone?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      customers: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          market_segment: string;
          billing_terms?: string | null;
          credit_limit_jpy?: number | null;
          status?: CustomerStatus;
          notes?: string | null;
        };
        Update: {
          company_name?: string;
          contact_name?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          market_segment?: string;
          billing_terms?: string | null;
          credit_limit_jpy?: number | null;
          status?: CustomerStatus;
          notes?: string | null;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          plate_number: string;
          label: string;
          vehicle_type: string;
          seat_capacity: number;
          owner_type: "owned" | "partner";
          inspection_due_on: string | null;
          status: VehicleStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plate_number: string;
          label: string;
          vehicle_type: string;
          seat_capacity: number;
          owner_type: "owned" | "partner";
          inspection_due_on?: string | null;
          status?: VehicleStatus;
          notes?: string | null;
        };
        Update: {
          plate_number?: string;
          label?: string;
          vehicle_type?: string;
          seat_capacity?: number;
          owner_type?: "owned" | "partner";
          inspection_due_on?: string | null;
          status?: VehicleStatus;
          notes?: string | null;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          full_name: string;
          languages?: string[];
          contract_type: "full_time" | "part_time" | "partner";
          phone?: string | null;
          duty_hours_monthly?: number;
          safety_score?: number;
          status?: StaffStatus;
          notes?: string | null;
        };
        Update: {
          profile_id?: string | null;
          full_name?: string;
          languages?: string[];
          contract_type?: "full_time" | "part_time" | "partner";
          phone?: string | null;
          duty_hours_monthly?: number;
          safety_score?: number;
          status?: StaffStatus;
          notes?: string | null;
        };
        Relationships: [];
      };
      guides: {
        Row: {
          id: string;
          profile_id: string | null;
          full_name: string;
          languages: string[];
          specialties: string[];
          license_type: string | null;
          rating: number | null;
          status: StaffStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          full_name: string;
          languages?: string[];
          specialties?: string[];
          license_type?: string | null;
          rating?: number | null;
          status?: StaffStatus;
          notes?: string | null;
        };
        Update: {
          profile_id?: string | null;
          full_name?: string;
          languages?: string[];
          specialties?: string[];
          license_type?: string | null;
          rating?: number | null;
          status?: StaffStatus;
          notes?: string | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          category: string;
          label: string;
          content: Json;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          category: string;
          label: string;
          content?: Json;
          active?: boolean;
          notes?: string | null;
        };
        Update: {
          category?: string;
          label?: string;
          content?: Json;
          active?: boolean;
          notes?: string | null;
        };
        Relationships: [];
      };
      quotations: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quote_no: string;
          customer_id: string;
          title: string;
          service_date?: string | null;
          valid_until?: string | null;
          status?: QuoteStatus;
          subtotal_jpy?: number;
          total_cost_jpy?: number;
          gross_profit_jpy?: number;
          gross_margin_rate?: number;
          notes?: string | null;
        };
        Update: {
          quote_no?: string;
          customer_id?: string;
          title?: string;
          service_date?: string | null;
          valid_until?: string | null;
          status?: QuoteStatus;
          subtotal_jpy?: number;
          total_cost_jpy?: number;
          gross_profit_jpy?: number;
          gross_margin_rate?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_no: string;
          customer_id: string;
          quote_id?: string | null;
          title: string;
          service_date?: string | null;
          status?: OrderStatus;
          assignee_profile_id?: string | null;
          vehicle_id?: string | null;
          driver_id?: string | null;
          guide_id?: string | null;
          revenue_jpy?: number;
          total_cost_jpy?: number;
          gross_profit_jpy?: number;
          gross_margin_rate?: number;
          archived_at?: string | null;
          archive_code?: string | null;
          archive_summary?: string | null;
          archive_keywords?: string | null;
          notes?: string | null;
        };
        Update: {
          order_no?: string;
          customer_id?: string;
          quote_id?: string | null;
          title?: string;
          service_date?: string | null;
          status?: OrderStatus;
          assignee_profile_id?: string | null;
          vehicle_id?: string | null;
          driver_id?: string | null;
          guide_id?: string | null;
          revenue_jpy?: number;
          total_cost_jpy?: number;
          gross_profit_jpy?: number;
          gross_margin_rate?: number;
          archived_at?: string | null;
          archive_code?: string | null;
          archive_summary?: string | null;
          archive_keywords?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      trip_costs: {
        Row: {
          id: string;
          order_id: string;
          category: "vehicle" | "driver" | "guide" | "hotel" | "meal" | "ticket" | "misc";
          label: string;
          amount_jpy: number;
          supplier_name: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          category: "vehicle" | "driver" | "guide" | "hotel" | "meal" | "ticket" | "misc";
          label: string;
          amount_jpy?: number;
          supplier_name?: string | null;
          notes?: string | null;
        };
        Update: {
          order_id?: string;
          category?: "vehicle" | "driver" | "guide" | "hotel" | "meal" | "ticket" | "misc";
          label?: string;
          amount_jpy?: number;
          supplier_name?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      payment_receipts: {
        Row: {
          id: string;
          order_id: string;
          customer_id: string;
          received_on: string;
          amount_jpy: number;
          method: PaymentReceiptMethod;
          status: PaymentReceiptStatus;
          reference_no: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          customer_id: string;
          received_on: string;
          amount_jpy: number;
          method?: PaymentReceiptMethod;
          status?: PaymentReceiptStatus;
          reference_no?: string | null;
          notes?: string | null;
        };
        Update: {
          order_id?: string;
          customer_id?: string;
          received_on?: string;
          amount_jpy?: number;
          method?: PaymentReceiptMethod;
          status?: PaymentReceiptStatus;
          reference_no?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      supplier_payments: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          supplier_name: string;
          category: "vehicle" | "driver" | "guide" | "hotel" | "meal" | "ticket" | "misc";
          paid_on: string;
          amount_jpy: number;
          method?: PaymentReceiptMethod;
          status?: SupplierPaymentStatus;
          reference_no?: string | null;
          notes?: string | null;
        };
        Update: {
          order_id?: string;
          supplier_name?: string;
          category?: "vehicle" | "driver" | "guide" | "hotel" | "meal" | "ticket" | "misc";
          paid_on?: string;
          amount_jpy?: number;
          method?: PaymentReceiptMethod;
          status?: SupplierPaymentStatus;
          reference_no?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
