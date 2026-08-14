'use client'
import { useActionState } from 'react'
import { recordPaymentAction } from '@/app/(app)/actions'
import type { Profile } from '@/lib/types'

export function PaymentForm({ agents }: { agents: Profile[] }) {
  const [state, action, pending] = useActionState(recordPaymentAction, {})
  return <form action={action} className="form">
    {state?.error && <div className="notice error">{state.error}</div>}
    {state?.success && <div className="notice success-box">{state.success}</div>}
    <div className="field"><label>Agente que recebe</label><select className="select" name="agent_id" required defaultValue=""><option value="" disabled>Selecione</option>{agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}</select></div>
    <div className="field"><label>Comissão paga</label><input className="input" name="amount" type="number" step="0.01" min="0.01" inputMode="decimal" required /></div>
    <div className="field"><label>Observação <span className="muted">(opcional)</span></label><input className="input" name="notes" /></div>
    <button className="button button-primary" disabled={pending || !agents.length}>{pending ? 'Registrando…' : 'Registrar comissão'}</button>
  </form>
}
