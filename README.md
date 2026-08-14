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
4. Cada cadastro público cria uma organização própria e torna a pessoa seu proprietário ativo.
5. O proprietário conclui o onboarding convidando a primeira pessoa como administrador, agente ou atendente.
6. Convites recebem senha temporária por Resend, podem ser compartilhados por WhatsApp e exigem troca no primeiro acesso.
7. Qualquer membro ativo cria agendamentos com cliente, telefone opcional, horário sugerido, valor, duração digitada em `HH:MM`, agente e atendente.
8. O telefone identifica e cadastra o cliente automaticamente; números repetidos reutilizam o cadastro existente.
9. Todos os papéis recebem a agenda compartilhada e podem editar, remarcar, concluir, cancelar, marcar falta ou excluir agendamentos.
10. Mudanças relevantes ficam registradas no histórico.
11. Fechamento diário e relatórios por dia, semana ou mês calculam faturamento bruto, líquido do atendente (`bruto - comissão`), comissão, pagamentos e saldo acumulado, com exportação em PDF.
12. Proprietário/admin configura comissão fixa ou percentual e duração padrão.

## Rodar localmente

1. Copie `.env.example` para `.env.local`.
2. Preencha as variáveis do Supabase e do Resend descritas no arquivo.
3. Gere um `ANTI_SPAM_SECRET` aleatório com pelo menos 24 caracteres.
4. Verifique `soberania.tech` no Resend e use `Veneapp <acesso@soberania.tech>` como remetente.
5. No Supabase Auth, mantenha `Confirm email` ativado e configure o Send Email Hook HTTPS para `/api/auth/send-email`.
6. Implante a Edge Function autenticada `provision-member`; o segredo administrativo permanece no ambiente gerenciado do Supabase.
7. Execute `npm install`.
8. Execute `npm run verify`.
9. Execute `npm run dev` e siga o smoke test em `docs/DEPLOYMENT.md`.

## Release

O deploy só deve acontecer depois de todos os gates em [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) até o smoke test local estarem aprovados.

## Segurança

- Todas as tabelas expostas usam RLS.
- O banco impede sobreposição de atendimentos por atendente.
- O banco rejeita novos agendamentos e remarcações para horários passados.
- Comissão usa snapshot protegido no banco.
- O banco calcula e armazena o líquido do atendente como `valor bruto - comissão`.
- Cada tenant possui exatamente um proprietário, que não pode ser removido, desativado ou rebaixado.
- Papel e tenant dos convidados vêm de `app_metadata` criada somente no servidor.
- O desafio anti-spam é validado no servidor e usa assinatura HMAC.
- O fluxo não adiciona função `SECURITY DEFINER` à API pública; o advisor ainda recomenda ativar proteção contra senhas vazadas no Auth.

## Status atual

O projeto Git está conectado ao Vercel em `feather-tecnologias/veneapp-9sff`. Antes do smoke de autenticação, configure as variáveis do Resend e ative o Auth Hook no Supabase.
