alter table public.organizations
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  add column if not exists must_change_password boolean not null default false,
  add column if not exists invited_by uuid references public.profiles(id) on delete set null;

comment on column public.organizations.onboarding_completed_at is
  'Set after the organization owner completes the first-member onboarding.';
comment on column public.profiles.must_change_password is
  'Forces server-created invitees to replace their temporary password.';
comment on column public.profiles.invited_by is
  'Authenticated owner or administrator who provisioned this membership.';

-- Remove the legacy invariant before promoting the first administrator to owner.
drop trigger if exists profiles_protect_last_admin on public.profiles;
drop function if exists private.protect_last_active_admin();

-- Preserve each legacy organization and promote its earliest active administrator.
with owner_candidates as (
  select distinct on (p.organization_id) p.id
  from public.profiles p
  order by p.organization_id, (p.role = 'admin') desc, p.active desc, p.created_at, p.id
)
update public.profiles p
set role = 'owner', active = true
from owner_candidates c
where p.id = c.id;

-- Legacy public sign-ups were attached to the first tenant as inactive attendants.
-- Split only unreferenced pending profiles so their already-created account follows
-- the new one-account/one-organization rule without moving operational history.
do $$
declare
  pending_profile record;
  new_organization_id uuid;
begin
  for pending_profile in
    select p.id, p.full_name
    from public.profiles p
    where p.active = false
      and p.invited_by is null
      and not exists (
        select 1 from public.appointments a
        where a.agent_id = p.id or a.attendant_id = p.id
      )
      and not exists (
        select 1 from public.agent_payments ap
        where ap.agent_id = p.id or ap.paid_by_id = p.id
      )
  loop
    insert into public.organizations(name)
    values ('Organização de ' || left(pending_profile.full_name, 96))
    returning id into new_organization_id;

    insert into public.settings(organization_id)
    values (new_organization_id);

    update public.profiles
    set organization_id = new_organization_id,
        role = 'owner',
        active = true,
        must_change_password = false
    where id = pending_profile.id;
  end loop;
end;
$$;

create unique index if not exists profiles_one_owner_per_organization
  on public.profiles(organization_id)
  where role = 'owner';

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  organization_id_from_invite uuid;
  inviter_id uuid;
  assigned_role public.profile_role;
  display_name text;
begin
  display_name := left(
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, 'Usuário'), '@', 1)
    ),
    120
  );

  if coalesce((new.raw_app_meta_data ->> 'veneapp_invitation')::boolean, false) then
    begin
      organization_id_from_invite := (new.raw_app_meta_data ->> 'organization_id')::uuid;
      inviter_id := (new.raw_app_meta_data ->> 'invited_by')::uuid;
      assigned_role := (new.raw_app_meta_data ->> 'organization_role')::public.profile_role;
    exception when others then
      raise exception 'Metadados de convite inválidos';
    end;

    if assigned_role not in ('admin', 'agent', 'attendant') then
      raise exception 'Papel de convite inválido';
    end if;

    if not exists (
      select 1
      from public.profiles inviter
      where inviter.id = inviter_id
        and inviter.organization_id = organization_id_from_invite
        and inviter.active = true
        and inviter.role in ('owner', 'admin')
    ) then
      raise exception 'Convite sem responsável autorizado';
    end if;

    insert into public.profiles(
      id, organization_id, full_name, email, role, active,
      must_change_password, invited_by
    ) values (
      new.id, organization_id_from_invite, display_name, new.email,
      assigned_role, true, true, inviter_id
    );
  else
    insert into public.organizations(name)
    values ('Organização de ' || left(display_name, 96))
    returning id into organization_id_from_invite;

    insert into public.settings(organization_id)
    values (organization_id_from_invite);

    insert into public.profiles(
      id, organization_id, full_name, email, role, active,
      must_change_password, invited_by
    ) values (
      new.id, organization_id_from_invite, display_name, new.email,
      'owner', true, false, null
    );
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create or replace function private.protect_organization_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'owner' and (
    new.role is distinct from 'owner'
    or new.active is distinct from true
    or new.organization_id is distinct from old.organization_id
  ) then
    raise exception 'O proprietário da organização não pode ser removido, desativado ou rebaixado';
  end if;

  if old.role is distinct from 'owner' and new.role = 'owner' then
    raise exception 'A propriedade da organização não pode ser atribuída pela gestão da equipe';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_organization_owner
before update of organization_id, role, active on public.profiles
for each row execute function private.protect_organization_owner();

create or replace function private.prepare_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mode public.commission_mode;
  v_value numeric(12,2);
  v_agent_ok boolean;
  v_attendant_ok boolean;
