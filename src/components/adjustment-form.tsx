'use client'

import { useActionState, useState } from 'react'
import { createAdjustmentAction } from '@/app/(app)/actions'
import { commissionAmountFor } from '@/lib/finance'
import { money } from '@/lib/format'
import type { CommissionMode } from '@/lib/types'

type PersonOption = { id: string; full_name: string }

export function AdjustmentForm({
  today,
  agents,
  attendants,
  defaultAgentId,
  defaultAttendantId,
  commissionMode,
  commissionValue,
}: {
  today: string
  agents: PersonOption[]
  attendants: PersonOption[]
  defaultAgentId: string
  defaultAttendantId: string
  commissionMode: CommissionMode
  commissionValue: number
}) {
  const [state, action, pending] = useActionState(createAdjustmentAction, {})
  const [priceValue, setPriceValue] = useState('')
  const gross = Number(priceValue)
  const hasValidGross = Number.isFinite(gross) && gross > 0
  const commission = hasValidGross ? commissionAmountFor(gross, commissionMode, commissionValue) : 0
  const attendantNet = hasValidGross ? gross - commission : 0
  const commissionExceedsGross = hasValidGross && commission > gross

  return <form action={action} className="form">
    {state?.error && <div className="notice error">{state.error}</div>}

    <section className="form-section">
      <div className="form-section-title">Atendimento realizado</div>
      <div className="grid-2">
        <div className="field"><label htmlFor="adjustment-client-name">Nome <span className="muted">(opcional)</span></label><input id="adjustment-client-name" className="input" name="client_name" placeholder="Nome do cliente" /></div>
        <div className="field"><label htmlFor="adjustment-client-phone">Telefone / WhatsApp <span className="muted">(opcional)</span></label><input id="adjustment-client-phone" className="input" name="client_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" /></div>
      </div>
      <div className="grid-2">
        <div className="field"><label htmlFor="adjustment-date">Data do atendimento</label><input id="adjustment-date" className="input" name="date" type="date" max={today} defaultValue={today} required /></div>
        <div className="field"><label htmlFor="adjustment-price">Valor</label><input id="adjustment-price" className="input" name="price" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0,00" value={priceValue} onChange={event => setPriceValue(event.target.value)} required /></div>
      </div>
    </section>

    <section className="form-section">
      <div className="form-section-title">Responsáveis</div>
      <div className="grid-2">
        <div className="field"><label htmlFor="adjustment-attendant">Atendente</label><select id="adjustment-attendant" className="select" name="attendant_id" defaultValue={defaultAttendantId} required><option value="" disabled>Selecione</option>{attendants.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></div>
        <div className="field"><label htmlFor="adjustment-agent">Agente da comissão</label><select id="adjustment-agent" className="select" name="agent_id" defaultValue={defaultAgentId} required><option value="" disabled>Selecione</option>{agents.map(person => <option key={person.id} value={person.id}>{person.full_name}</option>)}</select></div>
      </div>
    </section>

    <div className="card adjustment-preview" aria-live="polite">
      <div className="row-between"><span>Faturamento bruto</span><strong>{money(hasValidGross ? gross : 0)}</strong></div>
      <div className="row-between"><span>Comissão do agente</span><strong>{money(commission)}</strong></div>
      <div className="divider" />
      <div className="row-between"><span>Líquido do atendente</span><strong>{money(attendantNet)}</strong></div>
      <div className="field-hint">Cálculo conforme a comissão atual das configurações.</div>
    </div>

    {commissionExceedsGross && <div className="notice error">O valor precisa ser maior ou igual à comissão configurada.</div>}

    <button className="button button-primary" disabled={pending || commissionExceedsGross || !agents.length || !attendants.length}>{pending ? 'Salvando ajuste…' : 'Salvar ajuste'}</button>
    {(!agents.length || !attendants.length) && <div className="notice">Ative pelo menos um agente e um atendente antes de lançar ajustes.</div>}
  </form>
}
