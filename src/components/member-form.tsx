'use client'

import { useActionState } from 'react'
import { updateMemberAction } from '@/app/(app)/actions'
import type { ProfileRole } from '@/lib/types'

export function MemberForm({ id, role, active }: { id: string; role: ProfileRole; active: boolean }) {
  const [state, action, pending] = useActionState(updateMemberAction, {})
  return <form action={action} className="stack member-form">
    <input type="hidden" name="id" value={id} />
    <div className="grid-2">
      <select className="select" name="role" defaultValue={role} aria-label="Papel">
        <option value="agent">Agente</option>
        <option value="attendant">Atendente</option>
        <option value="admin">Administrador</option>
      </select>
      <select className="select" name="active" defaultValue={String(active)} aria-label="Status do acesso">
        <option value="true">Ativo</option>
        <option value="false">Inativo</option>
      </select>
    </div>
    <button className="button button-secondary" disabled={pending}>{pending ? 'Salvando…' : 'Salvar acesso'}</button>
    {state?.error && <div className="notice error">{state.error}</div>}
    {state?.success && <div className="notice success-box">{state.success}</div>}
  </form>
}
