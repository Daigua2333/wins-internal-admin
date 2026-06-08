create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    active
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1), 'New User'),
    'operations',
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'operations' check (role in ('admin', 'operations', 'sales', 'finance', 'dispatch')),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), '');
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  contact_email text,
  contact_phone text,
  market_segment text not null,
  billing_terms text,
  credit_limit_jpy numeric(12, 0),
  status text not null default 'active' check (status in ('active', 'nurturing', 'settled', 'inactive')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null unique,
  label text not null,
  vehicle_type text not null,
  seat_capacity integer not null check (seat_capacity > 0),
  owner_type text not null check (owner_type in ('owned', 'partner')),
  inspection_due_on date,
  status text not null default 'available' check (status in ('available', 'maintenance', 'assigned', 'inactive')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  languages text[] not null default '{}',
  contract_type text not null check (contract_type in ('full_time', 'part_time', 'partner')),
  phone text,
  duty_hours_monthly numeric(6, 2) not null default 0,
  safety_score numeric(5, 2) not null default 100,
  status text not null default 'available' check (status in ('available', 'assigned', 'off_duty', 'inactive')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  languages text[] not null default '{}',
  specialties text[] not null default '{}',
  license_type text,
  rating numeric(3, 2),
  status text not null default 'available' check (status in ('available', 'assigned', 'off_duty', 'inactive')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_settings (
  key text primary key,
  category text not null,
  label text not null,
  content jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  title text not null,
  service_date date,
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'expired', 'rejected')),
  subtotal_jpy numeric(12, 0) not null default 0,
  total_cost_jpy numeric(12, 0) not null default 0,
  gross_profit_jpy numeric(12, 0) generated always as (subtotal_jpy - total_cost_jpy) stored,
  gross_margin_rate numeric(6, 2) generated always as (
    case
      when subtotal_jpy = 0 then 0
      else round(((subtotal_jpy - total_cost_jpy) / subtotal_jpy) * 100, 2)
    end
  ) stored,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  quote_id uuid references public.quotations(id) on delete set null,
  title text not null,
  service_date date,
  status text not null default 'draft' check (status in ('draft', 'pending_confirmation', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  assignee_profile_id uuid references public.profiles(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  guide_id uuid references public.guides(id) on delete set null,
  revenue_jpy numeric(12, 0) not null default 0,
  total_cost_jpy numeric(12, 0) not null default 0,
  gross_profit_jpy numeric(12, 0) generated always as (revenue_jpy - total_cost_jpy) stored,
  gross_margin_rate numeric(6, 2) generated always as (
    case
      when revenue_jpy = 0 then 0
      else round(((revenue_jpy - total_cost_jpy) / revenue_jpy) * 100, 2)
    end
  ) stored,
  archived_at timestamptz,
  archive_code text,
  archive_summary text,
  archive_keywords text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.orders add column if not exists archived_at timestamptz;
alter table public.orders add column if not exists archive_code text;
alter table public.orders add column if not exists archive_summary text;
alter table public.orders add column if not exists archive_keywords text;

create table if not exists public.trip_costs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  category text not null check (category in ('vehicle', 'driver', 'guide', 'hotel', 'meal', 'ticket', 'misc')),
  label text not null,
  amount_jpy numeric(12, 0) not null default 0,
  supplier_name text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  received_on date not null,
  amount_jpy numeric(12, 0) not null default 0,
  method text not null default 'bank_transfer' check (method in ('bank_transfer', 'cash', 'credit_card', 'other')),
  status text not null default 'received' check (status in ('pending', 'received', 'reconciled')),
  reference_no text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.supplier_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  supplier_name text not null,
  category text not null check (category in ('vehicle', 'driver', 'guide', 'hotel', 'meal', 'ticket', 'misc')),
  paid_on date not null,
  amount_jpy numeric(12, 0) not null default 0,
  method text not null default 'bank_transfer' check (method in ('bank_transfer', 'cash', 'credit_card', 'other')),
  status text not null default 'paid' check (status in ('pending', 'paid', 'reconciled')),
  reference_no text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_service_date on public.orders(service_date);
create unique index if not exists idx_orders_archive_code on public.orders(archive_code) where archive_code is not null;
create index if not exists idx_orders_archived_at on public.orders(archived_at) where archived_at is not null;
create index if not exists idx_orders_archive_service_date on public.orders(service_date) where archived_at is not null;
create index if not exists idx_quotations_customer_id on public.quotations(customer_id);
create index if not exists idx_trip_costs_order_id on public.trip_costs(order_id);
create index if not exists idx_payment_receipts_order_id on public.payment_receipts(order_id);
create index if not exists idx_payment_receipts_customer_id on public.payment_receipts(customer_id);
create index if not exists idx_supplier_payments_order_id on public.supplier_payments(order_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
drop trigger if exists set_vehicles_updated_at on public.vehicles;
create trigger set_vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();
drop trigger if exists set_drivers_updated_at on public.drivers;
create trigger set_drivers_updated_at before update on public.drivers for each row execute function public.set_updated_at();
drop trigger if exists set_guides_updated_at on public.guides;
create trigger set_guides_updated_at before update on public.guides for each row execute function public.set_updated_at();
drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at before update on public.app_settings for each row execute function public.set_updated_at();
drop trigger if exists set_quotations_updated_at on public.quotations;
create trigger set_quotations_updated_at before update on public.quotations for each row execute function public.set_updated_at();
drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
drop trigger if exists set_trip_costs_updated_at on public.trip_costs;
create trigger set_trip_costs_updated_at before update on public.trip_costs for each row execute function public.set_updated_at();
drop trigger if exists set_payment_receipts_updated_at on public.payment_receipts;
create trigger set_payment_receipts_updated_at before update on public.payment_receipts for each row execute function public.set_updated_at();
drop trigger if exists set_supplier_payments_updated_at on public.supplier_payments;
create trigger set_supplier_payments_updated_at before update on public.supplier_payments for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.guides enable row level security;
alter table public.app_settings enable row level security;
alter table public.quotations enable row level security;
alter table public.orders enable row level security;
alter table public.trip_costs enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.supplier_payments enable row level security;

drop policy if exists "authenticated_read_profiles" on public.profiles;
drop policy if exists "users_insert_own_profile" on public.profiles;
drop policy if exists "users_update_own_profile" on public.profiles;
drop policy if exists "admins_update_all_profiles" on public.profiles;
drop policy if exists "authenticated_read_customers" on public.customers;
drop policy if exists "role_write_customers" on public.customers;
drop policy if exists "role_update_customers" on public.customers;
drop policy if exists "authenticated_read_vehicles" on public.vehicles;
drop policy if exists "role_write_vehicles" on public.vehicles;
drop policy if exists "role_update_vehicles" on public.vehicles;
drop policy if exists "role_delete_vehicles" on public.vehicles;
drop policy if exists "authenticated_read_drivers" on public.drivers;
drop policy if exists "role_write_drivers" on public.drivers;
drop policy if exists "role_update_drivers" on public.drivers;
drop policy if exists "role_delete_drivers" on public.drivers;
drop policy if exists "authenticated_read_guides" on public.guides;
drop policy if exists "role_write_guides" on public.guides;
drop policy if exists "role_update_guides" on public.guides;
drop policy if exists "role_delete_guides" on public.guides;
drop policy if exists "admin_read_app_settings" on public.app_settings;
drop policy if exists "admin_write_app_settings" on public.app_settings;
drop policy if exists "admin_update_app_settings" on public.app_settings;
drop policy if exists "authenticated_read_quotations" on public.quotations;
drop policy if exists "role_write_quotations" on public.quotations;
drop policy if exists "role_update_quotations" on public.quotations;
drop policy if exists "authenticated_read_orders" on public.orders;
drop policy if exists "authenticated_read_trip_costs" on public.trip_costs;
drop policy if exists "role_write_orders" on public.orders;
drop policy if exists "role_update_orders" on public.orders;
drop policy if exists "role_delete_orders" on public.orders;
drop policy if exists "role_write_trip_costs" on public.trip_costs;
drop policy if exists "role_update_trip_costs" on public.trip_costs;
drop policy if exists "role_delete_trip_costs" on public.trip_costs;
drop policy if exists "authenticated_read_payment_receipts" on public.payment_receipts;
drop policy if exists "role_write_payment_receipts" on public.payment_receipts;
drop policy if exists "role_update_payment_receipts" on public.payment_receipts;
drop policy if exists "role_delete_payment_receipts" on public.payment_receipts;
drop policy if exists "authenticated_read_supplier_payments" on public.supplier_payments;
drop policy if exists "role_write_supplier_payments" on public.supplier_payments;
drop policy if exists "role_update_supplier_payments" on public.supplier_payments;
drop policy if exists "role_delete_supplier_payments" on public.supplier_payments;

create policy "authenticated_read_profiles" on public.profiles for select to authenticated using (true);
create policy "users_insert_own_profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "users_update_own_profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "admins_update_all_profiles" on public.profiles for update to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "authenticated_read_customers" on public.customers for select to authenticated using (true);
create policy "role_write_customers" on public.customers for insert to authenticated with check (public.current_app_role() in ('admin', 'operations', 'sales'));
create policy "role_update_customers" on public.customers for update to authenticated using (public.current_app_role() in ('admin', 'operations', 'sales')) with check (public.current_app_role() in ('admin', 'operations', 'sales'));
create policy "authenticated_read_vehicles" on public.vehicles for select to authenticated using (true);
create policy "role_write_vehicles" on public.vehicles for insert to authenticated with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_update_vehicles" on public.vehicles for update to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch')) with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_delete_vehicles" on public.vehicles for delete to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "authenticated_read_drivers" on public.drivers for select to authenticated using (true);
create policy "role_write_drivers" on public.drivers for insert to authenticated with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_update_drivers" on public.drivers for update to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch')) with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_delete_drivers" on public.drivers for delete to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "authenticated_read_guides" on public.guides for select to authenticated using (true);
create policy "role_write_guides" on public.guides for insert to authenticated with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_update_guides" on public.guides for update to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch')) with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_delete_guides" on public.guides for delete to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "admin_read_app_settings" on public.app_settings for select to authenticated using (public.current_app_role() = 'admin');
create policy "admin_write_app_settings" on public.app_settings for insert to authenticated with check (public.current_app_role() = 'admin');
create policy "admin_update_app_settings" on public.app_settings for update to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');
create policy "authenticated_read_quotations" on public.quotations for select to authenticated using (true);
create policy "role_write_quotations" on public.quotations for insert to authenticated with check (public.current_app_role() in ('admin', 'operations', 'sales'));
create policy "role_update_quotations" on public.quotations for update to authenticated using (public.current_app_role() in ('admin', 'operations', 'sales')) with check (public.current_app_role() in ('admin', 'operations', 'sales'));
create policy "authenticated_read_orders" on public.orders for select to authenticated using (true);
create policy "authenticated_read_trip_costs" on public.trip_costs for select to authenticated using (true);
create policy "role_write_orders" on public.orders for insert to authenticated with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_update_orders" on public.orders for update to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch')) with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_delete_orders" on public.orders for delete to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_write_trip_costs" on public.trip_costs for insert to authenticated with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_update_trip_costs" on public.trip_costs for update to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch')) with check (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "role_delete_trip_costs" on public.trip_costs for delete to authenticated using (public.current_app_role() in ('admin', 'operations', 'dispatch'));
create policy "authenticated_read_payment_receipts" on public.payment_receipts for select to authenticated using (true);
create policy "role_write_payment_receipts" on public.payment_receipts for insert to authenticated with check (public.current_app_role() in ('admin', 'finance'));
create policy "role_update_payment_receipts" on public.payment_receipts for update to authenticated using (public.current_app_role() in ('admin', 'finance')) with check (public.current_app_role() in ('admin', 'finance'));
create policy "role_delete_payment_receipts" on public.payment_receipts for delete to authenticated using (public.current_app_role() in ('admin', 'finance'));
create policy "authenticated_read_supplier_payments" on public.supplier_payments for select to authenticated using (true);
create policy "role_write_supplier_payments" on public.supplier_payments for insert to authenticated with check (public.current_app_role() in ('admin', 'finance'));
create policy "role_update_supplier_payments" on public.supplier_payments for update to authenticated using (public.current_app_role() in ('admin', 'finance')) with check (public.current_app_role() in ('admin', 'finance'));
create policy "role_delete_supplier_payments" on public.supplier_payments for delete to authenticated using (public.current_app_role() in ('admin', 'finance'));

-- TODO:
-- 1. Extend role-aware write policies to customers, quotations, vehicles and staff masters
-- 2. Add audit logs for sensitive updates
-- 3. Add seed data for development/staging
