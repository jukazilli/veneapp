'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifyHumanChallenge } from '@/lib/human-challenge'
import { getRequestOrigin } from '@/lib/site-url'

export type AuthActionState = {
  error?: string
  success?: string
}

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  if (!email || !password) return { error: 'Informe e-mail e senha.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error?.message.toLowerCase().includes('email not confirmed')) {
    return { error: 'Confirme seu e-mail antes de entrar. Confira também a pasta de spam.' }
  }
  if (error) return { error: 'Não foi possível entrar. Confira seu e-mail e senha.' }
  redirect('/agenda')
}

export async function signupAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const fullName = String(formData.get('full_name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const humanToken = String(formData.get('human_token') || '')
  const humanSelection = String(formData.get('human_selection') || '')
  const honeypot = String(formData.get('company_website') || '').trim()

  if (!fullName || !email || password.length < 8) return { error: 'Preencha os dados. A senha precisa ter pelo menos 8 caracteres.' }
  if (honeypot) return { error: 'Não foi possível validar o cadastro. Tente novamente.' }
  if (!verifyHumanChallenge(humanToken, humanSelection)) return { error: 'Selecione corretamente os dois objetos iguais e tente novamente.' }

  const supabase = await createClient()
  const origin = await getRequestOrigin()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) return { error: 'Este e-mail já possui uma conta.' }
    return { error: 'Não foi possível criar a conta. Tente novamente.' }
  }

  if (!data.session) {
    return { success: 'Cadastro recebido. Enviamos um link de confirmação para o seu e-mail.' }
  }

  redirect('/agenda')
}

export async function forgotPasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  if (!email) return { error: 'Informe seu e-mail.' }

  const supabase = await createClient()
  const origin = await getRequestOrigin()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/redefinir-senha`,
  })

  if (error) return { error: 'Não foi possível solicitar a redefinição agora. Tente novamente em alguns minutos.' }
  return { success: 'Se existir uma conta com este e-mail, você receberá um link para criar uma nova senha.' }
}

export async function updatePasswordAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = String(formData.get('password') || '')
  const passwordConfirmation = String(formData.get('password_confirmation') || '')

  if (password.length < 8) return { error: 'A nova senha precisa ter pelo menos 8 caracteres.' }
  if (password !== passwordConfirmation) return { error: 'As senhas não coincidem.' }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims?.sub) return { error: 'Este link expirou ou já foi usado. Solicite uma nova redefinição.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: 'Não foi possível atualizar sua senha. Solicite um novo link e tente novamente.' }

  await supabase.auth.signOut()
  redirect('/login?password=updated')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
