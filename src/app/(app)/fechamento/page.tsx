import { requireUser } from '@/lib/session'
import { dayBounds, localDateString } from '@/lib/dates'
import { money } from '@/lib/format'
import { PaymentForm } from '@/components/payment-form'
import { outstandingCommissionBalance } from '@/lib/finance'
import type { Profile } from '@/lib/types'

export default async function ClosingPage() {
  const { supabase, profile } = await requireUser()
  const today = localDateString()
  const { start, end } = dayBounds(today)

  let apptQuery = supabase.from('appointments')
    .select('id,price,commission_amount,agent_id,attendant_id,status')
    .gte('starts_at', start)
    .lt('starts_at', end)

  if (profile.role === 'agent') apptQuery = apptQuery.eq('agent_id', profile.id)
  if (profile.role === 'attendant') apptQuery = apptQuery.eq('attendant_id', profile.id)

  let payQuery = supabase.from('agent_payments')
    .select('id,amount,agent_id,paid_by_id,paid_at')
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
    { data: people = [] },
  ] = await Promise.all([
    apptQuery,
    payQuery,
    balanceApptQuery,
    balancePayQuery,
    supabase.from('profiles').select('id,organization_id,full_name,email,role,active').eq('active', true).order('full_name'),
  ])

  const completed = (appointments || []).filter(a => a.status === 'completed')
  const revenue = completed.reduce((sum, item) => sum + Number(item.price), 0)
  const commissions = completed.reduce((sum, item) => sum + Number(item.commission_amount), 0)
  const paid = (payments || []).reduce((sum, item) => sum + Number(item.amount), 0)
  const outstanding = outstandingCommissionBalance(balanceAppointments || [], balancePayments || [])
  const cancelled = (appointments || []).filter(a => a.status === 'cancelled').length
  const noShows = (appointments || []).filter(a => a.status === 'no_show').length
  const agents = (people || []).filter(p => p.role === 'agent' || p.role === 'admin' || p.role === 'owner') as Profile[]
  const canPay = ['owner', 'admin', 'attendant'].includes(profile.role)

  const scope = profile.role === 'owner' || profile.role === 'admin' ? 'Operação inteira' : profile.role === 'agent' ? 'Seus agendamentos' : 'Seus atendimentos'
  const balanceLabel = profile.role === 'agent' ? 'Saldo a receber' : 'Saldo a repassar'

  return <main className="stack">
    <div><div className="eyebrow">{today.split('-').reverse().join('/')} · {scope}</div><h1>Fechamento do dia</h1><p className="muted">Só atendimentos concluídos entram nos valores.</p></div>

    <div className="kpis">
      <div className="kpi"><div className="kpi-label">Faturamento</div><div className="kpi-value">{money(revenue)}</div></div>
      <div className="kpi"><div className="kpi-label">Comissão gerada</div><div className="kpi-value">{money(commissions)}</div></div>
      <div className="kpi"><div className="kpi-label">Pagamentos</div><div className="kpi-value">{money(paid)}</div></div>
      <div className="kpi"><div className="kpi-label">{balanceLabel} acumulado</div><div className="kpi-value">{money(outstanding)}</div></div>
    </div>

    <div className="card row-between"><div><strong>{completed.length} concluídos</strong><div className="muted small">{cancelled} cancelados · {noShows} faltas · movimento líquido do dia {money(commissions - paid)}</div></div><span className="badge success">Atualizado</span></div>

    {canPay && <details className="card"><summary>Registrar pagamento ao agente</summary><div style={{ marginTop: 16 }}><PaymentForm agents={agents} /></div></details>}
  </main>
}
