import type { ProfileRole } from '@/lib/types'

export type AssignableRole = Exclude<ProfileRole, 'owner'>

export const ROLE_LABEL: Record<ProfileRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  agent: 'Agente',
  attendant: 'Atendente',
}

export function isAssignableRole(value: string): value is AssignableRole {
  return value === 'admin' || value === 'agent' || value === 'attendant'
}

export function isStrongTemporaryPassword(value: string) {
  return value.length >= 12
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value)
}

export function buildWhatsAppInvitationUrl(input: {
  phone: string
  fullName: string
  organizationName: string
  role: AssignableRole
  email: string
  temporaryPassword: string
  loginUrl: string
}) {
  const digits = input.phone.replace(/\D/g, '')
  if (!digits) return null
  const international = digits.startsWith('55') ? digits : `55${digits}`
  const message = [
    `Olá, ${input.fullName}! Você foi convidado(a) para a organização ${input.organizationName} no Veneapp.`,
    `Perfil: ${ROLE_LABEL[input.role]}`,
    `E-mail: ${input.email}`,
    `Senha temporária: ${input.temporaryPassword}`,
    `Acesse ${input.loginUrl} e crie uma nova senha no primeiro acesso.`,
  ].join('\n')

  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`
}
