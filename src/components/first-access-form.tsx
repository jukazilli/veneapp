'use client'

import { useActionState } from 'react'
import { completeFirstAccessAction, type FirstAccessState } from '@/app/invite-actions'

const INITIAL_STATE: FirstAccessState = {}

export function FirstAccessForm() {
  const [state, action, pending] = useActionState(completeFirstAccessAction, INITIAL_STATE)
  return <form action={action} className="form">
    {state.error && <div className="notice error" role="alert">{state.error}</div>}
    <div className="field"><label>Nova senha</label><input className="input" name="password" type="password" minLength={8} autoComplete="new-password" required /><span className="field-hint">Mínimo de 8 caracteres.</span></div>
    <div className="field"><label>Repita a nova senha</label><input className="input" name="password_confirmation" type="password" minLength={8} autoComplete="new-password" required /></div>
    <button className="button button-primary" disabled={pending}>{pending ? 'Salvando…' : 'Criar minha senha'}</button>
  </form>
}
