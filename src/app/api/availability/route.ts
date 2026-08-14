import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dayBounds } from '@/lib/dates'
import { findBestAvailableTime } from '@/lib/availability'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 })

  const date = request.nextUrl.searchParams.get('date') || ''
  const attendantId = request.nextUrl.searchParams.get('attendant_id') || ''
  const durationMin = Number(request.nextUrl.searchParams.get('duration_min'))
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !attendantId || !Number.isInteger(durationMin) || durationMin < 5 || durationMin > 720) {
    return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id,active')
    .eq('id', userId)
    .single()
  if (!profile?.active) return NextResponse.json({ error: 'Acesso inativo.' }, { status: 403 })

  const [{ data: attendant }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('id').eq('id', attendantId).eq('organization_id', profile.organization_id).eq('role', 'attendant').eq('active', true).maybeSingle(),
    supabase.from('settings').select('timezone,workday_start,workday_end').eq('organization_id', profile.organization_id).single(),
  ])
  if (!attendant) return NextResponse.json({ error: 'Atendente inválido.' }, { status: 400 })

  const timeZone = settings?.timezone || 'America/Sao_Paulo'
  const { start, end } = dayBounds(date, timeZone)
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('starts_at,ends_at')
    .eq('attendant_id', attendantId)
    .eq('status', 'scheduled')
    .gte('starts_at', start)
    .lt('starts_at', end)
    .order('starts_at')

  if (error) return NextResponse.json({ error: 'Não foi possível consultar a agenda.' }, { status: 500 })

  const suggestedTime = findBestAvailableTime({
    date,
    durationMin,
    appointments: appointments || [],
    workdayStart: String(settings?.workday_start || '08:00').slice(0, 5),
    workdayEnd: String(settings?.workday_end || '20:00').slice(0, 5),
    timeZone,
  })

  return NextResponse.json({ suggestedTime })
}
