# Veneapp — Release e Deploy

O deploy só acontece depois que todos os gates anteriores estiverem verdes. Uma URL criada não é considerada release se o build e o fluxo crítico não tiverem sido testados.

## Gate 0 — Escopo e identidade
- [x] Nome oficial: Veneapp
- [x] UI mobile-first
- [x] Paleta rosa + preto
- [x] Papéis: admin, agente, atendente
- [x] Comissão fixa/percentual
- [x] Sem cadastro de serviços

## Gate 1 — Banco e segurança
- [x] Schema aplicado no Supabase
- [x] RLS em tabelas expostas
- [x] Bloqueio de conflito de horário no banco
- [x] Snapshot de comissão
- [x] Proteção do último administrador
- [x] Realtime nas entidades operacionais
- [x] Security Advisor sem alertas

## Gate 2 — Auth e proteção contra abuso
- [x] Login com e-mail/senha
- [x] Cadastro com nome/e-mail/senha
- [x] Desafio de dois objetos iguais validado no servidor
- [x] Honeypot e tempo mínimo assinados para reduzir automação simples
- [x] Testes de lógica (`npm run test:logic`)
- [ ] Supabase Auth: `Confirm email` desativado
- [ ] Testar que `signUp` devolve sessão imediatamente
- [ ] Revisar rate limits do Supabase Auth

> O Veneapp não deve ser publicado enquanto o cadastro retornar `session = null`, pois isso indica que a confirmação de e-mail ainda está ativa.

## Gate 3 — Setup reprodutível
- [x] `.env.example` documentado
- [x] `ANTI_SPAM_SECRET` separado do cliente
- [ ] `npm install` concluído
- [ ] `package-lock.json` gerado e versionado
- [ ] Dependências instaladas nas versões fixadas

## Gate 4 — Qualidade de código
Executar, nesta ordem:

```bash
npm run test:logic
npm run typecheck
npm run lint
npm run build
```

Ou:

```bash
npm run verify
```

Critério: **zero erros**. Warnings relevantes devem ser revisados antes de seguir.

## Gate 5 — Smoke test local
Com o app em `npm run dev`, validar em viewport mobile:

### Conta/admin
- [ ] Criar primeira conta sem confirmação de e-mail
- [ ] Entrar automaticamente
- [ ] Primeiro usuário ativo como administrador

### Equipe
- [ ] Criar segunda conta
- [ ] Segunda conta fica pendente
- [ ] Admin ativa como agente/atendente

### Fluxo operacional
- [ ] Agente cria agendamento
- [ ] Atendente vê o novo agendamento
- [ ] Conflito de horário é bloqueado
- [ ] Remarcação aparece para o atendente
- [ ] Cancelamento libera o horário
- [ ] Conclusão entra no fechamento
- [ ] Comissão é calculada corretamente
- [ ] Pagamento reduz o saldo
- [ ] Relatório semanal/mensal fecha corretamente

## Gate 6 — Projeto Vercel
Somente após o Gate 5:
- [ ] Criar projeto Vercel **separado** chamado `veneapp`
- [ ] Não reutilizar `vevntas`
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Configurar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Configurar `ANTI_SPAM_SECRET`
- [ ] Definir Node compatível com Next.js usado no projeto

## Gate 7 — Preview
- [ ] Fazer primeiro deploy como Preview
- [ ] `/api/health` responde `status: ok`
- [ ] Login abre no celular
- [ ] Cadastro funciona sem confirmação
- [ ] Executar novamente o fluxo crítico com dois usuários
- [ ] Conferir console/runtime logs

## Gate 8 — Produção
Somente após preview aprovada:
- [ ] Promover deployment validado para Production
- [ ] Confirmar domínio oficial/alias
- [ ] Testar produção em iPhone/Android
- [ ] Testar instalação PWA
- [ ] Conferir logs após os primeiros testes

## Regra de release
**Não publicar para produção código que não passou por `test:logic + typecheck + lint + build + smoke test`.**
