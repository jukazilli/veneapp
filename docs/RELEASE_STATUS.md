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

## Gate pendente

O runtime local não consegue acessar registry.npmjs.org, então `npm install` e `next build` não foram executados localmente.

A Preview Vercel foi preparada como build remoto controlado, mas o Vercel MCP retornou HTTP 502 inclusive para operações simples como listar times. Nenhum deploy de produção foi feito.

## Próximo passo obrigatório

1. Vercel MCP voltar a responder.
2. Criar Preview de projeto separado chamado `veneapp`.
3. Confirmar build `READY`.
4. Validar `/api/health`.
5. Testar login e cadastro sem confirmação de e-mail.
6. Criar duas contas de teste (agente/admin e atendente).
7. Executar fluxo completo de agenda e financeiro.
8. Só então promover o mesmo artefato para produção.


## Incremento 0.2.2

- `/api/health` passou a validar a saúde real do Supabase Auth.
- `smoke:preview` valida health, login, cadastro e PWA automaticamente.
- fluxo manual de duas contas documentado em `docs/SMOKE_TEST.md`.
- proxy SSR corrigido para propagar os headers anti-cache exigidos pelo `@supabase/ssr`.
- saldo financeiro corrigido para carregar comissões pendentes de períodos anteriores.
