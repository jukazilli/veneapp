'use client'

import { useActionState } from 'react'
import { rescheduleAppointmentAction } from '@/app/(app)/actions'
import type { Profile } from '@/lib/types'

type Props = {
  id: string
  clientName: string
  clientPhone: string | null
  date: string
  today: string
  time: string
  duration: number
  price: number
  attendantId: string
  agentId: string
  notes: string | null
  attendants: Profile[]
  agents: Profile[]
}

export function RescheduleForm({ id, clientName, clientPhone, date, today, time, duration, price, attendantId, agentId, notes, attendants, agents }: Props) {
  const [state, action, pending] = useActionState(rescheduleAppointmentAction, {})
  return <form action={action} className="form">
    <input type="hidden" name="id" value={id} />
    {state?.error && <div className="notice error">{state.error}</div>}
    {state?.success && <div className="notice success-box">{state.success}</div>}
    <div className="grid-2">
      <div className="field"><label>Cliente</label><input className="input" name="client_name" defaultValue={clientName} required /></div>
      <div className="field"><label>Telefone <span className="muted">(opcional)</span></label><input className="input" name="client_phone" type="tel" inputMode="tel" defaultValue={clientPhone || ''} /></div>
    </div>
    <div className="grid-2">
      <div className="field"><label>Data</label><input className="input" name="date" type="date" min={today} defaultValue={date} required /></div>
      <div className="field"><label>Hora de início</label><input className="input time-input" name="time" type="time" step="300" defaultValue={time} required /></div>
    </div>
    <div className="grid-2">
      <div className="field"><label>Valor do serviço</label><input className="input" name="price" type="number" step="0.01" min="0" defaultValue={price} required /></div>
      <div className="field"><label>Duração</label><select className="select" name="duration_min" defaultValue={duration}>{[15, 30, 45, 60, 90, 120, 180].map(value => <option key={value} value={value}>{value} min</option>)}</select></div>
    </div>
    <div className="grid-2">
      <div className="field"><label>Atendente</label><select className="select" name="attendant_id" defaultValue={attendantId} required>{attendants.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></div>
      <div className="field"><label>Agente</label><select className="select" name="agent_id" defaultValue={agentId} required>{agents.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></div>
    </div>
    <div className="field"><label>Observação <span className="muted">(opcional)</span></label><textarea className="textarea" name="notes" defaultValue={notes || ''} /></div>
    <button className="button button-primary" disabled={pending}>{pending ? 'Atualizando…' : 'Salvar alterações'}</button>
  </form>
}
