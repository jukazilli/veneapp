'use client'

import { deleteAppointmentAction } from '@/app/(app)/actions'

export function DeleteAppointmentButton({ id, date }: { id: string; date: string }) {
  return <form action={deleteAppointmentAction} onSubmit={event => {
    if (!window.confirm('Excluir este agendamento definitivamente? Esta ação não pode ser desfeita.')) event.preventDefault()
  }}>
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="date" value={date} />
    <button className="button button-danger full-button" type="submit">Excluir da agenda</button>
  </form>
}
