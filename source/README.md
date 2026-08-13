# Veneapp

MVP mobile-first para sincronizar agenda, atendimento, faturamento e comissões entre agentes e atendentes.

## Stack

- Next.js 16 + TypeScript
- Supabase Postgres, Auth e Realtime
- Vercel para frontend e Server Actions

## Fluxo implementado

1. Login/cadastro com e-mail e senha.
2. Cadastro possui verificação leve de dois objetos iguais.
3. Primeiro usuário vira administrador; os seguintes aguardam ativação.
4. Agente/admin cria o agendamento com cliente, horário, preço, duração e atendente.
5. Atendente recebe sua agenda via Supabase Realtime.
6. Agente/admin pode remarcar, alterar valor, concluir, cancelar ou marcar falta.
7. Mudanças relevantes ficam registradas no histórico.
8. Fechamento diário e relatórios calculam faturamento, comissão, pagamentos do período e saldo acumulado conforme o papel logado.
9. Admin configura comissão fixa ou percentual e duração padrão.

## Rodar localmente

1. Copie `.env.example` para `.env.local`.
2. Preencha as variáveis do Supabase.
3. Gere um `ANTI_SPAM_SECRET` aleatório com pelo menos 24 caracteres.
4. No Supabase Auth, desative `Confirm email` para o fluxo de cadastro imediato definido para o MVP.
5. Execute `npm install`.
6. Execute `npm run verify`.
7. Execute `npm run dev` e siga o smoke test em `docs/DEPLOYMENT.md`.

## Release

O deploy só deve acontecer depois de todos os gates em [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) até o smoke test local estarem aprovados.

## Segurança

- Todas as tabelas expostas usam RLS.
- O banco impede sobreposição de atendimentos por atendente.
- Comissão usa snapshot protegido no banco.
- O último administrador ativo não pode ser removido.
- O desafio anti-spam é validado no servidor e usa assinatura HMAC.
- O advisor de segurança do Supabase está limpo.

## Status atual

Banco e código-base do MVP existem. O próximo bloqueio de release é executar instalação das dependências, gerar lockfile, rodar `typecheck/lint/build` e validar o fluxo crítico localmente antes de criar o projeto Vercel.
