import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { periodBounds, shiftLocalDate } from '@/lib/dates'
import { money } from '@/lib/format'
import { outstandingCommissionBalance } from '@/lib/finance'

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { supabase, profile } = await requireUser()
  const params = await searchParams
  const period = params.period === 'month' ? 'month' : 'week'
  const { start, end, startLocal, endLocal } = periodBounds(period)

  let apptQuery = supabase.from('appointments')
    .select('id,price,commission_amount,status,agent_id,attendant_id')
    .gte('starts_at', start)
    .lt('starts_at', end)

  if (profile.role === 'agent') apptQuery = apptQuery.eq('agent_id', profile.id)
  if (profile.role === 'attendant') apptQuery = apptQuery.eq('attendant_id', profile.id)

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
    payQuery = payQuery.eq('paid_by_id', profile.id)
    balanceApptQuery = balanceApptQuery.eq('attendant_id', profile.id)
    balancePayQuery = balancePayQuery.eq('paid_by_id', profile.id)
  }
  if (profile.role === 'agent') {
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

  const done = (appointments || []).filter(a => a.status === 'completed')
  const revenue = done.reduce((sum, item) => sum + Number(item.price), 0)
  const commission = done.reduce((sum, item) => sum + Number(item.commission_amount), 0)
  const paid = (payments || []).reduce((sum, item) => sum + Number(item.amount), 0)
  const outstanding = outstandingCommissionBalance(balanceAppointments || [], balancePayments || [])
  const cancellations = (appointments || []).filter(a => a.status === 'cancelled').length
  const noShows = (appointments || []).filter(a => a.status === 'no_show').length
  const finalDay = shiftLocalDate(endLocal, -1)
  const scope = profile.role === 'admin' ? 'Operação inteira' : profile.role === 'agent' ? 'Seus agendamentos' : 'Seus atendimentos'
  const balanceLabel = profile.role === 'agent' ? 'A receber' : 'A repassar'

  return <main className="stack">
    <div><div className="eyebrow">{scope}</div><h1>Relatórios</h1><p className="muted">{startLocal.split('-').reverse().join('/')} até {finalDay.split('-').reverse().join('/')}</p></div>
    <div className="segmented"><Link href="/relatorios?period=week" className={period === 'week' ? 'active' : ''}>Semana</Link><Link href="/relatorios?period=month" className={period === 'month' ? 'active' : ''}>Mês</Link></div>
    <div className="kpis">
      <div className="kpi"><div className="kpi-label">Faturamento</div><div className="kpi-value">{money(revenue)}</div></div>
      <div className="kpi"><div className="kpi-label">Comissões</div><div className="kpi-value">{money(commission)}</div></div>
      <div className="kpi"><div className="kpi-label">Pagamentos</div><div className="kpi-value">{money(paid)}</div></div>
      <div className="kpi"><div className="kpi-label">{balanceLabel} acumulado</div><div className="kpi-value">{money(outstanding)}</div></div>
    </div>
    <div className="card stack">
      <div className="row-between"><span>Atendimentos concluídos</span><strong>{done.length}</strong></div><div className="divider" />
      <div className="row-between"><span>Cancelamentos</span><strong>{cancellations}</strong></div><div className="divider" />
      <div className="row-between"><span>Não compareceu</span><strong>{noShows}</strong></div><div className="divider" />
      <div className="row-between"><span>Movimento líquido do período</span><strong>{money(commission - paid)}</strong></div>
    </div>
  </main>
}
