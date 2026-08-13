'use client'

import { useActionState } from 'react'
import { createAppointmentAction } from '@/app/(app)/actions'
import type { Profile } from '@/lib/types'

export function NewAppointmentForm({
  date,
  agents,
  attendants,
  duration,
  defaultAgentId,
  defaultTime,
}: {
  date: string
  agents: Profile[]
  attendants: Profile[]
  duration: number
  defaultAgentId: string
  defaultTime: string
}) {
  const [state, action, pending] = useActionState(createAppointmentAction, {})

  return <form action={action} className="form">
    {state?.error && <div className="notice error">{state.error}</div>}

    <section className="form-section">
      <div className="form-section-title">Cliente</div>
      <div className="field"><label>Nome</label><input className="input" name="client_name" placeholder="Nome do cliente" autoFocus required /></div>
      <div className="field"><label>WhatsApp <span className="muted">(opcional)</span></label><input className="input" name="client_phone" inputMode="tel" placeholder="(00) 00000-0000" /></div>
    </section>

    <section className="form-section">
      <div className="form-section-title">Quando</div>
      <div className="grid-2">
        <div className="field"><label>Data</label><input className="input" name="date" type="date" defaultValue={date} required /></div>
        <div className="field"><label>Hora</label><input className="input" name="time" type="time" step="900" defaultValue={defaultTime} required /></div>
      </div>
      <div className="field"><label>Atendente</label><select className="select" name="attendant_id" required defaultValue=""><option value="" disabled>Selecione quem atende</option>{attendants.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
    </section>

    <section className="form-section">
      <div className="form-section-title">Valor e comissão</div>
      <div className="grid-2">
        <div className="field"><label>Valor</label><input className="input" name="price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,00" required /></div>
        <div className="field"><label>Duração</label><select className="select" name="duration_min" defaultValue={duration}>{[30, 45, 60, 90, 120].map(v => <option key={v} value={v}>{v} min</option>)}</select></div>
      </div>
      <div className="field"><label>Agente</label><select className="select" name="agent_id" required defaultValue={defaultAgentId}>{agents.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
    </section>

    <div className="field"><label>Observação <span className="muted">(opcional)</span></label><textarea className="textarea" name="notes" placeholder="Só o que for importante para o atendimento" /></div>

    <button className="button button-primary" disabled={pending || !attendants.length}>{pending ? 'Confirmando…' : 'Confirmar agendamento'}</button>
    {!attendants.length && <div className="notice">Ative pelo menos um atendente antes de agendar.</div>}
  </form>
}
