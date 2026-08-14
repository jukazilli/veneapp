import { redirect } from 'next/navigation'
import { InviteMemberForm } from '@/components/invite-member-form'
import { logoutAction } from '@/app/auth-actions'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const { supabase, profile } = await requireUser()
  if (profile.must_change_password) redirect('/primeiro-acesso')
  if (profile.role !== 'owner' || !profile.active) redirect('/agenda')

  const { data: organization } = await supabase
    .from('organizations')
    .select('name,onboarding_completed_at')
    .eq('id', profile.organization_id)
    .single()

  if (!organization) redirect('/login')
  if (organization.onboarding_completed_at) redirect('/agenda')

  return <main className="setup-shell"><div className="setup-panel stack">
    <div><div className="brand">veneapp<span>.</span></div><div className="eyebrow">Configure sua organização</div><h1>Convide quem trabalha com você.</h1><p className="muted">Você é o proprietário. Dê o primeiro acesso e escolha o que essa pessoa pode fazer.</p></div>
    <div className="card"><InviteMemberForm mode="onboarding" initialOrganizationName={organization.name} /></div>
    <form action={logoutAction}><button className="text-button" type="submit">Sair e continuar depois</button></form>
  </div></main>
}
