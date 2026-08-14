import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { dateOnly, money } from '@/lib/format'

export default async function AdjustmentsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { supabase } = await requireUser()
  const { created } = await searchParams
  const { data: adjustments = [] } = await supabase
    .from('appointments')
    .select('id,client_name,client_phone,starts_at,price,commission_amount,net_amount,agent:profiles!appointments_agent_id_fkey(full_name),attendant:profiles!appointments_attendant_id_fkey(full_name)')
    .eq('entry_source', 'adjustment')
    .order('starts_at', { ascending: false })
    .limit(30)

  return <main className="stack">
    <div><div className="eyebrow">Histórico financeiro</div><h1>Ajustes</h1><p className="muted">Lance atendimentos já realizados sem ocupar um horário da agenda.</p></div>
    {created === '1' && <div className="notice success-box">Ajuste salvo no faturamento e nas comissões.</div>}

    {!adjustments?.length ? <div className="card empty"><strong>Nenhum ajuste lançado.</strong><div className="small" style={{ marginTop: 6 }}>Use o botão abaixo para incluir um atendimento já realizado.</div></div> :
      <div className="stack">{adjustments.map(item => {
        const agent = item.agent as unknown as { full_name: string } | null
        const attendant = item.attendant as unknown as { full_name: string } | null
        return <div className="card stack compact-stack" key={item.id}>
          <div className="row-between"><div><strong>{item.client_name}</strong><div className="small muted">{dateOnly(item.starts_at)}</div></div><strong>{money(item.price)}</strong></div>
          <div className="small muted">Atendente: {attendant?.full_name || '—'} · Agente: {agent?.full_name || '—'}</div>
          <div className="row-between small"><span>Comissão {money(item.commission_amount)}</span><strong>Líquido {money(item.net_amount)}</strong></div>
        </div>
      })}</div>}

    <Link href="/ajustes/novo" className="button button-primary fab">+ Ajuste</Link>
  </main>
}
