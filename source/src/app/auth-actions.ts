'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { verifyHumanChallenge } from '@/lib/human-challenge'

export async function loginAction(_: { error?: string }, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  if (!email || !password) return { error: 'Informe e-mail e senha.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Não foi possível entrar. Confira seu e-mail e senha.' }
  redirect('/agenda')
}

export async function signupAction(_: { error?: string; success?: string }, formData: FormData) {
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) return { error: 'Este e-mail já possui uma conta.' }
    return { error: 'Não foi possível criar a conta. Tente novamente.' }
  }

  if (!data.session) {
    return { error: 'O cadastro foi criado, mas o Supabase ainda está exigindo confirmação de e-mail. Desative “Confirm email” no Auth antes do release.' }
  }

  redirect('/agenda')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
