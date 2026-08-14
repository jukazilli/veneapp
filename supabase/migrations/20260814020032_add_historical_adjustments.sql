alter table public.appointments
  add column entry_source text not null default 'agenda',
  add constraint appointments_entry_source_valid
    check (entry_source in ('agenda', 'adjustment')),
  add constraint appointments_adjustment_is_completed
    check (entry_source <> 'adjustment' or status = 'completed');

comment on column public.appointments.entry_source is
  'Origem do lançamento: agenda operacional ou ajuste histórico concluído.';

create or replace function private.protect_appointment_entry_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.entry_source is distinct from old.entry_source then
    raise exception 'A origem do atendimento não pode ser alterada';
  end if;

  if new.entry_source = 'adjustment' then
    if new.status <> 'completed' then
      raise exception 'Ajustes históricos precisam estar concluídos';
    end if;
    if new.starts_at > now() then
      raise exception 'A data do ajuste não pode estar no futuro';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_appointment_entry_source() from public, anon, authenticated;

create trigger appointments_02_protect_entry_source
before insert or update on public.appointments
for each row execute function private.protect_appointment_entry_source();
