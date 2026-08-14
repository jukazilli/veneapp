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
4. Confirmar que a primeira conta entra no onboarding como proprietária de uma nova organização.
5. Informar o nome da organização e convidar a segunda pessoa como **atendente**, com senha temporária e WhatsApp.
6. Confirmar o recebimento do convite por Resend e a abertura correta do compartilhamento por WhatsApp.
7. Entrar na segunda sessão com a senha temporária, definir uma senha própria e acessar a organização.
   Confirmar que o convidado nunca vê o onboarding e permanece no tenant e papel definidos por quem convidou.
8. Criar um agendamento com cliente, telefone, horário sugerido, valor de R$ 120,00, duração digitada como `00:30`, agente e atendente.
9. Confirmar que o atendimento aparece para o atendente sem recarregar manualmente.
10. Tentar criar outro atendimento sobreposto para o mesmo atendente e confirmar bloqueio.
11. Tentar informar um horário passado e confirmar bloqueio na tela e no banco.
12. Repetir o telefone em outro agendamento e confirmar que o mesmo cliente é reutilizado.
13. Como atendente, remarcar o primeiro atendimento e confirmar sincronização nas duas sessões.
14. Como atendente, concluir o atendimento.
15. Com comissão fixa de R$ 30,00, confirmar no fechamento: faturamento bruto de R$ 120,00, comissão a pagar de R$ 30,00 e líquido do atendente de R$ 90,00.
16. Registrar pagamento da comissão e confirmar que somente o saldo de comissão diminui; faturamento bruto e líquido do atendente permanecem inalterados.
17. Criar outro atendimento e marcar **não compareceu** como atendente.
18. Confirmar os números nos filtros diário, semanal e mensal de Relatórios.
19. Exportar o relatório em PDF e abrir o arquivo.
20. Excluir um agendamento como atendente e confirmar sua remoção da agenda compartilhada.
21. Abrir **Ajustes**, lançar um atendimento já realizado de R$ 120,00 e confirmar a prévia de R$ 30,00 de comissão e R$ 90,00 de líquido.
22. Confirmar que o ajuste aparece no relatório da data escolhida e, quando lançado para hoje, também no fechamento diário, mas nunca ocupa um horário na agenda.

## Gate de produção

Não promover a Preview se qualquer item acima falhar. Produção também exige `ANTI_SPAM_SECRET` com pelo menos 24 caracteres, Edge Function `provision-member` ativa, segredo de hook gerado pelo Supabase e domínio remetente verificado no Resend.
