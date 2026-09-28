create or replace function private.get_available_tables(
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_party_size integer
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
  if p_party_size is null or p_party_size <= 0 then
    raise sqlstate 'PT400' using
      message = 'INVALID_INPUT',
      detail = 'party_size must be a positive integer.';
  end if;

  perform private.assert_reservation_window(p_start_at, p_end_at);

  return query
  select t.id, t.code, t.name, t.capacity, t.area
  from public.restaurant_tables t
  where t.is_active
    and t.capacity >= p_party_size
    and not exists (
      select 1
      from public.reservations r
      where r.table_id = t.id
        and r.status in ('confirmed', 'seated')
        and r.start_at < p_end_at
        and r.end_at > p_start_at
    )
  order by t.capacity, t.code;
end;
$$;

revoke all on function private.get_available_tables(timestamptz, timestamptz, integer)
  from public, anon, authenticated;
grant usage on schema private to anon;
grant execute on function private.get_available_tables(timestamptz, timestamptz, integer)
  to anon, authenticated;

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
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.get_available_tables($1, $2, $3);
$$;
