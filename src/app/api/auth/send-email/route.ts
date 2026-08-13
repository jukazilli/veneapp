import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { Webhook } from 'standardwebhooks'
import { renderAuthEmail, type SendEmailHookPayload } from '@/lib/auth-email'

export const runtime = 'nodejs'

function getRequiredEnvironment() {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_KEY
  const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !hookSecret || !from) throw new Error('Configuração de e-mail incompleta.')
  return { apiKey, hookSecret: hookSecret.replace(/^v1,whsec_/, ''), from }
}

export async function POST(request: Request) {
  const rawPayload = await request.text()
  if (rawPayload.length > 64_000) {
    return NextResponse.json({ error: { http_code: 413, message: 'Payload muito grande.' } }, { status: 413 })
  }

  let environment: ReturnType<typeof getRequiredEnvironment>
  try {
    environment = getRequiredEnvironment()
  } catch {
    console.error('Auth email hook is missing required environment variables.')
    return NextResponse.json(
      { error: { http_code: 500, message: 'Serviço de e-mail não configurado.' } },
      { status: 500 },
    )
  }

  const headers = Object.fromEntries(request.headers)
  let payload: SendEmailHookPayload
  try {
    payload = new Webhook(environment.hookSecret).verify(rawPayload, headers) as SendEmailHookPayload
  } catch {
    return NextResponse.json(
      { error: { http_code: 401, message: 'Assinatura do hook inválida.' } },
      { status: 401 },
    )
  }

  if (!payload.user.email) {
    return NextResponse.json(
      { error: { http_code: 422, message: 'Destinatário ausente.' } },
      { status: 422 },
    )
  }

  try {
    const email = renderAuthEmail(payload)
    const webhookId = request.headers.get('webhook-id')
    const { error } = await new Resend(environment.apiKey).emails.send({
      from: environment.from,
      to: [payload.user.email],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }, webhookId ? { idempotencyKey: `supabase-auth-${webhookId}` } : undefined)

    if (error) throw new Error('O provedor recusou o envio.')
    return NextResponse.json({})
  } catch {
    console.error('Resend auth email delivery failed.')
    return NextResponse.json(
      { error: { http_code: 502, message: 'Não foi possível entregar o e-mail de autenticação.' } },
      { status: 502 },
    )
  }
}
