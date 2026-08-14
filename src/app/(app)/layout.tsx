import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/bottom-nav'
import { logoutAction } from '@/app/auth-actions'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,organization_id,full_name,role,active,must_change_password')
    .eq('id', userId)
    .single()
  if (!profile) redirect('/login')

  if (!profile.active) {
    return <main className="auth-shell"><div className="card stack">
      <div className="eyebrow">Acesso pendente</div>
      <h1>Seu cadastro foi recebido.</h1>
      <p className="muted">Este acesso está inativo. Fale com o proprietário ou administrador da sua organização.</p>
      <form action={logoutAction}><button className="button button-secondary" style={{width:'100%'}}>Sair</button></form>
    </div></main>
  }

  if (profile.must_change_password) redirect('/primeiro-acesso')

  if (profile.role === 'owner') {
    const { data: organization } = await supabase
      .from('organizations')
      .select('onboarding_completed_at')
      .eq('id', profile.organization_id)
      .single()
    if (!organization?.onboarding_completed_at) redirect('/onboarding')
  }

  return <><div className="shell">{children}</div><BottomNav /></>
}
