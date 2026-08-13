'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { zonedLocalToIso } from '@/lib/dates'
import type { AppointmentStatus, CommissionMode, ProfileRole } from '@/lib/types'

export type ActionState = { error?: string; success?: string }

function decimal(value: FormDataEntryValue | null) {
  return Number(String(value ?? '0').replace(',', '.'))
}

function validDuration(value: number) {
  return Number.isInteger(value) && value >= 5 && value <= 720
}

function humanizeDbError(message: string) {
  if (message.includes('Agente inválido')) return 'O agente selecionado está inativo ou não pertence à operação.'
  if (message.includes('Atendente inválido')) return 'O atendente selecionado está inativo ou não pertence à operação.'
  if (message.includes('administrador ativo')) return 'A operação precisa manter pelo menos um administrador ativo.'
  if (message.includes('próprios atendimentos')) return 'Você só pode atualizar atendimentos atribuídos a você.'
  if (message.includes('concluir ou marcar falta')) return 'Como atendente, você pode apenas concluir ou marcar falta em atendimentos confirmados.'
  if (message.includes('não pode alterar dados')) return 'Como atendente, você não pode alterar horário, valor ou outros dados do agendamento.'
  return message
}

export async function createAppointmentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId, profile } = await requireUser()
  if (!['admin', 'agent'].includes(profile.role)) return { error: 'Seu perfil não pode criar agendamentos.' }

  const clientName = String(formData.get('client_name') || '').trim()
  const date = String(formData.get('date') || '')
  const time = String(formData.get('time') || '')
  const attendantId = String(formData.get('attendant_id') || '')
  const agentId = String(formData.get('agent_id') || profile.id)
  const duration = Number(formData.get('duration_min') || 60)
  const price = decimal(formData.get('price'))

  if (!clientName || !date || !time || !attendantId || !agentId) return { error: 'Preencha os campos obrigatórios.' }
  if (!Number.isFinite(price) || price < 0) return { error: 'Informe um valor válido.' }
  if (!validDuration(duration)) return { error: 'Informe uma duração entre 5 e 720 minutos.' }

  const { data: settings } = await supabase
    .from('settings')
    .select('timezone')
    .eq('organization_id', profile.organization_id)
    .single()

  const startsAt = zonedLocalToIso(date, time, settings?.timezone || 'America/Sao_Paulo')
  const { error } = await supabase.from('appointments').insert({
    organization_id: profile.organization_id,
    client_name: clientName,
    client_phone: String(formData.get('client_phone') || '').trim() || null,
    starts_at: startsAt,
    duration_min: duration,
    price,
    status: 'scheduled',
    agent_id: agentId,
    attendant_id: attendantId,
    notes: String(formData.get('notes') || '').trim() || null,
    created_by: userId,
  })

  if (error) {
    if (error.code === '23P01') return { error: 'Esse atendente já possui um atendimento nesse horário.' }
    return { error: humanizeDbError(error.message) }
  }

  revalidatePath('/agenda')
  redirect(`/agenda?date=${date}`)
}

export async function updateAppointmentStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireUser()

  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || '') as AppointmentStatus
  if (!id || !['scheduled', 'completed', 'cancelled', 'no_show'].includes(status)) return { error: 'Ação inválida.' }

  const isManager = ['admin', 'agent'].includes(profile.role)
  const isAttendantAction = profile.role === 'attendant' && ['completed', 'no_show'].includes(status)
  if (!isManager && !isAttendantAction) return { error: 'Seu perfil não pode executar essa ação.' }

  let updateQuery = supabase.from('appointments').update({ status }).eq('id', id)
  if (profile.role === 'attendant') updateQuery = updateQuery.eq('attendant_id', profile.id)
  const { error } = await updateQuery
  if (error) return { error: humanizeDbError(error.message) }

  revalidatePath('/agenda')
  revalidatePath('/fechamento')
  revalidatePath('/relatorios')
  revalidatePath(`/agenda/${id}`)

  const label: Record<AppointmentStatus, string> = {
    scheduled: 'Atendimento reaberto.',
    completed: 'Atendimento concluído.',
    cancelled: 'Cancelamento registrado.',
    no_show: 'Falta registrada.',
  }
  return { success: label[status] }
}

