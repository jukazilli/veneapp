export type ProfileRole = 'admin' | 'agent' | 'attendant'
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
export type CommissionMode = 'fixed' | 'percentage'

export type Profile = {
  id: string
  organization_id: string
  full_name: string
  email: string | null
  role: ProfileRole
  active: boolean
}

export type Appointment = {
  id: string
  client_name: string
  client_phone: string | null
  starts_at: string
  ends_at: string
  duration_min: number
  price: number
  status: AppointmentStatus
  commission_amount: number
  notes: string | null
  agent_id: string
  attendant_id: string
  agent?: { full_name: string } | null
  attendant?: { full_name: string } | null
}
