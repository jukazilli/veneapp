# Veneapp — smoke test da Preview

A Preview só pode ser considerada testável depois de passar pelos checks automáticos e pelo fluxo manual abaixo.

## Automático

```bash
VENEAPP_BASE_URL=https://<preview>.vercel.app npm run smoke:preview
```

O script valida:

- `/api/health` e conectividade com Supabase Auth;
- `/login` com identidade Veneapp;
- `/cadastro` com o desafio anti-spam;
- `/esqueci-senha` com solicitação de recuperação;
- manifesto PWA em modo `standalone`.

## Manual — duas contas

1. Abrir a Preview em dois navegadores/sessões separados.
2. Criar a primeira conta, confirmar o recebimento pelo Resend e validar o e-mail.
3. Sair, usar “Esqueci minha senha”, abrir o link e salvar uma nova senha.
4. Criar a segunda conta, confirmar o e-mail e verificar que fica aguardando liberação do administrador.
5. Na conta administradora, ativar a segunda conta como **atendente**.
6. Criar um agendamento com cliente, horário, preço, agente e atendente.
7. Confirmar que o atendimento aparece para o atendente sem recarregar manualmente.
8. Tentar criar outro atendimento sobreposto para o mesmo atendente e confirmar bloqueio.
9. Remarcar o primeiro atendimento e confirmar sincronização nas duas sessões.
10. Como atendente, concluir o atendimento.
11. Confirmar receita e comissão no fechamento.
12. Registrar pagamento da comissão e confirmar redução do saldo.
13. Criar outro atendimento e marcar **não compareceu** como atendente.
14. Confirmar os números em Relatórios e o histórico do atendimento.

## Gate de produção

Não promover a Preview se qualquer item acima falhar. Produção também exige `ANTI_SPAM_SECRET` com pelo menos 24 caracteres, segredo de hook gerado pelo Supabase e domínio remetente verificado no Resend.
