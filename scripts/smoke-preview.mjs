const baseUrl = String(process.env.VENEAPP_BASE_URL || process.argv[2] || '').replace(/\/$/, '')

if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  console.error('Uso: VENEAPP_BASE_URL=https://preview.vercel.app npm run smoke:preview')
  process.exit(1)
}

const checks = []
const pass = (name) => { checks.push({ name, ok: true }); console.log(`✓ ${name}`) }
const fail = (name, detail) => { checks.push({ name, ok: false }); console.error(`✗ ${name}: ${detail}`) }

async function fetchWithTimeout(path, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8_000)
  try {
    return await fetch(`${baseUrl}${path}`, { redirect: 'follow', ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function expectHtml(path, phrases) {
  try {
    const response = await fetchWithTimeout(path)
    if (!response.ok) return fail(`${path} responde`, `HTTP ${response.status}`)
    const html = await response.text()
    const missing = phrases.filter(phrase => !html.toLowerCase().includes(phrase.toLowerCase()))
    if (missing.length) return fail(`${path} contém conteúdo esperado`, `faltando: ${missing.join(', ')}`)
    pass(`${path} responde e contém conteúdo esperado`)
  } catch (error) {
    fail(`${path} responde`, error instanceof Error ? error.message : String(error))
  }
}

console.log(`Veneapp smoke test → ${baseUrl}\n`)

try {
  const response = await fetchWithTimeout('/api/health')
  const data = await response.json().catch(() => null)
  if (response.ok && data?.status === 'ok' && data?.app === 'veneapp' && data?.checks?.supabaseAuth === 'ok') {
    pass('/api/health confirma Veneapp + Supabase Auth')
  } else {
    fail('/api/health confirma Veneapp + Supabase Auth', `HTTP ${response.status} ${JSON.stringify(data)}`)
  }
} catch (error) {
  fail('/api/health responde', error instanceof Error ? error.message : String(error))
}

await expectHtml('/login', ['veneapp', 'Entrar no Veneapp'])
await expectHtml('/cadastro', ['veneapp', 'Crie sua conta', 'dois objetos iguais'])

try {
  const response = await fetchWithTimeout('/manifest.webmanifest')
  const manifest = await response.json().catch(() => null)
  if (response.ok && manifest?.name === 'Veneapp' && manifest?.display === 'standalone') {
    pass('manifest PWA válido')
  } else {
    fail('manifest PWA válido', `HTTP ${response.status} ${JSON.stringify(manifest)}`)
  }
} catch (error) {
  fail('manifest PWA responde', error instanceof Error ? error.message : String(error))
}

const failed = checks.filter(check => !check.ok)
console.log(`\nResultado: ${checks.length - failed.length}/${checks.length} checks aprovados.`)
if (failed.length) process.exit(1)
