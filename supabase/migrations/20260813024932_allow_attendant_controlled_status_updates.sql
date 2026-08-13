-- Applied to Supabase project ycgmzgxvksmsaeelymsu
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
  v_actor_role public.profile_role;
begin
  if tg_op = 'UPDATE' then
    select private.current_role() into v_actor_role;
    if v_actor_role = 'attendant' then
      if old.attendant_id <> (select auth.uid()) then
        raise exception 'Atendente só pode atualizar os próprios atendimentos';
      end if;
      if new.status not in ('completed','no_show') or old.status <> 'scheduled' then
        raise exception 'Atendente pode apenas concluir ou marcar falta em atendimento confirmado';
      end if;
      if new.organization_id is distinct from old.organization_id
         or new.created_by is distinct from old.created_by
         or new.client_name is distinct from old.client_name
         or new.client_phone is distinct from old.client_phone
         or new.starts_at is distinct from old.starts_at
         or new.duration_min is distinct from old.duration_min
         or new.price is distinct from old.price
         or new.agent_id is distinct from old.agent_id
         or new.attendant_id is distinct from old.attendant_id
         or new.notes is distinct from old.notes then
        raise exception 'Atendente não pode alterar dados do agendamento';
      end if;
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id then raise exception 'A organização do agendamento não pode ser alterada'; end if;
    if new.created_by is distinct from old.created_by then raise exception 'O criador do agendamento não pode ser alterado'; end if;
  end if;

  select exists(select 1 from public.profiles p where p.id = new.agent_id and p.organization_id = new.organization_id and p.active = true and p.role in ('agent','admin')) into v_agent_ok;
  select exists(select 1 from public.profiles p where p.id = new.attendant_id and p.organization_id = new.organization_id and p.active = true and p.role = 'attendant') into v_attendant_ok;
  if not v_agent_ok then raise exception 'Agente inválido ou inativo'; end if;
  if not v_attendant_ok then raise exception 'Atendente inválido ou inativo'; end if;

  new.ends_at := new.starts_at + make_interval(mins => new.duration_min);
  if tg_op = 'INSERT' then
    select s.commission_mode, s.commission_value into v_mode, v_value from public.settings s where s.organization_id = new.organization_id;
    if v_mode is null then raise exception 'Configuração de comissão não encontrada para a organização'; end if;
    new.commission_mode_snapshot := v_mode;
    new.commission_value_snapshot := v_value;
  else
    new.commission_mode_snapshot := old.commission_mode_snapshot;
    new.commission_value_snapshot := old.commission_value_snapshot;
  end if;
  new.commission_amount := case when new.commission_mode_snapshot = 'percentage' then round(new.price * new.commission_value_snapshot / 100, 2) else new.commission_value_snapshot end;

  if new.status = 'cancelled' and (tg_op = 'INSERT' or old.status is distinct from new.status) then new.cancelled_at := now(); elsif new.status <> 'cancelled' then new.cancelled_at := null; end if;
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from new.status) then new.completed_at := now(); elsif new.status <> 'completed' then new.completed_at := null; end if;
  return new;
end;
$$;

grant update on public.appointments to authenticated;
