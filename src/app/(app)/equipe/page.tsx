import { requireUser } from '@/lib/session'
import { MemberForm } from '@/components/member-form'
import { InviteMemberForm } from '@/components/invite-member-form'
import { ROLE_LABEL } from '@/lib/invitations'
import { isOrganizationManager } from '@/lib/types'
import type { ProfileRole } from '@/lib/types'

export default async function TeamPage() {
  const { supabase, profile } = await requireUser()
  const { data: people = [] } = await supabase.from('profiles').select('id,full_name,email,role,active,created_at').order('created_at')
  const canManage = isOrganizationManager(profile.role)

  return <main className="stack"><div><div className="eyebrow">Pessoas</div><h1>Equipe</h1><p className="muted">Convide pessoas e defina o acesso de cada uma.</p></div>
    {canManage && <details className="card" open={(people || []).length <= 1}><summary>Convidar uma pessoa</summary><div className="member-form"><InviteMemberForm /></div></details>}
    <div className="stack">{(people || []).map(person => <div className="card" key={person.id}><div className="row-between"><div><strong>{person.full_name}</strong><div className="muted small">{person.email}</div></div><span className={`badge ${person.active ? 'success' : 'warning'}`}>{person.active ? ROLE_LABEL[person.role as ProfileRole] : 'Inativo'}</span></div>
      {canManage && person.role !== 'owner' ? <MemberForm id={person.id} role={person.role as ProfileRole} active={person.active} /> : <div className="small muted" style={{ marginTop: 10 }}>Perfil: {ROLE_LABEL[person.role as ProfileRole]}</div>}
    </div>)}</div>
  </main>
}
