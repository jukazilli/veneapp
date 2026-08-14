'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { inviteMemberAction, type InviteMemberState } from '@/app/invite-actions'

const INITIAL_STATE: InviteMemberState = {}
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%&*'
const ALL = LOWER + UPPER + DIGITS + SYMBOLS

function randomCharacter(alphabet: string) {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return alphabet[values[0] % alphabet.length]
}

function generatePassword() {
  const required = [LOWER, UPPER, DIGITS, SYMBOLS].map(randomCharacter)
  const remaining = Array.from({ length: 10 }, () => randomCharacter(ALL))
  const characters = [...required, ...remaining]
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    const target = values[0] % (index + 1)
    ;[characters[index], characters[target]] = [characters[target], characters[index]]
  }
  return characters.join('')
}

export function InviteMemberForm({
  mode = 'team',
  initialOrganizationName = '',
}: {
  mode?: 'onboarding' | 'team'
  initialOrganizationName?: string
}) {
  const [state, action, pending] = useActionState(inviteMemberAction, INITIAL_STATE)
  const [password, setPassword] = useState('')
  const onboarding = mode === 'onboarding'

  if (state.success) return <div className="stack" aria-live="polite">
    <div className="notice success-box">{state.success}</div>
    {state.warning && <div className="notice error">{state.warning}</div>}
    <div className="credential-card">
      <span className="small muted">Senha temporária — exibida uma vez</span>
      <strong>{state.temporaryPassword}</strong>
    </div>
    {state.whatsappUrl && <a className="button button-primary" href={state.whatsappUrl} target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a>}
    {onboarding
      ? <Link className="button button-secondary" href="/agenda">Abrir minha agenda</Link>
      : <button className="button button-secondary" type="button" onClick={() => window.location.reload()}>Convidar outra pessoa</button>}
  </div>

  return <form action={action} className="form">
    <input type="hidden" name="mode" value={mode} />
    {state.error && <div className="notice error" role="alert">{state.error}</div>}

    {onboarding && <fieldset className="form-section">
      <legend className="form-section-title">Sua organização</legend>
      <div className="field"><label htmlFor="organization_name">Nome da organização</label><input id="organization_name" className="input" name="organization_name" defaultValue={initialOrganizationName} maxLength={120} required /></div>
    </fieldset>}

    <fieldset className="form-section">
      <legend className="form-section-title">Primeiro convite</legend>
      <div className="field"><label htmlFor={`${mode}_full_name`}>Nome</label><input id={`${mode}_full_name`} className="input" name="full_name" autoComplete="name" maxLength={120} required /></div>
      <div className="field"><label htmlFor={`${mode}_email`}>E-mail</label><input id={`${mode}_email`} className="input" name="email" type="email" autoComplete="email" inputMode="email" required /></div>
      <div className="field"><label htmlFor={`${mode}_phone`}>WhatsApp <span className="muted">(opcional)</span></label><input id={`${mode}_phone`} className="input" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(11) 99999-9999" /></div>
      <div className="field"><label htmlFor={`${mode}_role`}>Perfil</label><select id={`${mode}_role`} className="select" name="role" defaultValue="attendant" required>
        <option value="admin">Administrador — gerencia equipe e configurações</option>
        <option value="attendant">Atendente — executa atendimentos</option>
        <option value="agent">Agente — cria e gerencia agendamentos</option>
      </select></div>
    </fieldset>

    <fieldset className="form-section">
      <legend className="form-section-title">Acesso temporário</legend>
      <div className="field">
        <div className="field-label-row"><label htmlFor={`${mode}_temporary_password`}>Senha temporária</label><button className="inline-action" type="button" onClick={() => setPassword(generatePassword())}>Gerar senha</button></div>
        <input id={`${mode}_temporary_password`} className="input" name="temporary_password" type="text" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={12} required />
        <span className="field-hint">Use 12 caracteres ou mais, com maiúscula, minúscula, número e símbolo.</span>
      </div>
    </fieldset>

    <button className="button button-primary" disabled={pending}>{pending ? 'Criando acesso…' : onboarding ? 'Convidar e concluir' : 'Enviar convite'}</button>
  </form>
}
