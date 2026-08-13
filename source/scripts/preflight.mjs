import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
const warnings = []
const ok = msg => console.log(`✓ ${msg}`)
const fail = msg => { failures.push(msg); console.log(`✗ ${msg}`) }
const warn = msg => { warnings.push(msg); console.log(`! ${msg}`) }

const required = [
  'package.json','next.config.ts','tsconfig.json','proxy.ts','.env.example',
  'src/app/layout.tsx','src/app/login/page.tsx','src/app/cadastro/page.tsx',
  'src/app/(app)/agenda/page.tsx','src/app/(app)/fechamento/page.tsx',
  'src/app/(app)/relatorios/page.tsx','src/app/api/health/route.ts',
  'src/lib/supabase/client.ts','src/lib/supabase/server.ts','src/lib/supabase/proxy.ts',
  'src/lib/supabase/config.ts','src/lib/human-challenge.ts','src/lib/finance.ts','tests/core-logic.test.ts','scripts/smoke-preview.mjs',
]

console.log('Veneapp preflight\n')
for (const rel of required) fs.existsSync(path.join(root, rel)) ? ok(rel) : fail(`arquivo ausente: ${rel}`)

const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'))
pkg.name === 'veneapp' ? ok('package name = veneapp') : fail('package name precisa ser veneapp')
pkg.scripts?.build ? ok('script de build configurado') : fail('script build ausente')
pkg.scripts?.typecheck ? ok('typecheck configurado') : fail('typecheck ausente')
pkg.scripts?.lint ? ok('lint configurado') : fail('lint ausente')
pkg.scripts?.['smoke:preview'] ? ok('smoke test de Preview configurado') : fail('smoke:preview ausente')
pkg.engines?.node === '22.x' ? ok('Node 22.x fixado') : warn('Node 22.x não está fixado')

const envExample = fs.readFileSync(path.join(root,'.env.example'),'utf8')
envExample.includes('ycgmzgxvksmsaeelymsu.supabase.co') ? ok('URL Supabase aponta para veneapp') : fail('URL Supabase incorreta')
envExample.includes('sb_publishable_') ? ok('publishable key moderna configurada no exemplo') : fail('publishable key ausente')
envExample.includes('ANTI_SPAM_SECRET') ? ok('ANTI_SPAM_SECRET documentado') : fail('ANTI_SPAM_SECRET ausente')

function walk(dir) {
  return fs.readdirSync(dir).flatMap(name => {
    const full = path.join(dir,name)
    const stat = fs.statSync(full)
    if (stat.isDirectory() && !['node_modules','.next','.git'].includes(name)) return walk(full)
    return stat.isFile() ? [full] : []
  })
}
const scanFiles = walk(root).filter(file => /\.(ts|tsx|js|mjs|json|md|css)$/.test(file) && !file.endsWith('scripts/preflight.mjs'))
const legacy = scanFiles.filter(file => /AgendaSync|agendasync/i.test(fs.readFileSync(file,'utf8')))
legacy.length === 0 ? ok('sem referências legadas a AgendaSync') : fail(`referências legadas: ${legacy.map(f=>path.relative(root,f)).join(', ')}`)

const proxySource = fs.readFileSync(path.join(root,'src/lib/supabase/proxy.ts'),'utf8')
proxySource.includes('Object.entries(headers)') ? ok('headers de cache do Supabase propagados no proxy') : fail('proxy precisa propagar headers de cache do Supabase')
proxySource.includes('await supabase.auth.getClaims()') ? ok('proxy valida sessão com getClaims') : fail('proxy precisa chamar getClaims')

const gitignore = fs.readFileSync(path.join(root,'.gitignore'),'utf8')
;/(^|\n)\.env\*($|\n)/.test(gitignore) || gitignore.includes('.env.local') ? ok('.env.local protegido pelo .gitignore') : fail('.env.local precisa estar no .gitignore')

console.log(`\nResultado: ${failures.length} falha(s), ${warnings.length} aviso(s).`)
if (failures.length) process.exit(1)
