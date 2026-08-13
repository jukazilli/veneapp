import { SignupForm } from '@/components/auth-form'
import { createHumanChallenge } from '@/lib/human-challenge'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const challenge = createHumanChallenge()
  return <main className="auth-shell"><div className="auth-panel">
    <div className="brand">veneapp<span>.</span></div>
    <div className="eyebrow auth-eyebrow">Novo acesso</div>
    <h1>Crie sua conta.</h1>
    <p className="muted">Sem confirmação por e-mail. Depois do cadastro, o administrador define seu acesso à operação.</p>
    <div className="card auth-card"><SignupForm challenge={challenge} /></div>
  </div></main>
}
