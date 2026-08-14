import Link from 'next/link'
import { logoutAction } from '@/app/auth-actions'
export default function MorePage() {
  return <main className="stack">
    <div><div className="eyebrow">Conta</div><h1>Mais</h1></div>
    <Link href="/equipe" className="card row-between"><div><strong>Equipe</strong><div className="muted small">Convites e perfis de acesso</div></div><span>›</span></Link>
    <Link href="/configuracoes" className="card row-between"><div><strong>Configurações</strong><div className="muted small">Comissão e duração padrão</div></div><span>›</span></Link>
    <form action={logoutAction}><button className="button button-secondary" style={{width:'100%'}}>Sair</button></form>
  </main>
}
