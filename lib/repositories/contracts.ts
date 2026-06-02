import type { Customer, Driver, Guide, Order, Profile, Quote, TripCost, Vehicle } from "@/lib/types/domain";

export type ListOptions = {
  query?: string;
  status?: string;
  limit?: number;
};

export interface OrdersRepository {
  list(options?: ListOptions): Promise<Order[]>;
  getById(id: string): Promise<Order | null>;
}

export interface CustomersRepository {
  list(options?: ListOptions): Promise<Customer[]>;
  getById(id: string): Promise<Customer | null>;
}

export interface VehiclesRepository {
  list(options?: ListOptions): Promise<Vehicle[]>;
  getById(id: string): Promise<Vehicle | null>;
}

export interface DriversRepository {
  list(options?: ListOptions): Promise<Driver[]>;
  getById(id: string): Promise<Driver | null>;
}

export interface GuidesRepository {
  list(options?: ListOptions): Promise<Guide[]>;
  getById(id: string): Promise<Guide | null>;
}

export interface QuotesRepository {
  list(options?: ListOptions): Promise<Quote[]>;
  getById(id: string): Promise<Quote | null>;
}

export interface TripCostsRepository {
  listByOrderId(orderId: string): Promise<TripCost[]>;
}

export interface ProfilesRepository {
  list(options?: ListOptions): Promise<Profile[]>;
  getById(id: string): Promise<Profile | null>;
}
