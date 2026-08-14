alter table public.appointments
  add column net_amount numeric(12,2)
  generated always as (price - commission_amount) stored;

alter table public.appointments
  add constraint appointments_commission_not_above_price
    check (commission_amount <= price),
  add constraint appointments_net_amount_nonnegative
    check (net_amount >= 0);

comment on column public.appointments.net_amount is
  'Valor líquido do atendente: preço bruto menos a comissão congelada no agendamento.';
