create schema if not exists extensions;
create schema if not exists private;

revoke all on schema private from public;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

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
  timezone text not null check (length(btrim(timezone)) > 0),
  reservation_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index restaurant_settings_singleton_idx
  on public.restaurant_settings ((true));

create table public.opening_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null unique check (day_of_week between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  check (
    (is_closed and open_time is null and close_time is null)
    or
    (not is_closed and open_time is not null and close_time is not null and open_time < close_time)
  )
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
  confirmation_code text not null unique check (length(btrim(confirmation_code)) > 0),
  table_id uuid not null references public.restaurant_tables (id),
  customer_name text not null check (length(btrim(customer_name)) > 0),
  customer_phone text not null check (length(btrim(customer_phone)) > 0),
  customer_email text check (
    customer_email is null
    or customer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  ),
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
create index reservations_table_id_start_at_idx
  on public.reservations (table_id, start_at);
create index reservations_status_start_at_idx
  on public.reservations (status, start_at);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger restaurant_settings_set_updated_at
before update on public.restaurant_settings
for each row execute function private.set_updated_at();

create trigger restaurant_tables_set_updated_at
before update on public.restaurant_tables
for each row execute function private.set_updated_at();

create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function private.set_updated_at();

create or replace function private.validate_restaurant_timezone()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = new.timezone
  ) then
    raise exception using
      errcode = '23514',
      message = 'INVALID_TIMEZONE';
  end if;

  return new;
end;
$$;

create trigger restaurant_settings_validate_timezone
before insert or update of timezone on public.restaurant_settings
for each row execute function private.validate_restaurant_timezone();

create or replace function private.validate_table_capacity_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.capacity < old.capacity and exists (
    select 1
    from public.reservations r
    where r.table_id = old.id
      and r.status in ('confirmed', 'seated')
      and r.start_at >= now()
      and r.party_size > new.capacity
  ) then
    raise exception using
      errcode = '23514',
      message = 'TABLE_CAPACITY_CONFLICT';
  end if;

  return new;
end;
$$;

create trigger restaurant_tables_validate_capacity_change
before update of capacity on public.restaurant_tables
for each row execute function private.validate_table_capacity_change();

create or replace function private.validate_reservation_status()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'confirmed' then
      raise exception using
        errcode = '23514',
        message = 'INVALID_INITIAL_STATUS';
    end if;
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'confirmed' and new.status in ('seated', 'cancelled', 'no_show'))
    or
    (old.status = 'seated' and new.status in ('completed', 'cancelled'))
  ) then
    raise exception using
      errcode = '23514',
      message = 'INVALID_STATUS_TRANSITION';
  end if;

  return new;
end;
$$;

create trigger reservations_validate_status
before insert or update of status on public.reservations
for each row execute function private.validate_reservation_status();

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_staff() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_staff() to authenticated;

