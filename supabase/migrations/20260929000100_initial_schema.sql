create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

create type public.reservation_status as enum (
  'confirmed',
  'seated',
  'completed',
  'cancelled',
  'no_show'
);

create table public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  timezone text not null,
  reservation_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index restaurant_settings_singleton_idx
  on public.restaurant_settings ((true));

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  check ((is_closed and open_time is null and close_time is null)
    or (not is_closed and open_time is not null and close_time is not null and open_time < close_time)),
  unique (day_of_week)
);

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(btrim(code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  capacity integer not null check (capacity > 0),
  area text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  confirmation_code text not null unique,
  table_id uuid not null references public.restaurant_tables (id),
  customer_name text not null check (length(btrim(customer_name)) > 0),
  customer_phone text not null check (length(btrim(customer_phone)) > 0),
  customer_email text,
  party_size integer not null check (party_size > 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.reservation_status not null default 'confirmed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_at < end_at),
  exclude using gist (
    table_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status in ('confirmed', 'seated'))
);

create index reservations_start_at_idx on public.reservations (start_at);
create index reservations_table_id_idx on public.reservations (table_id);
create index reservations_status_idx on public.reservations (status);

alter table public.restaurant_settings enable row level security;
alter table public.opening_hours enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.reservations enable row level security;
alter table public.staff_users enable row level security;

create or replace function public.is_staff()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (select 1 from public.staff_users where user_id = (select auth.uid()));
$$;

grant execute on function public.is_staff() to anon, authenticated;

create policy "staff can read settings" on public.restaurant_settings
  for select to authenticated using ((select public.is_staff()));
create policy "staff can manage settings" on public.restaurant_settings
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff can manage opening hours" on public.opening_hours
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff can manage tables" on public.restaurant_tables
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff can manage reservations" on public.reservations
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff can read staff users" on public.staff_users
  for select to authenticated using ((select public.is_staff()));

revoke all on public.restaurant_settings, public.opening_hours, public.restaurant_tables,
  public.reservations, public.staff_users from anon;
revoke all on public.restaurant_settings, public.opening_hours, public.restaurant_tables,
  public.reservations, public.staff_users from authenticated;
grant select on public.restaurant_tables to anon;
grant select on public.restaurant_settings, public.opening_hours, public.restaurant_tables to authenticated;
grant select, insert, update on public.reservations to service_role;

create or replace function public.get_available_tables(
  requested_start_at timestamptz,
  requested_end_at timestamptz,
  requested_party_size integer
)
returns table (id uuid, code text, name text, capacity integer, area text)
language sql
stable
security invoker
set search_path = public
as $$
  -- Availability rules are intentionally scaffolded for the next implementation slice.
  select t.id, t.code, t.name, t.capacity, t.area
  from public.restaurant_tables t
  where false;
$$;

revoke execute on function public.get_available_tables(timestamptz, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.get_available_tables(timestamptz, timestamptz, integer) to service_role;
