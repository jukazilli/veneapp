'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction, signupAction } from '@/app/auth-actions'
import { HumanCheck } from '@/components/human-check'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {})
  return <form action={action} className="form">
    {state?.error && <div className="notice error">{state.error}</div>}
    <div className="field"><label>E-mail</label><input className="input" name="email" type="email" autoComplete="email" inputMode="email" required /></div>
    <div className="field"><label>Senha</label><input className="input" name="password" type="password" autoComplete="current-password" required /></div>
    <button className="button button-primary" disabled={pending}>{pending ? 'Entrando…' : 'Entrar no Veneapp'}</button>
    <Link href="/cadastro" className="button button-secondary">Criar conta</Link>
  </form>
}

export function SignupForm({ challenge }: { challenge: { items: string[]; token: string } }) {
  const [state, action, pending] = useActionState(signupAction, {})
  return <form action={action} className="form">
    {state?.error && <div className="notice error">{state.error}</div>}
    {state?.success && <div className="notice success-box">{state.success}</div>}
    <div className="field"><label>Nome</label><input className="input" name="full_name" autoComplete="name" required /></div>
    <div className="field"><label>E-mail</label><input className="input" name="email" type="email" autoComplete="email" inputMode="email" required /></div>
    <div className="field"><label>Senha</label><input className="input" name="password" type="password" minLength={8} autoComplete="new-password" required /><span className="field-hint">Mínimo de 8 caracteres.</span></div>
    <div className="anti-spam-field" aria-hidden="true"><label>Website</label><input name="company_website" tabIndex={-1} autoComplete="off" /></div>
    <HumanCheck items={challenge.items} token={challenge.token} />
    <button className="button button-primary" disabled={pending}>{pending ? 'Criando…' : 'Criar minha conta'}</button>
    <Link href="/login" className="button button-secondary">Já tenho conta</Link>
  </form>
}
