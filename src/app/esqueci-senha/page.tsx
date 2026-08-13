import { ForgotPasswordForm } from '@/components/auth-form'

export default function ForgotPasswordPage() {
  return <main className="auth-shell"><div className="auth-panel">
    <div className="brand">veneapp<span>.</span></div>
    <div className="eyebrow auth-eyebrow">Recuperar acesso</div>
    <h1>Esqueceu sua senha?</h1>
    <p className="muted">Informe seu e-mail. Se houver uma conta, enviaremos um link seguro pelo Resend.</p>
    <div className="card auth-card"><ForgotPasswordForm /></div>
  </div></main>
}
