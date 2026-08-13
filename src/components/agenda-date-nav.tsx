'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function AgendaDateNav({ date, previous, next, today }: { date: string; previous: string; next: string; today: string }) {
  const router = useRouter()
  return <div className="date-nav">
    <Link href={`/agenda?date=${previous}`} className="icon-button" aria-label="Dia anterior">‹</Link>
    <input
      className="date-input"
      type="date"
      value={date}
      aria-label="Data da agenda"
      onChange={event => router.push(`/agenda?date=${event.target.value}`)}
    />
    <Link href={`/agenda?date=${next}`} className="icon-button" aria-label="Próximo dia">›</Link>
    {date !== today && <Link href={`/agenda?date=${today}`} className="today-link">Hoje</Link>}
  </div>
}
