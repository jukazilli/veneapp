'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendTransactionalEmail } from '@/lib/email'
import { renderInvitationEmail } from '@/lib/invitation-email'
import {
  buildWhatsAppInvitationUrl,
  isAssignableRole,
  isStrongTemporaryPassword,
} from '@/lib/invitations'
import { requireUser } from '@/lib/session'
import { getRequestOrigin } from '@/lib/site-url'
import { createAdminClient } from '@/lib/supabase/admin'

export type InviteMemberState = {
  error?: string
  success?: string
  warning?: string
  whatsappUrl?: string | null
  temporaryPassword?: string
}

export type FirstAccessState = { error?: string }

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function inviteMemberAction(_: InviteMemberState, formData: FormData): Promise<InviteMemberState> {
  const { supabase, profile } = await requireUser()
  const mode = String(formData.get('mode') || 'team')
  const isOnboarding = mode === 'onboarding'

  if (!['owner', 'admin'].includes(profile.role)) {
    return { error: 'Seu perfil não pode convidar pessoas.' }
  }
  if (isOnboarding && profile.role !== 'owner') {
    return { error: 'Somente o proprietário conclui o onboarding da organização.' }
  }

  const fullName = String(formData.get('full_name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const phone = String(formData.get('phone') || '').trim()
  const role = String(formData.get('role') || '')
  const temporaryPassword = String(formData.get('temporary_password') || '')
  const requestedOrganizationName = String(formData.get('organization_name') || '').trim()

  if (fullName.length < 2 || fullName.length > 120) return { error: 'Informe o nome da pessoa.' }
  if (!validEmail(email)) return { error: 'Informe um e-mail válido.' }
  if (!isAssignableRole(role)) return { error: 'Escolha um perfil válido.' }
  if (!isStrongTemporaryPassword(temporaryPassword)) {
    return { error: 'A senha temporária precisa ter 12 caracteres, com maiúscula, minúscula, número e símbolo.' }
  }
  if (isOnboarding && (requestedOrganizationName.length < 2 || requestedOrganizationName.length > 120)) {
    return { error: 'Informe o nome da organização.' }
  }

  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('id,name,onboarding_completed_at')
    .eq('id', profile.organization_id)
    .single()

  if (organizationError || !organization) return { error: 'Não foi possível carregar a organização.' }
  if (isOnboarding && organization.onboarding_completed_at) {
    return { error: 'Este onboarding já foi concluído.' }
  }

  const organizationName = isOnboarding ? requestedOrganizationName : organization.name
  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return { error: 'Os convites ainda não estão configurados no servidor.' }
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: {
      veneapp_invitation: true,
      organization_id: profile.organization_id,
      organization_role: role,
      invited_by: profile.id,
    },
  })

  if (createError || !created.user) {
    const alreadyExists = createError?.message.toLowerCase().includes('already')
      || createError?.message.toLowerCase().includes('registered')
    return { error: alreadyExists ? 'Este e-mail já possui uma conta.' : 'Não foi possível criar o acesso convidado.' }
  }

  if (isOnboarding) {
    const { error: onboardingError } = await supabase
      .from('organizations')
      .update({ name: organizationName, onboarding_completed_at: new Date().toISOString() })
      .eq('id', profile.organization_id)

    if (onboardingError) {
      await adminClient.auth.admin.deleteUser(created.user.id)
      return { error: 'Não foi possível concluir a configuração da organização.' }
    }
  }

  const origin = await getRequestOrigin()
  const loginUrl = `${origin}/login?invite=ready`
  const whatsappUrl = buildWhatsAppInvitationUrl({
    phone,
    fullName,
    organizationName,
    role,
    email,
    temporaryPassword,
    loginUrl,
  })

  let warning: string | undefined
  try {
    const message = renderInvitationEmail({
      fullName,
      inviterName: profile.full_name,
      organizationName,
      role,
      email,
      temporaryPassword,
      loginUrl,
    })
    await sendTransactionalEmail({
      to: email,
      ...message,
      idempotencyKey: `organization-invite-${created.user.id}`,
    })
  } catch {
    console.error('Resend organization invitation delivery failed.')
    warning = 'O acesso foi criado, mas o e-mail não pôde ser entregue. Compartilhe a senha temporária por um canal seguro.'
  }

  revalidatePath('/equipe')
  revalidatePath('/agenda')
  if (isOnboarding) revalidatePath('/onboarding')

  return {
    success: `${fullName} já pode acessar a organização.`,
    warning,
    whatsappUrl,
    temporaryPassword,
  }
}

export async function completeFirstAccessAction(_: FirstAccessState, formData: FormData): Promise<FirstAccessState> {
  const { supabase, profile } = await requireUser()
  if (!profile.must_change_password) redirect('/agenda')

  const password = String(formData.get('password') || '')
  const confirmation = String(formData.get('password_confirmation') || '')
  if (password.length < 8) return { error: 'A nova senha precisa ter pelo menos 8 caracteres.' }
  if (password !== confirmation) return { error: 'As senhas não coincidem.' }

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return { error: 'O primeiro acesso ainda não está configurado no servidor.' }
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password })
  if (passwordError) return { error: 'Não foi possível salvar a nova senha.' }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', profile.id)
    .eq('must_change_password', true)
  if (profileError) return { error: 'A senha mudou, mas não foi possível concluir o primeiro acesso. Entre novamente e tente concluir.' }

  revalidatePath('/agenda')
  redirect('/agenda')
}
