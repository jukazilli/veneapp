# Banco de dados — Supabase

Projeto: `veneapp` (`ycgmzgxvksmsaeelymsu`)
Região: `sa-east-1`

## Migrações aplicadas

1. `20260813002534_initial_agenda_sync_schema`
2. `20260813002617_move_btree_gist_to_extensions_schema`
3. `20260813002926_secure_write_policies_and_validation`
4. `20260813003317_limit_payment_visibility`
5. `20260813003450_add_foreign_key_indexes`
6. `20260813005338_protect_last_active_admin`
7. `20260813005801_preserve_commission_snapshot_and_expand_history`
8. `20260813005821_allow_admin_as_commission_agent`
9. `20260813024932_allow_attendant_controlled_status_updates`
10. `20260813025010_merge_appointment_update_policies`
11. `20260813180000_add_owner_profile_role`
12. `20260813180001_create_owner_onboarding_and_invitations`
13. `20260813180002_harden_first_access`
14. `20260813190000_expand_shared_agenda_and_clients`
15. `20260813190001_fix_invited_member_tenant`
16. `20260814014815_add_appointment_net_amount`
17. `20260814020032_add_historical_adjustments`

## Estrutura

- `organizations`: operação/tenant e conclusão do onboarding
- `profiles`: usuários, convite, troca obrigatória de senha e papéis (`owner`, `admin`, `agent`, `attendant`)
- `settings`: comissão, duração padrão, timezone e limites do expediente
- `clients`: clientes deduplicados por organização e telefone normalizado
- `appointments`: agenda, vínculo opcional com cliente, preço bruto, líquido gerado, status e snapshot imutável da regra de comissão
- `appointment_events`: trilha de eventos da agenda
- `agent_payments`: pagamentos realizados aos agentes

## Regras importantes no banco

- Um atendente não pode ter dois agendamentos `scheduled` sobrepostos.
- Novos agendamentos, remarcações e reaberturas não podem apontar para horários passados.
- Todo membro ativo da organização pode criar, visualizar, editar e excluir agendamentos da agenda compartilhada.
- Quando informado, o telefone é normalizado e cria ou reutiliza automaticamente um cliente na mesma organização.
- `ends_at` é calculado automaticamente a partir de `starts_at + duration_min`.
- A interface recebe duração em `HH:MM`; a aplicação valida o intervalo de `00:05` a `12:00` e converte para `duration_min` antes de persistir.
- A regra de comissão é capturada no momento da criação e permanece no agendamento.
- `net_amount` é uma coluna gerada pelo banco como `price - commission_amount` e representa o líquido do atendente.
- A comissão não pode ser maior que o valor bruto do agendamento.
- `entry_source = 'adjustment'` identifica atendimentos já realizados que alimentam o financeiro sem aparecer na agenda operacional.
- Ajustes são sempre concluídos, não podem usar data futura e não podem ser convertidos em agendamentos comuns.
- Mudanças futuras na configuração de comissão não alteram agendamentos existentes.
- Cada cadastro público cria um tenant próprio e um `owner` ativo.
- Convites entram no tenant somente por metadados de aplicação criados pelo servidor.
- O provisionamento registra uma pendência protegida antes de criar o usuário no Auth, evitando que o gatilho trate um convidado como cadastro público.
- Cada organização tem um único proprietário, que não pode ser desativado, rebaixado ou movido.
- Proprietários, agentes e administradores podem ser selecionados como responsáveis pela comissão.
- Alterações de horário, status, duração, atendente e valor entram no histórico.

## Segurança

Todas as tabelas operacionais expostas usam Row Level Security. O fluxo de primeiro acesso não expõe função `SECURITY DEFINER` na API pública. Permanece a recomendação do Auth Advisor para ativar proteção contra senhas vazadas.

## Realtime

`appointments`, `appointment_events` e `agent_payments` estão adicionadas à publicação `supabase_realtime`.

## Git / Supabase CLI

As migrações estão registradas no projeto remoto. Quando o Supabase CLI estiver conectado ao repositório, materialize o histórico local com `supabase db pull` antes de começar a manter novas migrações por Git.
