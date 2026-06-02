import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  supabaseCustomersRepository,
  supabaseDriversRepository,
  supabaseGuidesRepository,
  supabaseOrdersRepository,
  supabaseProfilesRepository,
  supabaseQuotesRepository,
  supabaseVehiclesRepository,
} from "@/lib/repositories/supabase";

export function getRepositories() {
  return {
    enabled: isSupabaseConfigured(),
    orders: supabaseOrdersRepository,
    customers: supabaseCustomersRepository,
    vehicles: supabaseVehiclesRepository,
    drivers: supabaseDriversRepository,
    guides: supabaseGuidesRepository,
    quotes: supabaseQuotesRepository,
    profiles: supabaseProfilesRepository,
  };
}
