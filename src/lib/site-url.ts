import { headers } from 'next/headers'

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, '')
}

export async function getRequestOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return normalizeOrigin(configured)

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  if (vercelHost) return normalizeOrigin(`https://${vercelHost}`)

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https')

  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}
