import Link from 'next/link'
import { requireUser } from '@/lib/session'
import { canManageAppointments } from '@/lib/types'
import { dayBounds, localDateString, shiftLocalDate } from '@/lib/dates'
import { RealtimeAgenda } from '@/components/realtime-agenda'
import { AgendaDateNav } from '@/components/agenda-date-nav'
import type { Appointment } from '@/lib/types'

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { supabase, profile } = await requireUser()
  const params = await searchParams
  const today = localDateString()
  const date = params.date || today
  const { start, end } = dayBounds(date)

  const { data = [] } = await supabase.from('appointments')
    .select('id,client_name,client_phone,starts_at,ends_at,duration_min,price,net_amount,entry_source,status,commission_amount,notes,agent_id,attendant_id,agent:profiles!appointments_agent_id_fkey(full_name),attendant:profiles!appointments_attendant_id_fkey(full_name)')
    .eq('entry_source', 'agenda')
    .gte('starts_at', start)
    .lt('starts_at', end)
    .order('starts_at')

  const canCreate = canManageAppointments(profile.role)
  return <main>
    <div className="page-heading">
      <div><div className="eyebrow">Agenda compartilhada</div><h1>{date === today ? 'Hoje' : 'Agenda'}</h1></div>
      <AgendaDateNav date={date} previous={shiftLocalDate(date, -1)} next={shiftLocalDate(date, 1)} today={today} />
    </div>
    <RealtimeAgenda appointments={(data || []) as unknown as Appointment[]} organizationId={profile.organization_id} />
    {canCreate && <Link href={`/agenda/novo?date=${date}`} className="button button-primary fab">+ Novo agendamento</Link>}
  </main>
}
