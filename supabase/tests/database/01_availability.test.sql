begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

update public.restaurant_settings
set reservation_enabled = true, timezone = 'Asia/Jakarta';

insert into public.restaurant_tables (id, code, name, capacity, area, is_active)
values
  ('10000000-0000-4000-8000-000000000001', 'A01', 'Available', 4, 'indoor', true),
  ('10000000-0000-4000-8000-000000000002', 'A02', 'Inactive', 4, 'indoor', false),
  ('10000000-0000-4000-8000-000000000003', 'A03', 'Small', 2, 'indoor', true),
  ('10000000-0000-4000-8000-000000000004', 'A04', 'Confirmed', 4, 'indoor', true),
  ('10000000-0000-4000-8000-000000000005', 'A05', 'Seated', 4, 'indoor', true),
  ('10000000-0000-4000-8000-000000000006', 'A06', 'Cancelled', 4, 'indoor', true),
  ('10000000-0000-4000-8000-000000000007', 'A07', 'Back to back', 4, 'indoor', true);

insert into public.reservations (
  confirmation_code, table_id, customer_name, customer_phone,
  party_size, start_at, end_at
)
values
  ('TEST-CONFIRMED', '10000000-0000-4000-8000-000000000004', 'Test', '0800', 2,
   '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00'),
  ('TEST-SEATED', '10000000-0000-4000-8000-000000000005', 'Test', '0800', 2,
   '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00'),
  ('TEST-CANCELLED', '10000000-0000-4000-8000-000000000006', 'Test', '0800', 2,
   '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00'),
  ('TEST-BACK-TO-BACK', '10000000-0000-4000-8000-000000000007', 'Test', '0800', 2,
   '2026-10-10T16:00:00+07:00', '2026-10-10T18:00:00+07:00');

update public.reservations set status = 'seated' where confirmation_code = 'TEST-SEATED';
update public.reservations set status = 'cancelled' where confirmation_code = 'TEST-CANCELLED';

select ok(
  exists(select 1 from public.get_available_tables(
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', 4
  ) where id = '10000000-0000-4000-8000-000000000001'),
  'returns an active table when no reservation overlaps'
);

select ok(
  not exists(select 1 from public.get_available_tables(
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', 4
  ) where id = '10000000-0000-4000-8000-000000000002'),
  'excludes inactive tables'
);

select ok(
  not exists(select 1 from public.get_available_tables(
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', 4
  ) where id = '10000000-0000-4000-8000-000000000003'),
  'excludes tables with insufficient capacity'
);

select ok(
  not exists(select 1 from public.get_available_tables(
    '2026-10-10T19:00:00+07:00', '2026-10-10T21:00:00+07:00', 2
  ) where id = '10000000-0000-4000-8000-000000000004'),
  'excludes tables with overlapping confirmed reservations'
);

select ok(
  not exists(select 1 from public.get_available_tables(
    '2026-10-10T19:00:00+07:00', '2026-10-10T21:00:00+07:00', 2
  ) where id = '10000000-0000-4000-8000-000000000005'),
  'excludes tables with overlapping seated reservations'
);

select ok(
  exists(select 1 from public.get_available_tables(
    '2026-10-10T19:00:00+07:00', '2026-10-10T21:00:00+07:00', 2
  ) where id = '10000000-0000-4000-8000-000000000006'),
  'ignores cancelled reservations'
);

select ok(
  exists(select 1 from public.get_available_tables(
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', 2
  ) where id = '10000000-0000-4000-8000-000000000007'),
  'allows a booking that starts exactly when another booking ends'
);

select * from finish();
rollback;
