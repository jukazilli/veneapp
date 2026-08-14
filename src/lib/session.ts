import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export async function requireUser() {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) redirect('/login')
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id,organization_id,full_name,email,role,active,must_change_password')
    .eq('id', userId)
    .single()
  if (error || !profile) redirect('/login')
  return { supabase, userId, profile: profile as Profile }
}
