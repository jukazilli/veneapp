import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { localDateString, nextQuarterHourString } from '@/lib/dates'
import { NewAppointmentForm } from '@/components/new-appointment-form'
import type { Profile } from '@/lib/types'

export default async function NewAppointmentPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { supabase, profile } = await requireUser()
  const { date: requestedDate } = await searchParams
  const nextSlot = nextQuarterHourString()
  const today = localDateString()
  const date = requestedDate || nextSlot.date || today
  const defaultTime = date === today ? nextSlot.time : '09:00'

  const [{ data: people = [] }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('id,organization_id,full_name,email,role,active').eq('active', true).order('full_name'),
    supabase.from('settings').select('default_duration_min').eq('organization_id', profile.organization_id).single(),
  ])

  const typed = (people || []) as Profile[]
  const agents = typed.filter(p => p.role === 'agent' || p.role === 'admin' || p.role === 'owner')
  const attendants = typed.filter(p => p.role === 'attendant')
  const defaultAgentId = agents.some(agent => agent.id === profile.id) ? profile.id : agents[0]?.id || ''

  return <main>
    <div className="header"><div><div className="eyebrow">Novo atendimento</div><h1>Agendar</h1></div><Link href={`/agenda?date=${date}`} className="button button-secondary">Voltar</Link></div>
    <div className="card"><NewAppointmentForm date={date} defaultTime={defaultTime} agents={agents} attendants={attendants} duration={settings?.default_duration_min || 60} defaultAgentId={defaultAgentId} /></div>
  </main>
}
