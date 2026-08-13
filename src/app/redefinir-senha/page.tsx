import { redirect } from 'next/navigation'
import { UpdatePasswordForm } from '@/components/auth-form'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function UpdatePasswordPage() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims?.sub) redirect('/login?auth=invalid')

  return <main className="auth-shell"><div className="auth-panel">
    <div className="brand">veneapp<span>.</span></div>
    <div className="eyebrow auth-eyebrow">Proteja sua conta</div>
    <h1>Crie uma nova senha.</h1>
    <p className="muted">Use pelo menos 8 caracteres e evite reutilizar uma senha antiga.</p>
    <div className="card auth-card"><UpdatePasswordForm /></div>
  </div></main>
}
