import { requireUser } from '@/lib/session'
import { SettingsForm } from '@/components/settings-form'
import type { CommissionMode } from '@/lib/types'

export default async function SettingsPage() {
  const { supabase, profile } = await requireUser()
  const { data: settings } = await supabase.from('settings').select('commission_mode,commission_value,default_duration_min,timezone').eq('organization_id',profile.organization_id).single()
  return <main className="stack"><div><div className="eyebrow">Regras da operação</div><h1>Configurações</h1></div>
    <div className="card"><div className="list-row"><span className="muted">Fuso horário</span><strong>{settings?.timezone || 'America/Sao_Paulo'}</strong></div><div className="list-row"><span className="muted">Seu papel</span><strong>{profile.role}</strong></div></div>
    {profile.role === 'admin' ? <div className="card"><SettingsForm mode={(settings?.commission_mode || 'fixed') as CommissionMode} value={Number(settings?.commission_value || 0)} duration={settings?.default_duration_min || 60}/></div> : <div className="notice">Somente o administrador altera comissão e duração padrão.</div>}
  </main>
}
