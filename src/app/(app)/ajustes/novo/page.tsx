import Link from 'next/link'
import { AdjustmentForm } from '@/components/adjustment-form'
import { localDateString } from '@/lib/dates'
import { requireUser } from '@/lib/session'
import type { CommissionMode, ProfileRole } from '@/lib/types'

export default async function NewAdjustmentPage() {
  const { supabase, profile } = await requireUser()
  const [{ data: people = [] }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('id,full_name,role').eq('active', true).order('full_name'),
    supabase.from('settings').select('commission_mode,commission_value').eq('organization_id', profile.organization_id).single(),
  ])

  const typed = (people || []) as Array<{ id: string; full_name: string; role: ProfileRole }>
  const agents = typed.filter(person => person.role === 'owner' || person.role === 'admin' || person.role === 'agent')
  const attendants = typed.filter(person => person.role === 'attendant')
  const defaultAgentId = agents.some(person => person.id === profile.id) ? profile.id : agents[0]?.id || ''
  const defaultAttendantId = attendants.some(person => person.id === profile.id) ? profile.id : attendants[0]?.id || ''

  return <main>
    <div className="header"><div><div className="eyebrow">Atendimento já realizado</div><h1>Novo ajuste</h1></div><Link href="/ajustes" className="button button-secondary">Voltar</Link></div>
    <div className="card"><AdjustmentForm
      today={localDateString()}
      agents={agents}
      attendants={attendants}
      defaultAgentId={defaultAgentId}
      defaultAttendantId={defaultAttendantId}
      commissionMode={(settings?.commission_mode || 'fixed') as CommissionMode}
      commissionValue={Number(settings?.commission_value || 0)}
    /></div>
  </main>
}