create or replace function private.assert_reservation_window(
  requested_start_at timestamptz,
  requested_end_at timestamptz
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  restaurant_timezone text;
  reservations_are_enabled boolean;
  local_start timestamp;
  local_end timestamp;
  hours_record record;
begin
  if requested_start_at is null or requested_end_at is null then
    raise sqlstate 'PT400' using
      message = 'INVALID_INPUT',
      detail = 'start_at and end_at are required.';
  end if;

  if requested_start_at >= requested_end_at then
    raise sqlstate 'PT400' using
      message = 'INVALID_TIME_RANGE',
      detail = 'start_at must be earlier than end_at.';
  end if;

  select timezone, reservation_enabled
  into restaurant_timezone, reservations_are_enabled
  from public.restaurant_settings
  limit 1;

  if not found or not reservations_are_enabled then
    raise sqlstate 'PT503' using
      message = 'RESERVATIONS_DISABLED',
      detail = 'The restaurant is not currently accepting reservations.';
  end if;

  local_start := requested_start_at at time zone restaurant_timezone;
  local_end := requested_end_at at time zone restaurant_timezone;

  select open_time, close_time, is_closed
  into hours_record
  from public.opening_hours
  where day_of_week = extract(dow from local_start)::smallint;

  if not found
    or hours_record.is_closed
    or local_start::date <> local_end::date
    or local_start::time < hours_record.open_time
    or local_end::time > hours_record.close_time
  then
    raise sqlstate 'PT400' using
      message = 'OUTSIDE_OPENING_HOURS',
      detail = 'The requested period is outside restaurant opening hours.';
  end if;
end;
$$;

revoke all on function private.assert_reservation_window(timestamptz, timestamptz)
  from public, anon, authenticated;

create or replace function public.get_available_tables(
  start_at timestamptz,
  end_at timestamptz,
  party_size integer
)
returns table (
  id uuid,
  code text,
  name text,
  capacity integer,
  area text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if party_size is null or party_size <= 0 then
    raise sqlstate 'PT400' using
      message = 'INVALID_INPUT',
      detail = 'party_size must be a positive integer.';
  end if;

  perform private.assert_reservation_window(start_at, end_at);

  return query
  select t.id, t.code, t.name, t.capacity, t.area
  from public.restaurant_tables t
  where t.is_active
    and t.capacity >= party_size
    and not exists (
      select 1
      from public.reservations r
      where r.table_id = t.id
        and r.status in ('confirmed', 'seated')
        and r.start_at < end_at
        and r.end_at > start_at
    )
  order by t.capacity, t.code;
end;
$$;

revoke all on function public.get_available_tables(timestamptz, timestamptz, integer)
  from public, anon, authenticated;
grant execute on function public.get_available_tables(timestamptz, timestamptz, integer)
  to anon, authenticated;

create or replace function public.create_reservation(
  p_table_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_party_size integer,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_notes text
)
returns table (
  reservation_id uuid,
  confirmation_code text,
  status public.reservation_status,
  table_id uuid,
  start_at timestamptz,
  end_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  selected_table public.restaurant_tables%rowtype;
  created_reservation public.reservations%rowtype;
  generated_confirmation_code text;
begin
  if p_table_id is null
    or p_customer_name is null or length(btrim(p_customer_name)) = 0
    or p_customer_phone is null or length(btrim(p_customer_phone)) = 0
    or p_party_size is null or p_party_size <= 0
  then
    raise sqlstate 'PT400' using
      message = 'INVALID_INPUT',
      detail = 'Required reservation fields are malformed or incomplete.';
  end if;

  if p_customer_email is not null and p_customer_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise sqlstate 'PT400' using
      message = 'INVALID_INPUT',
      detail = 'customer_email must be structurally valid.';
  end if;

  perform private.assert_reservation_window(p_start_at, p_end_at);

  select *
  into selected_table
  from public.restaurant_tables t
  where t.id = p_table_id
  for update;

  if not found then
    raise sqlstate 'PT404' using
      message = 'TABLE_NOT_FOUND',
      detail = 'The requested table does not exist.';
  end if;

  if not selected_table.is_active then
    raise sqlstate 'PT409' using
      message = 'TABLE_NOT_AVAILABLE',
      detail = 'The requested table is inactive.';
  end if;

  if p_party_size > selected_table.capacity then
    raise sqlstate 'PT400' using
      message = 'CAPACITY_EXCEEDED',
      detail = 'The party size exceeds the selected table capacity.';
  end if;

  generated_confirmation_code := 'RSV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  begin
    insert into public.reservations (
      confirmation_code,
      table_id,
      customer_name,
      customer_phone,
      customer_email,
      party_size,
      start_at,
      end_at,
      status,
      notes
    )
    values (
      generated_confirmation_code,
      p_table_id,
      btrim(p_customer_name),
      btrim(p_customer_phone),
      nullif(btrim(p_customer_email), ''),
      p_party_size,
      p_start_at,
      p_end_at,
      'confirmed',
      nullif(btrim(p_notes), '')
    )
    returning * into created_reservation;
  exception
    when exclusion_violation then
      raise sqlstate 'PT409' using
        message = 'TABLE_NOT_AVAILABLE',
        detail = 'The table already has a blocking reservation during the requested period.';
  end;

  return query
  select
    created_reservation.id,
    created_reservation.confirmation_code,
    created_reservation.status,
    created_reservation.table_id,
    created_reservation.start_at,
    created_reservation.end_at;
end;
$$;

revoke all on function public.create_reservation(uuid, text, text, text, integer, timestamptz, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.create_reservation(uuid, text, text, text, integer, timestamptz, timestamptz, text)
  to service_role;

alter table public.restaurant_settings enable row level security;
alter table public.opening_hours enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.reservations enable row level security;
alter table public.staff_users enable row level security;

create policy "staff can read restaurant settings"
on public.restaurant_settings for select
to authenticated
using ((select private.is_staff()));

create policy "staff can update restaurant settings"
on public.restaurant_settings for update
to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "staff can read opening hours"
on public.opening_hours for select
to authenticated
using ((select private.is_staff()));

create policy "staff can insert opening hours"
on public.opening_hours for insert
to authenticated
with check ((select private.is_staff()));

create policy "staff can update opening hours"
on public.opening_hours for update
to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "staff can read tables"
on public.restaurant_tables for select
to authenticated
using ((select private.is_staff()));

create policy "staff can create tables"
on public.restaurant_tables for insert
to authenticated
with check ((select private.is_staff()));

create policy "staff can update tables"
on public.restaurant_tables for update
to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

create policy "staff can read reservations"
on public.reservations for select
to authenticated
using ((select private.is_staff()));

create policy "staff can update reservation status"
on public.reservations for update
to authenticated
using ((select private.is_staff()))
with check ((select private.is_staff()));

revoke all on public.restaurant_settings, public.opening_hours,
  public.restaurant_tables, public.reservations, public.staff_users
  from anon, authenticated;

grant select on public.restaurant_settings to authenticated;
grant update (name, timezone, reservation_enabled) on public.restaurant_settings to authenticated;

grant select, insert on public.opening_hours to authenticated;
grant update (day_of_week, open_time, close_time, is_closed) on public.opening_hours to authenticated;

grant select, insert on public.restaurant_tables to authenticated;
grant update (code, name, capacity, area, is_active) on public.restaurant_tables to authenticated;

grant select on public.reservations to authenticated;
grant update (status) on public.reservations to authenticated;

grant select, insert, update, delete on public.restaurant_settings,
  public.opening_hours, public.restaurant_tables, public.reservations,
  public.staff_users to service_role;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
