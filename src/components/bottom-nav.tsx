'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  ['/agenda','◷','Agenda'], ['/fechamento','◉','Fechamento'], ['/relatorios','▥','Relatórios'], ['/mais','•••','Mais']
] as const
export function BottomNav() {
  const pathname = usePathname()
  return <nav className="bottom-nav">{items.map(([href,icon,label]) => {
    const active = pathname.startsWith(href)
    return <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}><strong>{icon}</strong><span>{label}</span></Link>
  })}</nav>
}
