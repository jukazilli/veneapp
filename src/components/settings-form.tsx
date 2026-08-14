'use client'
import { useActionState } from 'react'
import { updateSettingsAction } from '@/app/(app)/actions'
import { DurationInput } from '@/components/duration-input'
import type { CommissionMode } from '@/lib/types'

export function SettingsForm({ mode, value, duration }: { mode: CommissionMode; value: number; duration: number }) {
  const [state, action, pending] = useActionState(updateSettingsAction, {})
  return <form action={action} className="form">
    {state?.error && <div className="notice error">{state.error}</div>}
    {state?.success && <div className="notice success-box">{state.success}</div>}
    <div className="field"><label>Tipo de comissão</label><select className="select" name="commission_mode" defaultValue={mode}><option value="fixed">Valor fixo por serviço</option><option value="percentage">Percentual do serviço</option></select></div>
    <div className="field"><label>Valor da comissão</label><input className="input" name="commission_value" type="number" step="0.01" min="0" defaultValue={value} required /></div>
    <div className="field"><label>Duração padrão (HH:MM)</label><DurationInput defaultMinutes={duration} /></div>
    <button className="button button-primary" disabled={pending}>{pending?'Salvando…':'Salvar configurações'}</button>
  </form>
}
