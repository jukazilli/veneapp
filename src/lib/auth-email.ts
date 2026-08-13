export type AuthEmailAction =
  | 'signup'
  | 'recovery'
  | 'invite'
  | 'magiclink'
  | 'email_change'
  | 'reauthentication'

export type SendEmailHookPayload = {
  user: {
    email?: string
    user_metadata?: { full_name?: string }
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: AuthEmailAction
    site_url: string
  }
}

const COPY: Record<AuthEmailAction, { subject: string; heading: string; message: string; cta?: string }> = {
  signup: {
    subject: 'Confirme seu e-mail no Veneapp',
    heading: 'Confirme seu e-mail',
    message: 'Só falta validar este endereço para concluir seu cadastro com segurança.',
    cta: 'Confirmar e-mail',
  },
  recovery: {
    subject: 'Redefina sua senha do Veneapp',
    heading: 'Redefina sua senha',
    message: 'Recebemos um pedido para criar uma nova senha para sua conta.',
    cta: 'Criar nova senha',
  },
  invite: {
    subject: 'Você recebeu um convite para o Veneapp',
    heading: 'Seu convite chegou',
    message: 'Use o botão abaixo para aceitar o convite e acessar o Veneapp.',
    cta: 'Aceitar convite',
  },
  magiclink: {
    subject: 'Seu acesso ao Veneapp',
    heading: 'Entre no Veneapp',
    message: 'Use este link único para acessar sua conta com segurança.',
    cta: 'Entrar no Veneapp',
  },
  email_change: {
    subject: 'Confirme seu novo e-mail no Veneapp',
    heading: 'Confirme seu novo e-mail',
    message: 'Use o botão abaixo para concluir a alteração do endereço de e-mail da sua conta.',
    cta: 'Confirmar novo e-mail',
  },
  reauthentication: {
    subject: 'Seu código de segurança do Veneapp',
    heading: 'Código de segurança',
    message: 'Use o código abaixo para confirmar sua identidade. Ele expira em breve.',
  },
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character)
}

export function buildAuthActionUrl(emailData: SendEmailHookPayload['email_data']) {
  const destination = emailData.redirect_to || emailData.site_url
  const url = new URL(destination, emailData.site_url)
  const next = url.searchParams.get('next')

  url.pathname = '/auth/confirm'
  url.search = ''
  url.hash = ''
  url.searchParams.set('token_hash', emailData.token_hash)
  url.searchParams.set('type', emailData.email_action_type)

  if (next?.startsWith('/') && !next.startsWith('//')) url.searchParams.set('next', next)
  return url.toString()
}

export function renderAuthEmail(payload: SendEmailHookPayload) {
  const action = payload.email_data.email_action_type
  const copy = COPY[action] || COPY.magiclink
  const rawName = payload.user.user_metadata?.full_name?.trim() || 'Olá'
  const name = escapeHtml(rawName)
  const token = escapeHtml(payload.email_data.token || '')
  const actionUrl = action === 'reauthentication' ? null : buildAuthActionUrl(payload.email_data)
  const escapedActionUrl = actionUrl ? escapeHtml(actionUrl) : null
  const preheader = escapeHtml(copy.message)

  const actionBlock = escapedActionUrl && copy.cta
    ? `<a href="${escapedActionUrl}" style="display:inline-block;background:#ff4fa3;color:#0b0b0f;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:14px">${escapeHtml(copy.cta)}</a>`
    : `<div style="display:inline-block;background:#fceaf3;color:#0b0b0f;font-size:28px;font-weight:800;letter-spacing:6px;padding:14px 18px;border-radius:14px">${token}</div>`

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(copy.subject)}</title></head>
<body style="margin:0;background:#fff7fb;color:#0b0b0f;font-family:Nunito,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7fb;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #f0d9e4;border-radius:18px;padding:32px">
<tr><td><div style="font-size:28px;font-weight:900;letter-spacing:-1.5px;margin-bottom:28px">veneapp<span style="color:#ff4fa3">.</span></div>
<p style="margin:0 0 10px;color:#746772">${name},</p><h1 style="font-size:26px;line-height:1.15;margin:0 0 12px">${escapeHtml(copy.heading)}</h1>
<p style="font-size:16px;line-height:1.55;color:#51464f;margin:0 0 24px">${preheader}</p>${actionBlock}
<p style="font-size:13px;line-height:1.5;color:#746772;margin:28px 0 0">Se você não solicitou esta ação, ignore este e-mail. O Veneapp nunca pedirá sua senha por e-mail.</p>
</td></tr></table><p style="font-size:12px;color:#746772;margin:18px 0 0">Veneapp · soberania.tech</p></td></tr></table></body></html>`

  const text = actionUrl && copy.cta
    ? `${rawName},\n\n${copy.heading}\n${copy.message}\n\n${copy.cta}: ${actionUrl}\n\nSe você não solicitou esta ação, ignore este e-mail.`
    : `${rawName},\n\n${copy.heading}\n${copy.message}\n\nCódigo: ${payload.email_data.token}\n\nSe você não solicitou esta ação, ignore este e-mail.`

  return { subject: copy.subject, html, text }
}
