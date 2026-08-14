'use client'

import { useActionState, useEffect, useState } from 'react'
import { createAppointmentAction } from '@/app/(app)/actions'
import type { Profile } from '@/lib/types'

export function NewAppointmentForm({
  date,
  today,
  agents,
  attendants,
  duration,
  defaultAgentId,
  defaultAttendantId,
  defaultTime,
}: {
  date: string
  today: string
  agents: Profile[]
  attendants: Profile[]
  duration: number
  defaultAgentId: string
  defaultAttendantId: string
  defaultTime: string
}) {
  const [state, action, pending] = useActionState(createAppointmentAction, {})
  const [appointmentDate, setAppointmentDate] = useState(date)
  const [time, setTime] = useState(defaultTime)
  const [durationMin, setDurationMin] = useState(duration)
  const [attendantId, setAttendantId] = useState(defaultAttendantId)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(Boolean(date && defaultAttendantId && duration))

  useEffect(() => {
    if (!appointmentDate || !attendantId || !durationMin) return
    const controller = new AbortController()
    let active = true
    const query = new URLSearchParams({
      date: appointmentDate,
      attendant_id: attendantId,
      duration_min: String(durationMin),
    })

    fetch(`/api/availability?${query}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then((data: { suggestedTime: string | null }) => {
        if (!active) return
        setSuggestion(data.suggestedTime)
        if (data.suggestedTime) setTime(data.suggestedTime)
      })
      .catch(() => { if (active) setSuggestion(null) })
      .finally(() => { if (active) setCheckingAvailability(false) })

    return () => {
      active = false
      controller.abort()
    }
  }, [appointmentDate, attendantId, durationMin])

  return <form action={action} className="form">
    {state?.error && <div className="notice error">{state.error}</div>}

    <section className="form-section">
      <div className="form-section-title">Cliente</div>
      <div className="field"><label>Nome</label><input className="input" name="client_name" placeholder="Nome do cliente" autoFocus required /></div>
      <div className="field"><label>Telefone / WhatsApp <span className="muted">(opcional)</span></label><input className="input" name="client_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" /><span className="field-hint">Se informado, o cliente é cadastrado ou reconhecido automaticamente.</span></div>
    </section>

    <section className="form-section">
      <div className="form-section-title">Quando</div>
      <div className="grid-2">
        <div className="field"><label>Data</label><input className="input" name="date" type="date" min={today} value={appointmentDate} onChange={event => { setCheckingAvailability(true); setAppointmentDate(event.target.value) }} required /></div>
        <div className="field"><label>Hora de início</label><input className="input time-input" name="time" type="time" step="300" value={time} onChange={event => setTime(event.target.value)} required /><span className="field-hint">Toque para usar o relógio do celular ou digite hora e minutos.</span></div>
      </div>
      <div className="field"><label>Atendente</label><select className="select" name="attendant_id" required value={attendantId} onChange={event => { setCheckingAvailability(true); setAttendantId(event.target.value) }}><option value="" disabled>Selecione quem atende</option>{attendants.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></div>
      {attendantId && <div className={`availability-hint ${suggestion ? 'available' : ''}`}>{checkingAvailability ? 'Procurando o melhor encaixe…' : suggestion ? `Sugestão para ocupar melhor a agenda: ${suggestion}` : 'Não há encaixe disponível dentro do expediente para essa duração.'}</div>}
    </section>

    <section className="form-section">
      <div className="form-section-title">Valor e comissão</div>
      <div className="grid-2">
        <div className="field"><label>Valor do serviço</label><input className="input" name="price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,00" required /></div>
        <div className="field"><label>Duração</label><select className="select" name="duration_min" value={durationMin} onChange={event => { setCheckingAvailability(true); setDurationMin(Number(event.target.value)) }}>{[15, 30, 45, 60, 90, 120, 180].map(value => <option key={value} value={value}>{value} min</option>)}</select></div>
      </div>
      <div className="field"><label>Agente</label><select className="select" name="agent_id" required defaultValue={defaultAgentId}>{agents.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></div>
    </section>

    <div className="field"><label>Observação <span className="muted">(opcional)</span></label><textarea className="textarea" name="notes" placeholder="Só o que for importante para o atendimento" /></div>

    <button className="button button-primary" disabled={pending || !attendants.length}>{pending ? 'Confirmando…' : 'Confirmar agendamento'}</button>
    {!attendants.length && <div className="notice">Ative pelo menos um atendente antes de agendar.</div>}
  </form>
}
