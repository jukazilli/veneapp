drop policy if exists appointments_update_agent_admin on public.appointments;
drop policy if exists appointments_update_attendant_own on public.appointments;
create policy appointments_update_by_role
on public.appointments for update
to authenticated
using (
  organization_id = (select private.current_org_id())
  and ((select private.current_role()) in ('admin','agent') or ((select private.current_role()) = 'attendant' and attendant_id = (select auth.uid())))
)
with check (
  organization_id = (select private.current_org_id())
  and ((select private.current_role()) in ('admin','agent') or ((select private.current_role()) = 'attendant' and attendant_id = (select auth.uid())))
);
