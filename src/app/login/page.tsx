import { LoginForm } from '@/components/auth-form'

const NOTICES: Record<string, string> = {
  updated: 'Senha atualizada. Entre com sua nova senha.',
  invalid: 'Este link expirou ou já foi usado. Solicite um novo link.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ password?: string; auth?: string }> }) {
  const params = await searchParams
  const notice = params.password === 'updated' ? NOTICES.updated : params.auth === 'invalid' ? NOTICES.invalid : undefined
  const noticeKind = params.auth === 'invalid' ? 'error' : 'success'

  return <main className="auth-shell"><div className="auth-panel">
    <div className="brand">veneapp<span>.</span></div>
    <div className="eyebrow auth-eyebrow">Agenda em sincronia</div>
    <h1>Menos mensagens. Mais controle.</h1>
    <p className="muted">Agente e atendente enxergam a mesma agenda, os mesmos horários e o mesmo fechamento.</p>
    <div className="card auth-card"><LoginForm notice={notice} noticeKind={noticeKind} /></div>
  </div></main>
}
