# Briefing do Projeto — Veneapp

## 1. Produto
**Nome oficial:** Veneapp
**Categoria:** agenda operacional + fechamento financeiro para operações com agente e atendente.
**Plataforma:** web app mobile-first / PWA.

O Veneapp substitui o repasse manual de alterações pelo WhatsApp por uma agenda compartilhada em tempo real. A fonte de verdade passa a ser o app: o agente registra uma vez e o atendente vê a mesma informação.

## 2. Problema central
A agenda muda rápido. Clientes cancelam em cima da hora, novos encaixes surgem sem antecedência e preço/horário são negociados individualmente. Hoje cada mudança exige uma nova mensagem entre agente e atendente, criando risco de conflito, esquecimento, perda de receita e fechamento incorreto.

## 3. Proposta de valor
**Comunicação operacional perfeita entre agente e atendente, com agenda e ganhos no mesmo lugar.**

O Veneapp deve reduzir passos, não adicionar burocracia. O WhatsApp continua sendo o canal de negociação com o cliente; o Veneapp assume a coordenação interna assim que horário e preço foram combinados.

## 4. Perfis
### Proprietário
- É quem cria a conta e a organização.
- Conclui o onboarding convidando a primeira pessoa.
- Possui todas as permissões administrativas e não pode ser removido ou rebaixado.

### Administrador
- Configura comissão e duração padrão.
- Convida pessoas e define papéis.
- Pode administrar agenda.
- Enxerga fechamento e relatórios da operação.

### Agente
- Administra a agenda.
- Registra cliente, horário, preço, duração e atendente.
- Remarca, cancela, conclui ou registra falta.
- Acompanha a própria comissão.

### Atendente
- Visualiza a agenda compartilhada da organização.
- Recebe alterações da agenda em tempo real.
- Acompanha seus atendimentos e produção.
- Pode criar, editar, remarcar, cancelar, concluir ou excluir agendamentos.
- Pode registrar pagamentos realizados ao agente.

## 5. Jornada principal
1. Cliente chama no WhatsApp.
2. Agente combina preço e horário.
3. Agente registra o atendimento no Veneapp.
4. O atendente recebe o novo horário pela agenda compartilhada.
5. Qualquer remarcação/cancelamento/encaixe altera a mesma agenda.
6. Atendimento concluído entra no fechamento como faturamento bruto.
7. Comissão é calculada automaticamente pela regra capturada quando o agendamento foi criado.
8. O líquido do atendente é sempre o faturamento bruto menos a comissão.
9. Pagamentos ao agente são registrados e reduzem somente o saldo pendente de comissão; dívidas de dias anteriores não desaparecem no fechamento.

## 6. Serviços e preços
- Não existe cadastro de serviços no MVP.
- Cada atendimento recebe preço livre no momento do agendamento.
- Duração padrão inicial: `01:00`, editável por digitação no formato `HH:MM` (por exemplo, `00:30` ou `01:00`).
- A interface trabalha em `HH:MM`; API e banco convertem e persistem a duração como minutos inteiros.
- Observações são livres por atendimento.
- O telefone é opcional e, quando informado, identifica e cadastra o cliente automaticamente.

## 7. Comissão
Dois modos configuráveis:
- **Fixa:** valor fixo por atendimento.
- **Percentual:** percentual sobre o valor do atendimento.

A regra e o valor usados são congelados no agendamento. Alterações futuras nas configurações não recalculam o histórico.

Contrato financeiro de cada atendimento concluído:
- **Faturamento bruto:** valor integral informado no agendamento.
- **Comissão:** valor fixo ou percentual devido ao agente.
- **Líquido do atendente:** faturamento bruto menos comissão.

Exemplo: para um valor de R$ 120,00 e comissão de R$ 30,00, o faturamento bruto é R$ 120,00 e o líquido do atendente é R$ 90,00. Um pagamento de comissão não altera o faturamento nem o líquido; ele reduz apenas o saldo de comissão acumulado.

## 8. Agenda e estados
Estados previstos:
- Confirmado
- Concluído
- Cancelado
- Não compareceu

Regras:
- O mesmo atendente não pode ter dois horários confirmados sobrepostos.
- Cancelamento libera o horário imediatamente.
- Alterações relevantes ficam registradas no histórico.
- Datas ficam em UTC no banco e são exibidas em `America/Sao_Paulo`.

## 9. Fechamento
Somente atendimentos concluídos entram no faturamento.

