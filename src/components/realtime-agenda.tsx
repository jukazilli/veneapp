'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { money, time } from '@/lib/format'
import type { Appointment } from '@/lib/types'

const statusLabel = { scheduled: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não compareceu' }
const statusClass = { scheduled: '', completed: 'success', cancelled: 'danger', no_show: 'warning' }

export function RealtimeAgenda({ appointments, organizationId }: { appointments: Appointment[]; organizationId: string }) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`agenda:${organizationId}`).on('postgres_changes', {
      event: '*', schema: 'public', table: 'appointments', filter: `organization_id=eq.${organizationId}`,
    }, () => {
      setSyncing(true)
      router.refresh()
      window.setTimeout(() => setSyncing(false), 800)
    }).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [organizationId, router])

  const summary = useMemo(() => ({
    scheduled: appointments.filter(item => item.status === 'scheduled').length,
    completed: appointments.filter(item => item.status === 'completed').length,
    cancelled: appointments.filter(item => item.status === 'cancelled').length,
  }), [appointments])

  const nextId = useMemo(() => appointments.find(item => item.status === 'scheduled' && new Date(item.starts_at).getTime() >= Date.now())?.id, [appointments])

  return <div className="stack">
    <div className="agenda-summary" aria-label="Resumo da agenda">
      <span><strong>{summary.scheduled}</strong> confirmados</span>
      <span><strong>{summary.completed}</strong> concluídos</span>
      <span className="sync-state"><i className={syncing ? 'sync-dot syncing' : 'sync-dot'} />{syncing ? 'Sincronizando' : 'Em tempo real'}</span>
    </div>

    {!appointments.length ? <div className="card empty"><strong>Agenda livre.</strong><div className="small" style={{ marginTop: 6 }}>Nenhum atendimento para este dia.</div></div> :
      <div className="timeline">{appointments.map(item => <Link href={`/agenda/${item.id}`} className={`card card-link appt ${item.id === nextId ? 'next-appt' : ''} ${item.status === 'cancelled' ? 'muted-appt' : ''}`} key={item.id}>
        <div className="appt-time">{time(item.starts_at)}</div>
        <div className="appt-body">
          <div className="row-between"><div className="appt-title">{item.client_name}</div><span className={`badge ${statusClass[item.status]}`}>{statusLabel[item.status]}</span></div>
          <div className="appt-meta">{item.attendant?.full_name || 'Atendente'} · {item.duration_min} min</div>
          <div className="row-between" style={{ marginTop: 8 }}><span className="small muted">Agente: {item.agent?.full_name || '—'}</span><strong>{money(item.price)}</strong></div>
        </div>
      </Link>)}</div>}
  </div>
}
