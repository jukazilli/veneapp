import { Resend } from 'resend'

type TransactionalEmail = {
  to: string
  subject: string
  html: string
  text: string
  idempotencyKey?: string
}

export function getEmailEnvironment() {
  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) throw new Error('Configuração de e-mail incompleta.')
  return { apiKey, from }
}

export async function sendTransactionalEmail(message: TransactionalEmail) {
  const { apiKey, from } = getEmailEnvironment()
  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
  }, message.idempotencyKey ? { idempotencyKey: message.idempotencyKey } : undefined)

  if (error) throw new Error('O provedor recusou o envio.')
}