export async function rescheduleAppointmentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireUser()
  if (!['admin', 'agent'].includes(profile.role)) return { error: 'Sem permissão.' }

  const id = String(formData.get('id') || '')
  const date = String(formData.get('date') || '')
  const time = String(formData.get('time') || '')
  const attendantId = String(formData.get('attendant_id') || '')
  const duration = Number(formData.get('duration_min') || 60)
  const price = decimal(formData.get('price'))

  if (!id || !date || !time || !attendantId) return { error: 'Preencha data, hora e atendente.' }
  if (!Number.isFinite(price) || price < 0) return { error: 'Informe um valor válido.' }
  if (!validDuration(duration)) return { error: 'Informe uma duração entre 5 e 720 minutos.' }

  const { data: settings } = await supabase
    .from('settings')
    .select('timezone')
    .eq('organization_id', profile.organization_id)
    .single()

  const startsAt = zonedLocalToIso(date, time, settings?.timezone || 'America/Sao_Paulo')
  const { error } = await supabase.from('appointments').update({
    starts_at: startsAt,
    duration_min: duration,
    attendant_id: attendantId,
    price,
    status: 'scheduled',
  }).eq('id', id)

  if (error?.code === '23P01') return { error: 'Conflito de horário para esse atendente.' }
  if (error) return { error: humanizeDbError(error.message) }

  revalidatePath('/agenda')
  revalidatePath(`/agenda/${id}`)
  return { success: 'Agendamento atualizado e sincronizado.' }
}

export async function recordPaymentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId, profile } = await requireUser()
  if (!['admin', 'attendant'].includes(profile.role)) return { error: 'Seu perfil não pode registrar pagamentos.' }

  const agentId = String(formData.get('agent_id') || '')
  const amount = decimal(formData.get('amount'))
  if (!agentId || !Number.isFinite(amount) || amount <= 0) return { error: 'Informe agente e valor.' }

  const { error } = await supabase.from('agent_payments').insert({
    organization_id: profile.organization_id,
    agent_id: agentId,
    paid_by_id: profile.id,
    amount,
    paid_at: new Date().toISOString(),
    notes: String(formData.get('notes') || '').trim() || null,
    created_by: userId,
  })

  if (error) return { error: humanizeDbError(error.message) }
  revalidatePath('/fechamento')
  revalidatePath('/relatorios')
  return { success: 'Pagamento registrado.' }
}

export async function updateSettingsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireUser()
  if (profile.role !== 'admin') return { error: 'Somente o administrador altera configurações.' }

  const mode = String(formData.get('commission_mode') || 'fixed') as CommissionMode
  const value = decimal(formData.get('commission_value'))
  const duration = Number(formData.get('default_duration_min') || 60)

  if (!['fixed', 'percentage'].includes(mode) || !Number.isFinite(value) || value < 0 || (mode === 'percentage' && value > 100)) {
    return { error: 'Configuração de comissão inválida.' }
  }
  if (!validDuration(duration)) return { error: 'A duração padrão precisa ficar entre 5 e 720 minutos.' }

  const { error } = await supabase.from('settings').update({
    commission_mode: mode,
    commission_value: value,
    default_duration_min: duration,
  }).eq('organization_id', profile.organization_id)

  if (error) return { error: humanizeDbError(error.message) }
  revalidatePath('/configuracoes')
  return { success: 'Configurações salvas.' }
}

export async function updateMemberAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, profile } = await requireUser()
  if (profile.role !== 'admin') return { error: 'Somente administradores podem alterar a equipe.' }

  const id = String(formData.get('id') || '')
  const role = String(formData.get('role') || '') as ProfileRole
  const active = String(formData.get('active') || '') === 'true'
  if (!id || !['admin', 'agent', 'attendant'].includes(role)) return { error: 'Dados inválidos.' }

  const { error } = await supabase.from('profiles').update({ role, active }).eq('id', id)
  if (error) return { error: humanizeDbError(error.message) }

  revalidatePath('/equipe')
  revalidatePath('/agenda')
  return { success: 'Acesso atualizado.' }
}
