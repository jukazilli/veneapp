import { LoginForm } from '@/components/auth-form'

export default function LoginPage() {
  return <main className="auth-shell"><div className="auth-panel">
    <div className="brand">veneapp<span>.</span></div>
    <div className="eyebrow auth-eyebrow">Agenda em sincronia</div>
    <h1>Menos mensagens. Mais controle.</h1>
    <p className="muted">Agente e atendente enxergam a mesma agenda, os mesmos horários e o mesmo fechamento.</p>
    <div className="card auth-card"><LoginForm /></div>
  </div></main>
}
