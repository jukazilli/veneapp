const TIME_ZONE = 'America/Sao_Paulo'

function offsetMs(date: Date, timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]))
  const asUtc = Date.UTC(+map.year, +map.month - 1, +map.day, +map.hour, +map.minute, +map.second)
  return asUtc - date.getTime()
}

export function zonedLocalToIso(date: string, time: string, timeZone = TIME_ZONE) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const firstOffset = offsetMs(guess, timeZone)
  const first = new Date(guess.getTime() - firstOffset)
  const secondOffset = offsetMs(first, timeZone)
  return new Date(guess.getTime() - secondOffset).toISOString()
}

export function localDateString(date = new Date(), timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date)
  const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]))
  return `${map.year}-${map.month}-${map.day}`
}

export function dayBounds(localDate: string, timeZone = TIME_ZONE) {
  const start = zonedLocalToIso(localDate, '00:00', timeZone)
  const d = new Date(`${localDate}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  const next = localDateString(d, 'UTC')
  const end = zonedLocalToIso(next, '00:00', timeZone)
  return { start, end }
}

export function periodBounds(period: 'week' | 'month', base = new Date()) {
  const today = localDateString(base)
  const [y,m,d] = today.split('-').map(Number)
  const pivot = new Date(Date.UTC(y,m-1,d,12))
  let startDate: Date
  let endDate: Date
  if (period === 'week') {
    const day = pivot.getUTCDay() || 7
    startDate = new Date(pivot)
    startDate.setUTCDate(pivot.getUTCDate() - day + 1)
    endDate = new Date(startDate)
    endDate.setUTCDate(startDate.getUTCDate() + 7)
  } else {
    startDate = new Date(Date.UTC(y,m-1,1,12))
    endDate = new Date(Date.UTC(y,m,1,12))
  }
  const startLocal = localDateString(startDate, 'UTC')
  const endLocal = localDateString(endDate, 'UTC')
  return {
    start: zonedLocalToIso(startLocal, '00:00'),
    end: zonedLocalToIso(endLocal, '00:00'),
    startLocal,
    endLocal,
  }
}

export function shiftLocalDate(localDate: string, days: number) {
  const [year, month, day] = localDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  date.setUTCDate(date.getUTCDate() + days)
  return localDateString(date, 'UTC')
}

export function localTimeString(date = new Date(), timeZone = TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]))
  return `${map.hour}:${map.minute}`
}

export function nextQuarterHourString(date = new Date(), timeZone = TIME_ZONE) {
  const localDate = localDateString(date, timeZone)
  const localTime = localTimeString(date, timeZone)
  const [hour, minute] = localTime.split(':').map(Number)
  const total = hour * 60 + minute
  const rounded = Math.ceil((total + 1) / 15) * 15
  if (rounded >= 24 * 60) return { date: shiftLocalDate(localDate, 1), time: '00:00' }
  return {
    date: localDate,
    time: `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`,
  }
}
