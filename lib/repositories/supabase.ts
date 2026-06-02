import { createClient } from "@/lib/supabase/server";
import type { Customer, Driver, Guide, Order, Profile, Quote, Vehicle } from "@/lib/types/domain";
import type {
  CustomersRepository,
  DriversRepository,
  GuidesRepository,
  ListOptions,
  OrdersRepository,
  ProfilesRepository,
  QuotesRepository,
  VehiclesRepository,
} from "@/lib/repositories/contracts";

function applyListOptions<T extends { ilike: Function; eq: Function; limit: Function }>(
  query: T,
  options: ListOptions | undefined,
  searchColumn: string,
) {
  let nextQuery = query;

  if (options?.query) {
    nextQuery = nextQuery.ilike(searchColumn, `%${options.query}%`);
  }

  if (options?.status) {
    nextQuery = nextQuery.eq("status", options.status);
  }

  if (options?.limit) {
    nextQuery = nextQuery.limit(options.limit);
  }

  return nextQuery;
}

export const supabaseOrdersRepository: OrdersRepository = {
  async list(options) {
    const supabase = await createClient();
    const query = applyListOptions(
      supabase.from("orders").select("*").order("service_date", { ascending: true }),
      options,
      "title",
    );
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Order[];
  },
  async getById(id) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return data as Order | null;
  },
};

export const supabaseCustomersRepository: CustomersRepository = {
  async list(options) {
    const supabase = await createClient();
    const query = applyListOptions(
      supabase.from("customers").select("*").order("updated_at", { ascending: false }),
      options,
      "company_name",
    );
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Customer[];
  },
  async getById(id) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return data as Customer | null;
  },
};

export const supabaseVehiclesRepository: VehiclesRepository = {
  async list(options) {
    const supabase = await createClient();
    const query = applyListOptions(
      supabase.from("vehicles").select("*").order("updated_at", { ascending: false }),
      options,
      "plate_number",
    );
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Vehicle[];
  },
  async getById(id) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return data as Vehicle | null;
  },
};

export const supabaseDriversRepository: DriversRepository = {
  async list(options) {
    const supabase = await createClient();
    const query = applyListOptions(
      supabase.from("drivers").select("*").order("updated_at", { ascending: false }),
      options,
      "full_name",
    );
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Driver[];
  },
  async getById(id) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("drivers").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return data as Driver | null;
  },
};

export const supabaseGuidesRepository: GuidesRepository = {
  async list(options) {
    const supabase = await createClient();
    const query = applyListOptions(
      supabase.from("guides").select("*").order("updated_at", { ascending: false }),
      options,
      "full_name",
    );
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Guide[];
  },
  async getById(id) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("guides").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return data as Guide | null;
  },
};

export const supabaseQuotesRepository: QuotesRepository = {
  async list(options) {
    const supabase = await createClient();
    const query = applyListOptions(
      supabase.from("quotations").select("*").order("updated_at", { ascending: false }),
      options,
      "title",
    );
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Quote[];
  },
  async getById(id) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("quotations").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return data as Quote | null;
  },
};

export const supabaseProfilesRepository: ProfilesRepository = {
  async list(options) {
    const supabase = await createClient();
    const query = applyListOptions(
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      options,
      "email",
    );
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Profile[];
  },
  async getById(id) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return data as Profile | null;
  },
};
