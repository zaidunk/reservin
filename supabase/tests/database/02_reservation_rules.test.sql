begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

update public.restaurant_settings
set reservation_enabled = true, timezone = 'Asia/Jakarta';

insert into public.restaurant_tables (id, code, name, capacity, area, is_active)
values
  ('20000000-0000-4000-8000-000000000001', 'R01', 'Reservation table', 4, 'indoor', true),
  ('20000000-0000-4000-8000-000000000002', 'R02', 'Inactive table', 4, 'indoor', false),
  ('20000000-0000-4000-8000-000000000003', 'R03', 'Capacity table', 2, 'indoor', true);

select lives_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000001', 'Valid Customer', '0800', null, 2,
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', null
  )$$,
  'valid reservation succeeds'
);

select throws_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000001', 'Customer', '0800', null, 2,
    '2026-10-10T20:00:00+07:00', '2026-10-10T18:00:00+07:00', null
  )$$,
  'PT400', 'INVALID_TIME_RANGE', 'invalid time range fails'
);

select throws_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000003', 'Customer', '0800', null, 3,
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', null
  )$$,
  'PT400', 'CAPACITY_EXCEEDED', 'insufficient capacity fails'
);

select throws_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000002', 'Customer', '0800', null, 2,
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', null
  )$$,
  'PT409', 'TABLE_NOT_AVAILABLE', 'inactive table fails'
);

select throws_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000001', 'Customer', '0800', null, 2,
    '2026-10-10T08:00:00+07:00', '2026-10-10T09:00:00+07:00', null
  )$$,
  'PT400', 'OUTSIDE_OPENING_HOURS', 'outside-opening-hours request fails'
);

select throws_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000001', 'Customer', '0800', null, 2,
    '2026-10-10T19:00:00+07:00', '2026-10-10T21:00:00+07:00', null
  )$$,
  'PT409', 'TABLE_NOT_AVAILABLE', 'overlap fails'
);

select lives_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000001', 'Customer', '0800', null, 2,
    '2026-10-10T20:00:00+07:00', '2026-10-10T21:00:00+07:00', null
  )$$,
  'back-to-back reservation succeeds'
);

select throws_ok(
  $$update public.restaurant_tables set capacity = 1
    where id = '20000000-0000-4000-8000-000000000001'$$,
  '23514', 'TABLE_CAPACITY_CONFLICT',
  'capacity cannot be lowered below a future blocking reservation party size'
);

update public.reservations
set status = 'cancelled'
where table_id = '20000000-0000-4000-8000-000000000001'
  and status = 'confirmed';

select throws_ok(
  $$update public.reservations set status = 'seated'
    where table_id = '20000000-0000-4000-8000-000000000001'
      and status = 'cancelled'$$,
  '23514', 'INVALID_STATUS_TRANSITION',
  'terminal reservations cannot return to an active state'
);

select throws_ok(
  $$select * from public.create_reservation(
    '99999999-9999-4999-8999-999999999999', 'Customer', '0800', null, 2,
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', null
  )$$,
  'PT404', 'TABLE_NOT_FOUND', 'missing table fails'
);

select throws_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000001', 'Customer', '0800', 'bad-email', 2,
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', null
  )$$,
  'PT400', 'INVALID_INPUT', 'invalid email fails'
);

select throws_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000001', 'Customer', '0800', null, 0,
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', null
  )$$,
  'PT400', 'INVALID_INPUT', 'non-positive party size fails'
);

update public.restaurant_settings set reservation_enabled = false;

select throws_ok(
  $$select * from public.create_reservation(
    '20000000-0000-4000-8000-000000000001', 'Customer', '0800', null, 2,
    '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00', null
  )$$,
  'PT503', 'RESERVATIONS_DISABLED', 'disabled reservations fail'
);

select * from finish();
rollback;
