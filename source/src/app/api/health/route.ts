import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config'

const HEALTH_TIMEOUT_MS = 4_000

export async function GET() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

  try {
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      cache: 'no-store',
      signal: controller.signal,
    })

    let authVersion: string | null = null
    if (authResponse.ok) {
      const payload = await authResponse.json().catch(() => null) as { version?: string } | null
      authVersion = payload?.version || null
    }

    const healthy = authResponse.ok
    return Response.json({
      status: healthy ? 'ok' : 'degraded',
      app: 'veneapp',
      version: '0.2.2',
      environment: process.env.VERCEL_ENV || 'local',
      checks: {
        supabaseAuth: healthy ? 'ok' : `http_${authResponse.status}`,
      },
      supabaseAuthVersion: authVersion,
    }, {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    const reason = error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'unreachable'
    return Response.json({
      status: 'degraded',
      app: 'veneapp',
      version: '0.2.2',
      environment: process.env.VERCEL_ENV || 'local',
      checks: { supabaseAuth: reason },
    }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  } finally {
    clearTimeout(timer)
  }
}
