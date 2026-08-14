-- Stage invitations before auth.users insertion so the trigger never depends on
-- app_metadata being persisted in a second Auth update.

create table if not exists public.pending_user_invitations (
  email text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_role public.profile_role not null,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now(),
  constraint pending_user_invitations_lower_email check (email = lower(btrim(email))),
  constraint pending_user_invitations_assignable_role check (assigned_role in ('admin', 'agent', 'attendant'))
);

alter table public.pending_user_invitations enable row level security;
revoke all on public.pending_user_invitations from anon, authenticated;
grant select, insert, update, delete on public.pending_user_invitations to service_role;

drop policy if exists pending_user_invitations_deny_authenticated on public.pending_user_invitations;
create policy pending_user_invitations_deny_authenticated
on public.pending_user_invitations for all to authenticated
using (false)
with check (false);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending_invitation public.pending_user_invitations%rowtype;
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

  select invitation.* into pending_invitation
  from public.pending_user_invitations invitation
  where invitation.email = lower(btrim(new.email))
    and invitation.expires_at > now()
  for update;

  if pending_invitation.email is not null then
    organization_id_from_invite := pending_invitation.organization_id;
    inviter_id := pending_invitation.invited_by;
    assigned_role := pending_invitation.assigned_role;

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

    delete from public.pending_user_invitations
    where email = pending_invitation.email;
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

-- Repair invitations created while Auth persisted app_metadata after the insert
-- trigger. Only isolated, unused owner tenants carrying trusted app_metadata are moved.
drop trigger if exists profiles_protect_organization_owner on public.profiles;

do $$
declare
  invited_profile record;
  target_organization_id uuid;
  target_inviter_id uuid;
  target_role public.profile_role;
begin
  for invited_profile in
    select p.id, p.organization_id as accidental_organization_id, u.raw_app_meta_data
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.role = 'owner'
      and p.invited_by is null
      and coalesce((u.raw_app_meta_data ->> 'veneapp_invitation')::boolean, false)
      and not exists (select 1 from public.appointments a where a.organization_id = p.organization_id)
      and not exists (select 1 from public.agent_payments payment where payment.organization_id = p.organization_id)
      and 1 = (select count(*) from public.profiles member where member.organization_id = p.organization_id)
  loop
    begin
      target_organization_id := (invited_profile.raw_app_meta_data ->> 'organization_id')::uuid;
      target_inviter_id := (invited_profile.raw_app_meta_data ->> 'invited_by')::uuid;
      target_role := (invited_profile.raw_app_meta_data ->> 'organization_role')::public.profile_role;
    exception when others then
      continue;
    end;

    if target_role not in ('admin', 'agent', 'attendant') then continue; end if;
    if not exists (
      select 1 from public.profiles inviter
      where inviter.id = target_inviter_id
        and inviter.organization_id = target_organization_id
        and inviter.active = true
        and inviter.role in ('owner', 'admin')
    ) then continue; end if;

    update public.profiles
    set organization_id = target_organization_id,
        role = target_role,
        active = true,
        must_change_password = true,
        invited_by = target_inviter_id
    where id = invited_profile.id;

    delete from public.organizations
    where id = invited_profile.accidental_organization_id
      and not exists (
        select 1 from public.profiles remaining
        where remaining.organization_id = invited_profile.accidental_organization_id
      );
  end loop;
end;
$$;

create trigger profiles_protect_organization_owner
before update of organization_id, role, active on public.profiles
for each row execute function private.protect_organization_owner();

delete from public.pending_user_invitations where expires_at <= now();
