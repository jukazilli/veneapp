# Veneapp — Release Candidate 0.2.2

## Estado atual

- Produto e identidade: aprovado
- Banco Supabase: aprovado
- RLS/Security Advisor: aprovado, sem alertas
- Agenda + Realtime: implementado
- Agente/admin: cria, altera, cancela, conclui e reabre
- Atendente: visualiza agenda própria, conclui ou marca falta no próprio atendimento
- Comissão: snapshot preservado no agendamento
- Pagamentos e fechamento: implementados com saldo acumulado real entre períodos
- Cadastro: e-mail/senha + desafio anti-spam + honeypot + tempo mínimo
- Preflight: 0 falhas / 0 avisos
- Testes de lógica: 8/8
- Checagem sintática TS/TSX: 38 arquivos, 0 erros

## Verificação de release em 13/08/2026

- GitHub `main`: `425a148` publicado em `jukazilli/veneapp`.
- Estrutura do aplicativo corrigida para a raiz do repositório.
- `package-lock.json` gerado e versionado.
- Next.js atualizado para `16.3.0`; `npm audit` sem vulnerabilidades.
- Projeto Vercel oficial: `veneapp` (`prj_cXvrjYtA7qEe6DAmkDrzSkryEDtN`).
- Preview oficial: `dpl_BurLMuyBubkVfEWBFq5EbQBiM6cu`, estado `READY`.
- `npm run verify` remoto aprovado: preflight 0/0, testes 8/8, typecheck, lint sem erros/avisos e build.
- Ambiente público de validação: `https://veneapp-preview-full.vercel.app`.
- Smoke HTTP aprovado: `/api/health`, `/login`, `/cadastro` e `/manifest.webmanifest` com HTTP 200 e conteúdo esperado.
- Supabase Auth saudável em `/api/health` (`status: ok`).
- Login e cadastro verificados em viewport mobile, sem erros ou avisos de console.
- Nenhum erro de runtime encontrado na janela de validação.
- Nenhum deploy foi promovido no projeto oficial de produção.

## Gates pendentes

1. Reautenticar a Vercel CLI ou usar o Dashboard para conectar `jukazilli/veneapp` ao projeto oficial `veneapp`; o conector disponível permitiu deploy por arquivos, mas não expôs mutação de integração Git.
2. Definir Node `22.x` no painel do projeto oficial; o repositório já fixa `engines.node = 22.x`, mas o painel ainda informa `24.x`.
3. Configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e um `ANTI_SPAM_SECRET` aleatório de pelo menos 24 caracteres no projeto oficial.
4. Confirmar no Supabase Auth que `Confirm email` está desativado e revisar os rate limits.
5. Executar o smoke manual com duas contas e o fluxo completo de agenda/financeiro descrito em `docs/SMOKE_TEST.md`.
6. Somente depois desses gates, promover o artefato validado para produção.


## Incremento 0.2.2

- `/api/health` passou a validar a saúde real do Supabase Auth.
- `smoke:preview` valida health, login, cadastro e PWA automaticamente.
- fluxo manual de duas contas documentado em `docs/SMOKE_TEST.md`.
- proxy SSR corrigido para propagar os headers anti-cache exigidos pelo `@supabase/ssr`.
- saldo financeiro corrigido para carregar comissões pendentes de períodos anteriores.
