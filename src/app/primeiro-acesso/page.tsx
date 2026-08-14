import { redirect } from 'next/navigation'
import { FirstAccessForm } from '@/components/first-access-form'
import { requireUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function FirstAccessPage() {
  const { profile } = await requireUser()
  if (!profile.active || !profile.must_change_password) redirect('/agenda')

  return <main className="auth-shell"><div className="auth-panel">
    <div className="brand">veneapp<span>.</span></div>
    <div className="eyebrow auth-eyebrow">Primeiro acesso</div>
    <h1>Crie sua própria senha.</h1>
    <p className="muted">A senha do convite é temporária. Troque-a antes de acessar a organização.</p>
    <div className="card auth-card"><FirstAccessForm /></div>
  </div></main>
}