Indicadores:
- Faturamento bruto
- Líquido do atendente
- Comissão a pagar
- Comissão paga
- Saldo de comissão acumulado
- Atendimentos concluídos
- Cancelamentos
- Não comparecimentos

Relatórios iniciais: semanal e mensal.

## 10. Login e criação de conta
### Login
E-mail + senha.

### Cadastro
Campos mínimos:
- Nome
- E-mail
- Senha (mínimo 8 caracteres)
- Verificação humana simples: selecionar os **dois objetos iguais**

### Confirmação de e-mail
O MVP exige confirmação de e-mail. O Supabase Auth gera e valida os tokens, e o Send Email Hook substitui o envio nativo pelo Resend usando remetente verificado em `soberania.tech`.

O mesmo canal entrega a confirmação de cadastro e a recuperação de senha. Links são trocados por sessão no callback PKCE do aplicativo e não expõem tokens sensíveis em logs.

Cada cadastro público cria uma organização isolada e torna a pessoa seu `owner` ativo. Após confirmar o e-mail, ela informa o nome da organização e convida a primeira pessoa como administrador, agente ou atendente.

Contas da equipe não são criadas pelo cadastro público dentro de um tenant existente. Proprietário ou administrador chama uma Edge Function autenticada do Supabase, define uma senha temporária e escolhe o papel. O segredo privilegiado permanece no ambiente gerenciado do Supabase. As credenciais seguem por Resend, podem ser compartilhadas por WhatsApp e a senha precisa ser trocada no primeiro acesso.

A verificação de objetos é uma barreira leve contra spam. Para uma abertura pública em escala, a evolução recomendada é ativar CAPTCHA/Turnstile nativo do Supabase Auth além dos rate limits.

## 11. UX/UI
Princípios:
- Mobile-first.
- Baixa carga cognitiva.
- Uma ação primária clara por contexto.
- Pouco texto operacional.
- Sem tabelas complexas no celular.
- Estados visuais claros e feedback imediato.

Navegação inferior:
**Agenda · Ajustes · Fechamento · Relatórios · Mais**

CTA principal da agenda:
**+ Novo agendamento**

## 12. Identidade visual
**Cores oficiais do MVP:** rosa + preto.

Direção visual:
- Preto como base/contraste.
- Rosa como cor de ação, sincronismo e destaque.
- Superfícies claras para leitura rápida de agenda e valores.
- Interface limpa, sem excesso de gradientes ou ornamentos.

## 13. Arquitetura
- **Frontend/backend web:** Next.js 16 + TypeScript + Server Actions.
- **Hospedagem:** Vercel.
- **Banco:** Supabase Postgres.
- **Autenticação:** Supabase Auth.
- **E-mails de autenticação:** Resend via Supabase Send Email Hook assinado.
- **Sincronização:** Supabase Realtime.
- **Segurança:** PostgreSQL Row Level Security por organização e papel.
- **Repositório:** Git local; GitHub remoto será conectado quando a integração estiver disponível.

## 14. Banco de dados
Tabelas do MVP:
- `organizations`
- `profiles`
- `settings`
- `appointments`
- `appointment_events`
- `agent_payments`

## 15. Telas do MVP
- Login
- Criar conta
- Esqueci minha senha
- Redefinir senha
- Onboarding da organização
- Primeiro acesso e troca da senha temporária
- Agenda do dia
- Novo agendamento
- Ajustes de atendimentos já realizados
- Novo ajuste histórico
- Detalhe/histórico
- Remarcação
- Cancelamento/conclusão/falta
- Fechamento diário
- Relatório diário/semanal/mensal com exportação em PDF
- Registro de pagamento
- Equipe
- Configurações

## 16. Fora do MVP inicial
- Automação do WhatsApp
- Push notification nativa
- Gestão avançada de clientes além do cadastro automático por telefone
- Integração bancária
- Multiempresa por usuário
- Regras distintas de comissão por agente
- Dashboard analítico avançado

## 17. Critérios de sucesso do MVP
O MVP está pronto para teste quando dois usuários diferentes conseguirem executar, sem comunicação paralela, o cenário:

1. agente cria atendimento;
2. atendente vê o atendimento;
3. agente remarca/cancela;
4. atendente recebe a alteração;
5. agente conclui atendimento;
6. fechamento reflete valor e comissão;
7. pagamento ao agente reduz o saldo acumulado, inclusive de períodos anteriores.

O produto cumpre sua proposta quando o agente deixa de precisar avisar manualmente cada mudança ao atendente e o fechamento deixa de depender de planilha paralela.
