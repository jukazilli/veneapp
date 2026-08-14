const TIME_ZONE = 'America/Sao_Paulo'

export function money(value: number | string | null | undefined) {
  const number = typeof value === 'string' ? Number(value) : value ?? 0
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

export function dateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

export function dateOnly(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(value))
}

export function time(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    weekday: 'short', day: '2-digit', month: 'short',
  }).format(new Date(value))
}

export function whatsappUrl(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const international = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${international}`
}
