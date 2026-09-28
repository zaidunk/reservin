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

  perform private.assert_reservation_window(
    get_available_tables.start_at,
    get_available_tables.end_at
  );

  return query
  select t.id, t.code, t.name, t.capacity, t.area
  from public.restaurant_tables t
  where t.is_active
    and t.capacity >= get_available_tables.party_size
    and not exists (
      select 1
      from public.reservations r
      where r.table_id = t.id
        and r.status in ('confirmed', 'seated')
        and r.start_at < get_available_tables.end_at
        and r.end_at > get_available_tables.start_at
    )
  order by t.capacity, t.code;
end;
$$;
