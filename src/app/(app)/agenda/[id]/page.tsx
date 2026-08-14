import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { canManageAppointments } from '@/lib/types'
import { dateTime, money, whatsappUrl } from '@/lib/format'
import { localDateString } from '@/lib/dates'
import { RescheduleForm } from '@/components/reschedule-form'
import { StatusActionButton } from '@/components/status-action-button'
import { DeleteAppointmentButton } from '@/components/delete-appointment-button'
import type { AppointmentStatus, Profile } from '@/lib/types'

const statusLabel: Record<AppointmentStatus, string> = {
  scheduled: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
}

function localTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso))
}
function localDate(iso: string) { return localDateString(new Date(iso)) }

function eventText(event: { event_type: string; to_status?: string | null }) {
  if (event.event_type === 'created') return 'Agendamento criado'
  if (event.event_type === 'rescheduled') return 'Horário, duração ou atendente alterado'
  if (event.event_type === 'details_changed') return 'Valor ou detalhes atualizados'
  if (event.event_type === 'status_changed' && event.to_status && event.to_status in statusLabel) return `Status alterado para ${statusLabel[event.to_status as AppointmentStatus]}`
  return 'Agendamento atualizado'
}

export default async function AppointmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params
  const query = await searchParams
  const { supabase, profile } = await requireUser()
  const [{ data: appt }, { data: people = [] }, { data: events = [] }] = await Promise.all([
    supabase.from('appointments').select('id,client_name,client_phone,starts_at,ends_at,duration_min,price,net_amount,status,commission_amount,notes,agent_id,attendant_id,agent:profiles!appointments_agent_id_fkey(full_name),attendant:profiles!appointments_attendant_id_fkey(full_name)').eq('id', id).single(),
    supabase.from('profiles').select('id,organization_id,full_name,email,role,active,must_change_password').eq('active', true).order('full_name'),
    supabase.from('appointment_events').select('id,event_type,from_status,to_status,created_at,actor:profiles!appointment_events_actor_id_fkey(full_name)').eq('appointment_id', id).order('created_at', { ascending: false }).limit(8),
  ])

  if (!appt) notFound()
  const canManage = canManageAppointments(profile.role)
  const canExecute = canManage
  const typedPeople = (people || []) as Profile[]
  const attendants = typedPeople.filter(person => person.role === 'attendant')
  const agents = typedPeople.filter(person => ['owner', 'admin', 'agent'].includes(person.role))
  const whatsapp = appt.client_phone ? whatsappUrl(appt.client_phone) : null
  const appointmentDate = localDate(appt.starts_at)
  const today = localDateString()

  return <main className="stack">
    <div className="header"><div><div className="eyebrow">Atendimento</div><h1>{appt.client_name}</h1></div><Link href={`/agenda?date=${appointmentDate}`} className="button button-secondary">Voltar</Link></div>
    {query.error === 'delete' && <div className="notice error">Não foi possível excluir este agendamento.</div>}

    <div className="card stack">
      <div className="row-between"><strong className="appointment-date">{dateTime(appt.starts_at)}</strong><span className={`badge ${appt.status === 'completed' ? 'success' : appt.status === 'cancelled' ? 'danger' : appt.status === 'no_show' ? 'warning' : ''}`}>{statusLabel[appt.status as AppointmentStatus]}</span></div>
      <div className="list-row"><span className="muted">Atendente</span><strong>{(appt.attendant as unknown as { full_name: string } | null)?.full_name || '—'}</strong></div>
      <div className="list-row"><span className="muted">Agente</span><strong>{(appt.agent as unknown as { full_name: string } | null)?.full_name || '—'}</strong></div>
      <div className="list-row"><span className="muted">Faturamento bruto</span><strong>{money(appt.price)}</strong></div>
      <div className="list-row"><span className="muted">Líquido do atendente</span><strong>{money(appt.net_amount)}</strong></div>
      {canManage && <div className="list-row"><span className="muted">Comissão</span><strong>{money(appt.commission_amount)}</strong></div>}
      {appt.client_phone && <div className="list-row"><span className="muted">WhatsApp</span>{whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer" className="text-link">{appt.client_phone} ↗</a> : <strong>{appt.client_phone}</strong>}</div>}
      {appt.notes && <div><div className="muted small">Observação</div><p>{appt.notes}</p></div>}
    </div>

    {canExecute && appt.status === 'scheduled' && <div className="stack">
      <StatusActionButton id={id} status="completed" label="Concluir atendimento" tone="primary" />
      {canManage && <details className="card"><summary>Editar agendamento</summary><div style={{ marginTop: 16 }}><RescheduleForm id={id} clientName={appt.client_name} clientPhone={appt.client_phone} date={appointmentDate} today={today} time={localTime(appt.starts_at)} duration={appt.duration_min} price={Number(appt.price)} attendantId={appt.attendant_id} agentId={appt.agent_id} notes={appt.notes} attendants={attendants} agents={agents} /></div></details>}
      <details className="card danger-zone"><summary>Outras ações</summary><div className="stack" style={{ marginTop: 16 }}><StatusActionButton id={id} status="no_show" label="Marcar não comparecimento" />{canManage && <StatusActionButton id={id} status="cancelled" label="Cliente cancelou" tone="danger" />}{canManage && <DeleteAppointmentButton id={id} date={appointmentDate} />}</div></details>
    </div>}

    {canManage && appt.status !== 'scheduled' && <div className="stack"><StatusActionButton id={id} status="scheduled" label="Reabrir atendimento" /><DeleteAppointmentButton id={id} date={appointmentDate} /></div>}

    <section className="card">
      <div className="row-between"><h2>Histórico</h2><span className="small muted">Últimas alterações</span></div>
      <div className="history-list">{(events || []).length ? (events || []).map(event => <div className="history-item" key={event.id}>
        <i className="history-dot" />
        <div><strong>{eventText(event)}</strong><div className="small muted">{dateTime(event.created_at)}{(event.actor as unknown as { full_name: string } | null)?.full_name ? ` · ${(event.actor as unknown as { full_name: string }).full_name}` : ''}</div></div>
      </div>) : <div className="small muted">Nenhuma alteração registrada ainda.</div>}</div>
    </section>
  </main>
}
