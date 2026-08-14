export type ProfileRole = 'owner' | 'admin' | 'agent' | 'attendant'
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type AppointmentEntrySource = 'agenda' | 'adjustment'
export type CommissionMode = 'fixed' | 'percentage'

export type Profile = {
  id: string
  organization_id: string
  full_name: string
  email: string | null
  role: ProfileRole
  active: boolean
  must_change_password: boolean
}

export function isOrganizationManager(role: ProfileRole) {
  return role === 'owner' || role === 'admin'
}

export function canManageAppointments(role: ProfileRole) {
  return ['owner', 'admin', 'agent', 'attendant'].includes(role)
}

export type Appointment = {
  id: string
  client_id?: string | null
  client_name: string
  client_phone: string | null
  starts_at: string
  ends_at: string
  duration_min: number
  price: number
  net_amount: number
  entry_source: AppointmentEntrySource
  status: AppointmentStatus
  commission_amount: number
  notes: string | null
  agent_id: string
  attendant_id: string
  agent?: { full_name: string } | null
  attendant?: { full_name: string } | null
}
