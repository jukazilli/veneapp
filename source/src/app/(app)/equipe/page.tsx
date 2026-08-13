import { requireUser } from '@/lib/session'
import { MemberForm } from '@/components/member-form'
import type { ProfileRole } from '@/lib/types'

const roleLabel: Record<ProfileRole, string> = { admin: 'Administrador', agent: 'Agente', attendant: 'Atendente' }

export default async function TeamPage() {
  const { supabase, profile } = await requireUser()
  const { data: people = [] } = await supabase.from('profiles').select('id,full_name,email,role,active,created_at').order('created_at')
  const admin = profile.role === 'admin'

  return <main className="stack"><div><div className="eyebrow">Pessoas</div><h1>Equipe</h1><p className="muted">Defina quem administra a agenda e quem executa os atendimentos.</p></div>
    {admin && <div className="notice">Para adicionar alguém neste MVP, a pessoa cria uma conta em <strong>/cadastro</strong>. O acesso entra pendente até você ativar.</div>}
    <div className="stack">{(people || []).map(person => <div className="card" key={person.id}><div className="row-between"><div><strong>{person.full_name}</strong><div className="muted small">{person.email}</div></div><span className={`badge ${person.active ? 'success' : 'warning'}`}>{person.active ? roleLabel[person.role as ProfileRole] : 'Pendente'}</span></div>
      {admin ? <MemberForm id={person.id} role={person.role as ProfileRole} active={person.active} /> : <div className="small muted" style={{ marginTop: 10 }}>Papel: {roleLabel[person.role as ProfileRole]}</div>}
    </div>)}</div>
  </main>
}
