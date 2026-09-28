create policy "authenticated users can read own staff membership"
on public.staff_users for select
to authenticated
using (user_id = (select auth.uid()));

grant select on public.staff_users to authenticated;