begin
  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id then
      raise exception 'A organização do agendamento não pode ser alterada';
    end if;
    if new.created_by is distinct from old.created_by then
      raise exception 'O criador do agendamento não pode ser alterado';
    end if;
  end if;

  select exists(
    select 1 from public.profiles p
    where p.id = new.agent_id
      and p.organization_id = new.organization_id
      and p.active = true
      and p.role in ('owner', 'admin', 'agent')
  ) into v_agent_ok;

  select exists(
    select 1 from public.profiles p
    where p.id = new.attendant_id
      and p.organization_id = new.organization_id
      and p.active = true
      and p.role = 'attendant'
  ) into v_attendant_ok;

  if not v_agent_ok then raise exception 'Agente inválido ou inativo'; end if;
  if not v_attendant_ok then raise exception 'Atendente inválido ou inativo'; end if;

  new.ends_at := new.starts_at + make_interval(mins => new.duration_min);

  if tg_op = 'INSERT' then
    select s.commission_mode, s.commission_value into v_mode, v_value
    from public.settings s where s.organization_id = new.organization_id;
    if v_mode is null then
      raise exception 'Configuração de comissão não encontrada para a organização';
    end if;
    new.commission_mode_snapshot := v_mode;
    new.commission_value_snapshot := v_value;
  else
    new.commission_mode_snapshot := old.commission_mode_snapshot;
    new.commission_value_snapshot := old.commission_value_snapshot;
  end if;

  new.commission_amount := case
    when new.commission_mode_snapshot = 'percentage'
      then round(new.price * new.commission_value_snapshot / 100, 2)
    else new.commission_value_snapshot
  end;

  if new.status = 'cancelled' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    new.cancelled_at := now();
  elsif new.status <> 'cancelled' then
    new.cancelled_at := null;
  end if;

  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create or replace function private.validate_agent_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agent_ok boolean;
  v_payer_ok boolean;
begin
  select exists(
    select 1 from public.profiles p
    where p.id = new.agent_id
      and p.organization_id = new.organization_id
      and p.active = true
      and p.role in ('owner', 'admin', 'agent')
  ) into v_agent_ok;

  select exists(
    select 1 from public.profiles p
    where p.id = new.paid_by_id
      and p.organization_id = new.organization_id
      and p.active = true
      and p.role in ('owner', 'admin', 'attendant')
  ) into v_payer_ok;

  if not v_agent_ok then raise exception 'Agente inválido ou inativo'; end if;
  if new.paid_by_id is not null and not v_payer_ok then raise exception 'Pagador inválido'; end if;
  return new;
end;
$$;

drop policy if exists organizations_update_owner_admin on public.organizations;
create policy organizations_update_owner_admin
on public.organizations for update to authenticated
using (
  id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
)
with check (
  id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
);

grant update(name, onboarding_completed_at) on public.organizations to authenticated;

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_owner_admin
on public.profiles for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
)
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
);

drop policy if exists settings_update_admin on public.settings;
create policy settings_update_owner_admin
on public.settings for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
)
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin')
);

drop policy if exists appointments_insert_agent_admin on public.appointments;
create policy appointments_insert_owner_admin_agent
on public.appointments for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'agent')
  and created_by = (select auth.uid())
);

drop policy if exists appointments_select_by_role on public.appointments;
create policy appointments_select_by_role
on public.appointments for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (select private.current_role()) in ('owner', 'admin', 'agent')
    or attendant_id = (select auth.uid())
  )
);

drop policy if exists appointments_update_by_role on public.appointments;
create policy appointments_update_by_role
on public.appointments for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (select private.current_role()) in ('owner', 'admin', 'agent')
    or ((select private.current_role()) = 'attendant' and attendant_id = (select auth.uid()))
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    (select private.current_role()) in ('owner', 'admin', 'agent')
    or ((select private.current_role()) = 'attendant' and attendant_id = (select auth.uid()))
  )
);

drop policy if exists agent_payments_insert_admin_attendant on public.agent_payments;
create policy agent_payments_insert_owner_admin_attendant
on public.agent_payments for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'attendant')
  and created_by = (select auth.uid())
  and (
    (select private.current_role()) in ('owner', 'admin')
    or paid_by_id = (select auth.uid())
  )
);

drop policy if exists agent_payments_select_by_participation on public.agent_payments;
create policy agent_payments_select_by_participation
on public.agent_payments for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (select private.current_role()) in ('owner', 'admin')
    or agent_id = (select auth.uid())
    or paid_by_id = (select auth.uid())
  )
);
