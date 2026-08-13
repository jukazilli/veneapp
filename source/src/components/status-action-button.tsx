'use client'

import { useActionState } from 'react'
import { updateAppointmentStatusAction } from '@/app/(app)/actions'
import type { AppointmentStatus } from '@/lib/types'

export function StatusActionButton({
  id,
  status,
  label,
  tone = 'secondary',
}: {
  id: string
  status: AppointmentStatus
  label: string
  tone?: 'primary' | 'secondary' | 'danger'
}) {
  const [state, action, pending] = useActionState(updateAppointmentStatusAction, {})
  return <div className="stack compact-stack">
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`button button-${tone} full-button`} disabled={pending}>
        {pending ? 'Salvando…' : label}
      </button>
    </form>
    {state?.error && <div className="notice error">{state.error}</div>}
    {state?.success && <div className="notice success-box">{state.success}</div>}
  </div>
}
