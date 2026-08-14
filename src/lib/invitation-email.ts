import { ROLE_LABEL, type AssignableRole } from '@/lib/invitations'

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character)
}

export function renderInvitationEmail(input: {
  fullName: string
  inviterName: string
  organizationName: string
  role: AssignableRole
  email: string
  temporaryPassword: string
  loginUrl: string
}) {
  const subject = `Seu acesso à ${input.organizationName} no Veneapp`
  const name = escapeHtml(input.fullName)
  const inviter = escapeHtml(input.inviterName)
  const organization = escapeHtml(input.organizationName)
  const role = escapeHtml(ROLE_LABEL[input.role])
  const email = escapeHtml(input.email)
  const password = escapeHtml(input.temporaryPassword)
  const loginUrl = escapeHtml(input.loginUrl)

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#fff7fb;color:#0b0b0f;font-family:Nunito,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">Seu acesso ao Veneapp está pronto.</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7fb;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #f0d9e4;border-radius:18px;padding:32px">
<tr><td><div style="font-size:28px;font-weight:900;letter-spacing:-1.5px;margin-bottom:28px">veneapp<span style="color:#ff4fa3">.</span></div>
<p style="margin:0 0 10px;color:#746772">Olá, ${name}.</p><h1 style="font-size:26px;line-height:1.15;margin:0 0 12px">Seu acesso está pronto</h1>
<p style="font-size:16px;line-height:1.55;color:#51464f;margin:0 0 20px">${inviter} convidou você para <strong>${organization}</strong> como <strong>${role}</strong>.</p>
<div style="background:#fff7fb;border:1px solid #f0d9e4;border-radius:14px;padding:16px;margin-bottom:22px">
<p style="margin:0 0 8px"><strong>E-mail:</strong> ${email}</p><p style="margin:0"><strong>Senha temporária:</strong> ${password}</p></div>
<a href="${loginUrl}" style="display:inline-block;background:#ff4fa3;color:#0b0b0f;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:14px">Entrar no Veneapp</a>
<p style="font-size:13px;line-height:1.5;color:#746772;margin:24px 0 0">No primeiro acesso, você precisará trocar a senha temporária. Não compartilhe estas credenciais.</p>
</td></tr></table><p style="font-size:12px;color:#746772;margin:18px 0 0">Veneapp · soberania.tech</p></td></tr></table></body></html>`

  const text = `${input.fullName},\n\n${input.inviterName} convidou você para ${input.organizationName} no Veneapp.\nPerfil: ${ROLE_LABEL[input.role]}\nE-mail: ${input.email}\nSenha temporária: ${input.temporaryPassword}\n\nEntrar: ${input.loginUrl}\n\nVocê precisará trocar a senha no primeiro acesso.`
  return { subject, html, text }
}
