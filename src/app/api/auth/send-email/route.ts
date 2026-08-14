import { NextResponse } from 'next/server'
import { Webhook } from 'standardwebhooks'
import { renderAuthEmail, type SendEmailHookPayload } from '@/lib/auth-email'
import { sendTransactionalEmail } from '@/lib/email'

export const runtime = 'nodejs'

function getRequiredEnvironment() {
  const hookSecret = process.env.SEND_EMAIL_HOOK_SECRET

  if (!hookSecret) throw new Error('Configuração do hook de e-mail incompleta.')
  return { hookSecret: hookSecret.replace(/^v1,whsec_/, '') }
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
    await sendTransactionalEmail({
      to: payload.user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      idempotencyKey: webhookId ? `supabase-auth-${webhookId}` : undefined,
    })
    return NextResponse.json({})
  } catch {
    console.error('Resend auth email delivery failed.')
    return NextResponse.json(
      { error: { http_code: 502, message: 'Não foi possível entregar o e-mail de autenticação.' } },
      { status: 502 },
    )
  }
}
