import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config'

const HEALTH_TIMEOUT_MS = 4_000

export async function GET() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)
  const emailDeliveryConfigured = Boolean(
    (process.env.RESEND_API_KEY || process.env.RESEND_KEY)
    && process.env.RESEND_FROM_EMAIL
    && process.env.SEND_EMAIL_HOOK_SECRET,
  )

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

    const healthy = authResponse.ok && emailDeliveryConfigured
    return Response.json({
      status: healthy ? 'ok' : 'degraded',
      app: 'veneapp',
      version: '0.3.0',
      environment: process.env.VERCEL_ENV || 'local',
      checks: {
        supabaseAuth: authResponse.ok ? 'ok' : `http_${authResponse.status}`,
        emailDelivery: emailDeliveryConfigured ? 'configured' : 'missing_configuration',
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
      version: '0.3.0',
      environment: process.env.VERCEL_ENV || 'local',
      checks: {
        supabaseAuth: reason,
        emailDelivery: emailDeliveryConfigured ? 'configured' : 'missing_configuration',
      },
    }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  } finally {
    clearTimeout(timer)
  }
}
