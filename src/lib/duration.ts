export const MIN_DURATION_MINUTES = 5
export const MAX_DURATION_MINUTES = 12 * 60

export function parseDurationHHMM(value: FormDataEntryValue | string | null | undefined) {
  const match = String(value ?? '').trim().match(/^(\d{2}):([0-5]\d)$/)
  if (!match) return null

  const totalMinutes = Number(match[1]) * 60 + Number(match[2])
  if (totalMinutes < MIN_DURATION_MINUTES || totalMinutes > MAX_DURATION_MINUTES) return null
  return totalMinutes
}

export function formatDurationHHMM(minutes: number) {
  const safeMinutes = Number.isInteger(minutes) && minutes >= 0 ? minutes : 0
  const hours = Math.floor(safeMinutes / 60)
  const remainder = safeMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function normalizeDurationTyping(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}
