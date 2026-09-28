insert into public.restaurant_settings (name, timezone, reservation_enabled)
select 'Reservin Demo Restaurant', 'Asia/Jakarta', true
where not exists (select 1 from public.restaurant_settings);

insert into public.opening_hours (day_of_week, open_time, close_time, is_closed)
values
  (0, '10:00', '22:00', false),
  (1, '10:00', '22:00', false),
  (2, '10:00', '22:00', false),
  (3, '10:00', '22:00', false),
  (4, '10:00', '22:00', false),
  (5, '10:00', '23:00', false),
  (6, '10:00', '23:00', false)
on conflict (day_of_week) do update
set open_time = excluded.open_time,
    close_time = excluded.close_time,
    is_closed = excluded.is_closed;

insert into public.restaurant_tables (code, name, capacity, area)
values
  ('T01', 'Indoor Table 1', 2, 'indoor'),
  ('T02', 'Indoor Table 2', 4, 'indoor'),
  ('T03', 'Window Table', 6, 'indoor')
on conflict (code) do update
set name = excluded.name,
    capacity = excluded.capacity,
    area = excluded.area,
    is_active = true;
