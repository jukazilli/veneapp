import { requireUser } from '@/lib/session'
import { localDateString, periodBounds, shiftLocalDate } from '@/lib/dates'
import { outstandingCommissionBalance } from '@/lib/finance'

export type ReportPeriod = 'day' | 'week' | 'month'

export function reportBaseDate(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00.000Z`)
    if (!Number.isNaN(parsed.getTime()) && localDateString(parsed, 'UTC') === value) return parsed
  }
  return new Date()
}

export async function loadReportData(period: ReportPeriod, base: Date) {
  const { supabase, profile } = await requireUser()
  const { start, end, startLocal, endLocal } = periodBounds(period, base)

  let apptQuery = supabase.from('appointments')
    .select('id,price,commission_amount,status,agent_id,attendant_id')
    .gte('starts_at', start)
    .lt('starts_at', end)

  let payQuery = supabase.from('agent_payments')
    .select('amount,agent_id,paid_by_id')
    .gte('paid_at', start)
    .lt('paid_at', end)

  let balanceApptQuery = supabase.from('appointments')
    .select('commission_amount,status,agent_id,attendant_id')
    .eq('status', 'completed')
    .lt('starts_at', end)

  let balancePayQuery = supabase.from('agent_payments')
    .select('amount,agent_id,paid_by_id')
    .lt('paid_at', end)

  if (profile.role === 'attendant') {
    apptQuery = apptQuery.eq('attendant_id', profile.id)
    payQuery = payQuery.eq('paid_by_id', profile.id)
    balanceApptQuery = balanceApptQuery.eq('attendant_id', profile.id)
    balancePayQuery = balancePayQuery.eq('paid_by_id', profile.id)
  }
  if (profile.role === 'agent') {
    apptQuery = apptQuery.eq('agent_id', profile.id)
    payQuery = payQuery.eq('agent_id', profile.id)
    balanceApptQuery = balanceApptQuery.eq('agent_id', profile.id)
    balancePayQuery = balancePayQuery.eq('agent_id', profile.id)
  }

  const [
    { data: appointments = [] },
    { data: payments = [] },
    { data: balanceAppointments = [] },
    { data: balancePayments = [] },
  ] = await Promise.all([apptQuery, payQuery, balanceApptQuery, balancePayQuery])

  const done = (appointments || []).filter(item => item.status === 'completed')
  const revenue = done.reduce((sum, item) => sum + Number(item.price), 0)
  const commission = done.reduce((sum, item) => sum + Number(item.commission_amount), 0)
  const paid = (payments || []).reduce((sum, item) => sum + Number(item.amount), 0)
  const outstanding = outstandingCommissionBalance(balanceAppointments || [], balancePayments || [])
  const finalDay = shiftLocalDate(endLocal, -1)

  return {
    period,
    selectedDate: localDateString(base, 'UTC'),
    startLocal,
    finalDay,
    revenue,
    commission,
    paid,
    outstanding,
    completed: done.length,
    cancellations: (appointments || []).filter(item => item.status === 'cancelled').length,
    noShows: (appointments || []).filter(item => item.status === 'no_show').length,
    netMovement: commission - paid,
    scope: profile.role === 'owner' || profile.role === 'admin' ? 'Operação inteira' : profile.role === 'agent' ? 'Seus agendamentos' : 'Seus atendimentos',
    balanceLabel: profile.role === 'agent' ? 'A receber' : 'A repassar',
  }
}
