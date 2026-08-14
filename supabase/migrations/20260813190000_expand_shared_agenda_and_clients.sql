-- Shared agenda operations, automatic clients and working-day availability.

alter table public.settings
  add column if not exists workday_start time not null default '08:00',
  add column if not exists workday_end time not null default '20:00';

alter table public.settings
  drop constraint if exists settings_valid_workday,
  add constraint settings_valid_workday check (workday_end > workday_start);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null,
  phone_display text not null,
  phone_normalized text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_phone_normalized_format check (phone_normalized ~ '^[0-9]{10,15}$'),
  constraint clients_organization_phone_key unique (organization_id, phone_normalized)
);

create index if not exists clients_organization_name_idx
  on public.clients (organization_id, display_name);

alter table public.clients enable row level security;
revoke all on public.clients from anon;
grant select on public.clients to authenticated;

drop policy if exists clients_select_same_organization on public.clients;
create policy clients_select_same_organization
on public.clients for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'agent', 'attendant')
);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function private.set_updated_at();

alter table public.appointments
  add column if not exists client_id uuid references public.clients(id) on delete set null;

create index if not exists appointments_client_id_idx
  on public.appointments (client_id)
  where client_id is not null;

create or replace function private.normalize_client_phone(value text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  digits text;
begin
  digits := regexp_replace(value, '[^0-9]', '', 'g');
  if length(digits) in (10, 11) then
    return '55' || digits;
  end if;
  return digits;
end;
$$;

revoke all on function private.normalize_client_phone(text) from public, anon, authenticated;

insert into public.clients (organization_id, display_name, phone_display, phone_normalized)
select distinct on (a.organization_id, private.normalize_client_phone(a.client_phone))
  a.organization_id,
  a.client_name,
  a.client_phone,
  private.normalize_client_phone(a.client_phone)
from public.appointments a
where nullif(btrim(a.client_phone), '') is not null
  and length(private.normalize_client_phone(a.client_phone)) between 10 and 15
order by a.organization_id, private.normalize_client_phone(a.client_phone), a.created_at desc
on conflict (organization_id, phone_normalized) do update
set display_name = excluded.display_name,
    phone_display = excluded.phone_display,
    updated_at = now();

update public.appointments a
set client_id = c.id
from public.clients c
where a.organization_id = c.organization_id
  and nullif(btrim(a.client_phone), '') is not null
  and private.normalize_client_phone(a.client_phone) = c.phone_normalized;

create or replace function private.link_appointment_client()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text;
begin
  if tg_op = 'UPDATE'
     and new.client_phone is not distinct from old.client_phone
     and new.client_name is not distinct from old.client_name then
    return new;
  end if;

  if nullif(btrim(new.client_phone), '') is null then
    new.client_phone := null;
    new.client_id := null;
    return new;
  end if;

  normalized := private.normalize_client_phone(new.client_phone);
  if length(normalized) < 10 or length(normalized) > 15 then
    raise exception 'Telefone do cliente inválido';
  end if;

  insert into public.clients (organization_id, display_name, phone_display, phone_normalized)
  values (new.organization_id, new.client_name, btrim(new.client_phone), normalized)
  on conflict (organization_id, phone_normalized) do update
  set display_name = excluded.display_name,
      phone_display = excluded.phone_display,
      updated_at = now()
  returning id into new.client_id;

  return new;
end;
$$;

revoke all on function private.link_appointment_client() from public, anon, authenticated;

drop trigger if exists appointments_10_link_client on public.appointments;
create trigger appointments_10_link_client
before insert or update on public.appointments
for each row execute function private.link_appointment_client();

create or replace function private.reject_past_appointment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'scheduled'
     and (
       tg_op = 'INSERT'
       or new.starts_at is distinct from old.starts_at
       or new.status is distinct from old.status
     )
     and new.starts_at < now() then
    raise exception 'Não é permitido agendar um horário que já passou';
  end if;
  return new;
end;
$$;

revoke all on function private.reject_past_appointment() from public, anon, authenticated;

drop trigger if exists appointments_01_reject_past on public.appointments;
create trigger appointments_01_reject_past
before insert or update on public.appointments
for each row execute function private.reject_past_appointment();

drop trigger if exists appointments_00_restrict_attendant_update on public.appointments;
drop function if exists private.restrict_attendant_appointment_update();

drop policy if exists appointments_insert_owner_admin_agent on public.appointments;
drop policy if exists appointments_select_by_role on public.appointments;
drop policy if exists appointments_update_by_role on public.appointments;

create policy appointments_insert_active_member
on public.appointments for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'agent', 'attendant')
  and created_by = (select auth.uid())
);

create policy appointments_select_active_member
on public.appointments for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'agent', 'attendant')
);

create policy appointments_update_active_member
on public.appointments for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'agent', 'attendant')
)
with check (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'agent', 'attendant')
);

create policy appointments_delete_active_member
on public.appointments for delete to authenticated
using (
  organization_id = (select private.current_org_id())
  and (select private.current_role()) in ('owner', 'admin', 'agent', 'attendant')
);

grant select, insert, update, delete on public.appointments to authenticated;
