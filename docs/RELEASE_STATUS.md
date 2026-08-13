# Veneapp — Release Candidate 0.3.0

## Incremento de autenticação

- O Supabase Auth continua responsável por usuários, tokens e sessões.
- O Send Email Hook HTTPS substitui o envio nativo do Supabase pelo Resend.
- O endpoint `/api/auth/send-email` valida a assinatura Standard Webhooks antes de enviar.
- Cadastro exige confirmação de e-mail.
- Recuperação e redefinição de senha foram implementadas com callback PKCE.
- Templates cobrem cadastro, recuperação, convite, magic link, troca de e-mail e reautenticação.
- O remetente previsto é `Veneapp <acesso@soberania.tech>`, após verificação de `soberania.tech` no Resend.
- A interface usa Nunito, empacotada pelo `next/font`.

## Projeto de deploy

- Repositório: `jukazilli/veneapp`.
- Projeto informado e conectado pelo proprietário: `feather-tecnologias/veneapp-9sff`.
- O push para `main` deve acionar a integração Git desse projeto.

## Validação local em 13/08/2026

- Implementação: commit `37ec7ee`.
- Preflight: 0 falhas e 0 avisos.
- Testes de lógica e segurança de links/templates: 10/10.
- TypeScript e ESLint: sem erros.
- Build de produção Next.js 16: aprovado, incluindo as novas rotas dinâmicas.
- Browser mobile: `/login`, `/cadastro` e `/esqueci-senha` com HTTP 200, Nunito efetiva, sem erros de console e sem overlay do framework.
- O projeto Supabase `veneapp` (`ycgmzgxvksmsaeelymsu`) está `ACTIVE_HEALTHY`.

## Configuração obrigatória na Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ANTI_SPAM_SECRET`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY` ou `RESEND_KEY`
- `RESEND_FROM_EMAIL`
- `SEND_EMAIL_HOOK_SECRET`

Segredos reais não são armazenados no Git.

## Configuração obrigatória no Supabase

1. Manter a confirmação de e-mail ativada.
2. Adicionar a URL pública do aplicativo nas URLs permitidas do Auth.
3. Criar um Send Email Hook HTTPS apontando para `https://<dominio>/api/auth/send-email`.
4. Gerar o segredo do hook e copiar o mesmo valor para `SEND_EMAIL_HOOK_SECRET` na Vercel.
5. Revisar os rate limits do Auth antes da abertura pública.

## Gates pendentes

1. Confirmar o domínio `soberania.tech` como verificado no Resend.
2. Configurar as variáveis no novo projeto da Vercel.
3. Ativar o hook no painel do Supabase.
4. Validar cadastro, confirmação e recuperação de senha com uma caixa postal real.
5. Executar o fluxo operacional de duas contas descrito em `docs/SMOKE_TEST.md`.
