'use client'
import { useActionState } from 'react'
import { rescheduleAppointmentAction } from '@/app/(app)/actions'
import type { Profile } from '@/lib/types'

export function RescheduleForm({ id, date, time, duration, price, attendantId, attendants }: { id:string; date:string; time:string; duration:number; price:number; attendantId:string; attendants:Profile[] }) {
  const [state, action, pending] = useActionState(rescheduleAppointmentAction, {})
  return <form action={action} className="form">
    <input type="hidden" name="id" value={id} />
    {state?.error && <div className="notice error">{state.error}</div>}
    {state?.success && <div className="notice success-box">{state.success}</div>}
    <div className="grid-2"><div className="field"><label>Data</label><input className="input" name="date" type="date" defaultValue={date} required /></div><div className="field"><label>Hora</label><input className="input" name="time" type="time" defaultValue={time} required /></div></div>
    <div className="grid-2"><div className="field"><label>Valor</label><input className="input" name="price" type="number" step="0.01" min="0" defaultValue={price} required /></div><div className="field"><label>Duração</label><select className="select" name="duration_min" defaultValue={duration}>{[30,45,60,90,120].map(v => <option key={v}>{v}</option>)}</select></div></div>
    <div className="field"><label>Atendente</label><select className="select" name="attendant_id" defaultValue={attendantId}>{attendants.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
    <button className="button button-primary" disabled={pending}>{pending ? 'Atualizando…' : 'Salvar alteração'}</button>
  </form>
}
