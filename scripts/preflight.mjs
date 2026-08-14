import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const warnings = []
const ok = msg => console.log(`✓ ${msg}`)
const fail = msg => { failures.push(msg); console.log(`✗ ${msg}`) }
const warn = msg => { warnings.push(msg); console.log(`! ${msg}`) }
const check = (condition, success, failure) => {
  if (condition) ok(success)
  else fail(failure)
}
const checkOrWarn = (condition, success, warning) => {
  if (condition) ok(success)
  else warn(warning)
}

const required = [
  'package.json','next.config.ts','tsconfig.json','proxy.ts','.env.example',
  'src/app/layout.tsx','src/app/login/page.tsx','src/app/cadastro/page.tsx',
  'src/app/esqueci-senha/page.tsx','src/app/redefinir-senha/page.tsx',
  'src/app/onboarding/page.tsx','src/app/primeiro-acesso/page.tsx',
  'src/app/auth/confirm/route.ts','src/app/api/auth/send-email/route.ts',
  'src/app/(app)/agenda/page.tsx','src/app/(app)/fechamento/page.tsx',
  'src/app/(app)/relatorios/page.tsx','src/app/api/health/route.ts',
  'src/lib/supabase/client.ts','src/lib/supabase/server.ts','src/lib/supabase/proxy.ts',
  'src/lib/supabase/config.ts','src/lib/human-challenge.ts','src/lib/finance.ts','tests/core-logic.test.ts','scripts/smoke-preview.mjs',
]

console.log('Veneapp preflight\n')
for (const rel of required) check(fs.existsSync(path.join(root, rel)), rel, `arquivo ausente: ${rel}`)

const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'))
check(pkg.name === 'veneapp', 'package name = veneapp', 'package name precisa ser veneapp')
check(Boolean(pkg.scripts?.build), 'script de build configurado', 'script build ausente')
check(Boolean(pkg.scripts?.typecheck), 'typecheck configurado', 'typecheck ausente')
check(Boolean(pkg.scripts?.lint), 'lint configurado', 'lint ausente')
check(Boolean(pkg.scripts?.['smoke:preview']), 'smoke test de Preview configurado', 'smoke:preview ausente')
checkOrWarn(pkg.engines?.node === '22.x', 'Node 22.x fixado', 'Node 22.x não está fixado')

const envExample = fs.readFileSync(path.join(root,'.env.example'),'utf8')
check(envExample.includes('ycgmzgxvksmsaeelymsu.supabase.co'), 'URL Supabase aponta para veneapp', 'URL Supabase incorreta')
check(envExample.includes('sb_publishable_'), 'publishable key moderna configurada no exemplo', 'publishable key ausente')
check(envExample.includes('ANTI_SPAM_SECRET'), 'ANTI_SPAM_SECRET documentado', 'ANTI_SPAM_SECRET ausente')
check(envExample.includes('SUPABASE_SERVICE_ROLE_KEY'), 'SUPABASE_SERVICE_ROLE_KEY documentada', 'SUPABASE_SERVICE_ROLE_KEY ausente')
check(envExample.includes('RESEND_API_KEY'), 'RESEND_API_KEY documentada', 'RESEND_API_KEY ausente')
check(envExample.includes('RESEND_FROM_EMAIL'), 'remetente Resend documentado', 'RESEND_FROM_EMAIL ausente')
check(envExample.includes('SEND_EMAIL_HOOK_SECRET'), 'segredo do Auth Hook documentado', 'SEND_EMAIL_HOOK_SECRET ausente')
check(envExample.includes('NEXT_PUBLIC_SITE_URL'), 'URL pública de autenticação documentada', 'NEXT_PUBLIC_SITE_URL ausente')

function walk(dir) {
  return fs.readdirSync(dir).flatMap(name => {
    const full = path.join(dir,name)
    const stat = fs.statSync(full)
    if (stat.isDirectory() && !['node_modules','.next','.git'].includes(name)) return walk(full)
    return stat.isFile() ? [full] : []
  })
}
const preflightFile = path.resolve(root, 'scripts', 'preflight.mjs')
const scanFiles = walk(root).filter(file => /\.(ts|tsx|js|mjs|json|md|css)$/.test(file) && path.resolve(file) !== preflightFile)
const legacy = scanFiles.filter(file => /AgendaSync|agendasync/i.test(fs.readFileSync(file,'utf8')))
check(legacy.length === 0, 'sem referências legadas a AgendaSync', `referências legadas: ${legacy.map(f=>path.relative(root,f)).join(', ')}`)

const proxySource = fs.readFileSync(path.join(root,'src/lib/supabase/proxy.ts'),'utf8')
check(proxySource.includes('Object.entries(headers)'), 'headers de cache do Supabase propagados no proxy', 'proxy precisa propagar headers de cache do Supabase')
check(proxySource.includes('await supabase.auth.getClaims()'), 'proxy valida sessão com getClaims', 'proxy precisa chamar getClaims')

const gitignore = fs.readFileSync(path.join(root,'.gitignore'),'utf8')
const envIgnored = /(^|\n)\.env\*($|\n)/.test(gitignore) || gitignore.includes('.env.local')
check(envIgnored, '.env.local protegido pelo .gitignore', '.env.local precisa estar no .gitignore')

console.log(`\nResultado: ${failures.length} falha(s), ${warnings.length} aviso(s).`)
if (failures.length) process.exit(1)
