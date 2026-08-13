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

  const { data: profile } = await supabase.from('profiles').select('id,full_name,role,active').eq('id', userId).single()
  if (!profile) redirect('/login')

  if (!profile.active) {
    return <main className="auth-shell"><div className="card stack">
      <div className="eyebrow">Acesso pendente</div>
      <h1>Seu cadastro foi recebido.</h1>
      <p className="muted">Um administrador precisa ativar seu acesso e definir se você é agente ou atendente.</p>
      <form action={logoutAction}><button className="button button-secondary" style={{width:'100%'}}>Sair</button></form>
    </div></main>
  }

  return <><div className="shell">{children}</div><BottomNav /></>
}
