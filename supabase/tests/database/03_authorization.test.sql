begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email)
values
  ('30000000-0000-4000-8000-000000000001', 'staff@example.com'),
  ('30000000-0000-4000-8000-000000000002', 'nonstaff@example.com');

insert into public.staff_users (user_id)
values ('30000000-0000-4000-8000-000000000001');

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

select * from finish();
rollback;
