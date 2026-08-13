# Veneapp

MVP mobile-first para sincronizar agenda, atendimento, faturamento e comissões entre agentes e atendentes.

## Stack

- Next.js 16 + TypeScript
- Supabase Postgres, Auth e Realtime
- Resend para e-mails transacionais de autenticação
- Vercel para frontend e Server Actions

## Fluxo implementado

1. Login/cadastro com e-mail, senha e confirmação do endereço.
2. Recuperação e redefinição de senha por link seguro enviado pelo Resend.
3. Cadastro possui verificação leve de dois objetos iguais.
4. Primeiro usuário vira administrador; os seguintes aguardam ativação.
5. Agente/admin cria o agendamento com cliente, horário, preço, duração e atendente.
6. Atendente recebe sua agenda via Supabase Realtime.
7. Agente/admin pode remarcar, alterar valor, concluir, cancelar ou marcar falta.
8. Mudanças relevantes ficam registradas no histórico.
9. Fechamento diário e relatórios calculam faturamento, comissão, pagamentos do período e saldo acumulado conforme o papel logado.
10. Admin configura comissão fixa ou percentual e duração padrão.

## Rodar localmente

1. Copie `.env.example` para `.env.local`.
2. Preencha as variáveis do Supabase e do Resend descritas no arquivo.
3. Gere um `ANTI_SPAM_SECRET` aleatório com pelo menos 24 caracteres.
4. Verifique `soberania.tech` no Resend e use `Veneapp <acesso@soberania.tech>` como remetente.
5. No Supabase Auth, mantenha `Confirm email` ativado e configure o Send Email Hook HTTPS para `/api/auth/send-email`.
6. Execute `npm install`.
7. Execute `npm run verify`.
8. Execute `npm run dev` e siga o smoke test em `docs/DEPLOYMENT.md`.

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

O projeto Git está conectado ao Vercel em `feather-tecnologias/veneapp-9sff`. Antes do smoke de autenticação, configure as variáveis do Resend e ative o Auth Hook no Supabase.
