import { localDateString, localTimeString, zonedLocalToIso } from './dates.ts'

type BusyInterval = { starts_at: string; ends_at: string }

export type AvailabilityInput = {
  date: string
  durationMin: number
  appointments: BusyInterval[]
  workdayStart?: string
  workdayEnd?: string
  timeZone?: string
  now?: Date
}

const SLOT_STEP_MIN = 5

function ceilToStep(timestamp: number, stepMin = SLOT_STEP_MIN) {
  const stepMs = stepMin * 60_000
  return Math.ceil(timestamp / stepMs) * stepMs
}

export function findBestAvailableTime({
  date,
  durationMin,
  appointments,
  workdayStart = '08:00',
  workdayEnd = '20:00',
  timeZone = 'America/Sao_Paulo',
  now = new Date(),
}: AvailabilityInput) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(durationMin) || durationMin < 5 || durationMin > 720) return null

  const dayStart = new Date(zonedLocalToIso(date, workdayStart, timeZone)).getTime()
  const dayEnd = new Date(zonedLocalToIso(date, workdayEnd, timeZone)).getTime()
  if (!Number.isFinite(dayStart) || !Number.isFinite(dayEnd) || dayEnd <= dayStart) return null

  const today = localDateString(now, timeZone)
  let cursor = dayStart
  if (date === today) cursor = Math.max(cursor, ceilToStep(now.getTime() + 60_000))
  if (date < today || cursor >= dayEnd) return null

  const busy = appointments
    .map(item => ({ start: new Date(item.starts_at).getTime(), end: new Date(item.ends_at).getTime() }))
    .filter(item => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > cursor && item.start < dayEnd)
    .map(item => ({ start: Math.max(item.start, cursor), end: Math.min(item.end, dayEnd) }))
    .sort((a, b) => a.start - b.start)

  const merged: Array<{ start: number; end: number }> = []
  for (const interval of busy) {
    const last = merged.at(-1)
    if (last && interval.start <= last.end) last.end = Math.max(last.end, interval.end)
    else merged.push({ ...interval })
  }

  const gaps: Array<{ start: number; end: number }> = []
  for (const interval of merged) {
    if (interval.start > cursor) gaps.push({ start: cursor, end: interval.start })
    cursor = Math.max(cursor, interval.end)
  }
  if (cursor < dayEnd) gaps.push({ start: cursor, end: dayEnd })

  const durationMs = durationMin * 60_000
  const best = gaps
    .filter(gap => gap.end - gap.start >= durationMs)
    .sort((a, b) => {
      const remainingA = a.end - a.start - durationMs
      const remainingB = b.end - b.start - durationMs
      return remainingA - remainingB || a.start - b.start
    })[0]

  return best ? localTimeString(new Date(best.start), timeZone) : null
}
