'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import {
  forgotPasswordAction,
  loginAction,
  signupAction,
  updatePasswordAction,
  type AuthActionState,
} from '@/app/auth-actions'
import { HumanCheck } from '@/components/human-check'

const initialAuthState: AuthActionState = {}

export function LoginForm({ notice, noticeKind = 'success' }: { notice?: string; noticeKind?: 'success' | 'error' }) {
  const [state, action, pending] = useActionState(loginAction, initialAuthState)
  return <form action={action} className="form">
    {notice && <div className={`notice ${noticeKind === 'error' ? 'error' : 'success-box'}`} role={noticeKind === 'error' ? 'alert' : 'status'}>{notice}</div>}
    {state?.error && <div className="notice error">{state.error}</div>}
    <div className="field"><label>E-mail</label><input className="input" name="email" type="email" autoComplete="email" inputMode="email" required /></div>
    <div className="field"><div className="field-label-row"><label>Senha</label><Link href="/esqueci-senha" className="inline-link">Esqueci minha senha</Link></div><input className="input" name="password" type="password" autoComplete="current-password" required /></div>
    <button className="button button-primary" disabled={pending}>{pending ? 'Entrando…' : 'Entrar no Veneapp'}</button>
    <Link href="/cadastro" className="button button-secondary">Criar conta</Link>
  </form>
}

export function SignupForm({ challenge }: { challenge: { items: string[]; token: string } }) {
  const [state, action, pending] = useActionState(signupAction, initialAuthState)
  if (state?.success) return <div className="stack">
    <div className="notice success-box" role="status">{state.success}</div>
    <p className="muted small">Abra o link recebido antes de tentar entrar. Se necessário, confira a pasta de spam.</p>
    <Link href="/login" className="button button-primary">Voltar para o login</Link>
  </div>

  return <form action={action} className="form">
    {state?.error && <div className="notice error">{state.error}</div>}
    <div className="field"><label>Nome</label><input className="input" name="full_name" autoComplete="name" required /></div>
    <div className="field"><label>E-mail</label><input className="input" name="email" type="email" autoComplete="email" inputMode="email" required /></div>
    <div className="field"><label>Senha</label><input className="input" name="password" type="password" minLength={8} autoComplete="new-password" required /><span className="field-hint">Mínimo de 8 caracteres.</span></div>
    <div className="anti-spam-field" aria-hidden="true"><label>Website</label><input name="company_website" tabIndex={-1} autoComplete="off" /></div>
    <HumanCheck items={challenge.items} token={challenge.token} />
    <button className="button button-primary" disabled={pending}>{pending ? 'Criando…' : 'Criar minha conta'}</button>
    <Link href="/login" className="button button-secondary">Já tenho conta</Link>
  </form>
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialAuthState)
  return <form action={action} className="form">
    {state?.error && <div className="notice error" role="alert">{state.error}</div>}
    {state?.success && <div className="notice success-box" role="status">{state.success}</div>}
    <div className="field"><label>E-mail</label><input className="input" name="email" type="email" autoComplete="email" inputMode="email" required /></div>
    <button className="button button-primary" disabled={pending}>{pending ? 'Enviando…' : 'Enviar link de redefinição'}</button>
    <Link href="/login" className="button button-secondary">Voltar para o login</Link>
  </form>
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialAuthState)
  return <form action={action} className="form">
    {state?.error && <div className="notice error" role="alert">{state.error}</div>}
    <div className="field"><label>Nova senha</label><input className="input" name="password" type="password" minLength={8} autoComplete="new-password" required /><span className="field-hint">Mínimo de 8 caracteres.</span></div>
    <div className="field"><label>Repita a nova senha</label><input className="input" name="password_confirmation" type="password" minLength={8} autoComplete="new-password" required /></div>
    <button className="button button-primary" disabled={pending}>{pending ? 'Salvando…' : 'Salvar nova senha'}</button>
  </form>
}
