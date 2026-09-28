begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email)
values
  ('30000000-0000-4000-8000-000000000001', 'staff@example.com'),
  ('30000000-0000-4000-8000-000000000002', 'nonstaff@example.com');

insert into public.staff_users (user_id)
values ('30000000-0000-4000-8000-000000000001');

insert into public.restaurant_tables (id, code, name, capacity)
values ('30000000-0000-4000-8000-000000000003', 'AUTH', 'Authorization table', 4);

insert into public.reservations (
  confirmation_code, table_id, customer_name, customer_phone,
  party_size, start_at, end_at
)
values (
  'TEST-AUTH', '30000000-0000-4000-8000-000000000003', 'Customer', '0800',
  2, '2026-10-10T18:00:00+07:00', '2026-10-10T20:00:00+07:00'
);

set local role anon;

select throws_ok(
  $$insert into public.restaurant_tables (code, name, capacity)
    values ('NOPE', 'Anonymous table', 2)$$,
  '42501', null,
  'anonymous user cannot modify tables'
);

select throws_ok(
  $$select * from public.reservations$$,
  '42501', null,
  'anonymous user cannot read the reservation dataset'
);

select lives_ok(
  $$select * from public.get_available_tables(
    '2026-10-10T20:00:00+07:00', '2026-10-10T21:00:00+07:00', 2
  )$$,
  'anonymous user can call the public availability capability'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000002';

select results_eq(
  $$select count(*) from public.restaurant_tables$$,
  array[0::bigint],
  'non-staff authenticated user cannot access management data'
);

set local "request.jwt.claim.sub" = '30000000-0000-4000-8000-000000000001';

select lives_ok(
  $$insert into public.restaurant_tables (code, name, capacity)
    values ('STAFF', 'Staff table', 2)$$,
  'staff user can access allowed table management operations'
);

select results_eq(
  $$select count(*) from public.restaurant_tables where code = 'STAFF'$$,
  array[1::bigint],
  'staff user can retrieve tables'
);

select lives_ok(
  $$update public.restaurant_tables
    set code = 'STAFF-UPDATED', name = 'Updated staff table',
        capacity = 4, area = 'outdoor'
    where code = 'STAFF'$$,
  'staff user can update table details'
);

select lives_ok(
  $$update public.restaurant_tables
    set is_active = false
    where code = 'STAFF-UPDATED'$$,
  'staff user can deactivate a table'
);

select lives_ok(
  $$update public.reservations
    set status = 'seated'
    where confirmation_code = 'TEST-AUTH'$$,
  'staff user can update reservation operational status'
);

select * from finish();
rollback;
