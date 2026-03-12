# PRD — SOS Diaristas: Sistema de Gestão de Diaristas

## Visão do Produto

Sistema completo para gestão de um negócio de diaristas em Foz do Iguaçu. Inclui landing page para captação de clientes, CRM para gestão de contatos, sistema de pedidos com Kanban, gestão de diaristas, calendário, relatórios e integração com WhatsApp via n8n.

---

## Problema

Gestão manual de agendamentos de diaristas via WhatsApp gera desorganização: pedidos perdidos, diaristas sem atribuição, pagamentos sem controle, sem visibilidade do dia a dia.

## Solução

1. **Landing page** — capta leads via formulário → WhatsApp
2. **Agente IA no WhatsApp** — atende clientes via n8n, agenda serviços automaticamente
3. **Dashboard CRM** — controla pedidos, diaristas, pagamentos e clientes em um só lugar
4. **Página "Hoje"** — visão do dia a dia pra operação (página principal)

---

## Usuários

- **Operadora** (usuária principal) — senhora que controla o dia a dia: pedidos, diaristas, pagamentos. Precisa de UX intuitiva, fontes grandes, botões claros
- **Gestor** (Gabriel) — acompanha relatórios, configura integrações, gerencia o sistema

---

## Funcionalidades Implementadas

### Landing Page
- Formulário de solicitação → redireciona pra WhatsApp
- Tracking: Meta Pixel (client), Meta CAPI (server), Google Ads

### Dashboard — Página "Hoje" (principal)
- Agenda do dia com todos os pedidos
- Atribuir diarista direto no card
- Botões: Iniciar Serviço → Concluir Serviço
- Pagamento: Pendente / Parcial / Pago (3 botões visuais)
- KPIs: pedidos hoje, pendentes, em andamento, concluídos, receita
- Sidebar: diaristas do dia (disponível/ocupada) + preview de amanhã
- Auto-refresh 20s

### Contatos (CRM)
- Lista paginada com busca e filtros por status
- Detalhe do contato com histórico
- Status: novo, qualificado, agendado, cliente, inativo, perdido

### Pedidos (Kanban)
- Colunas: Pendente → Agendado → Confirmado → Diarista OK → Em Andamento → Concluído
- Drag-and-drop entre colunas
- Modal de edição completo (data, hora, endereço, valor, diarista, pagamento)
- Auto-refresh 30s

### Calendário
- Visualização mensal com pedidos por dia
- Cores por status e quantidade

### Diaristas
- Cadastro com nome, telefone, especialidades
- Status: ativa, inativa, férias
- Contagem de pedidos ativos

### Relatórios
- KPIs: total pedidos, concluídos, faturamento, recebido, a receber, ticket médio
- Faturamento por dia, ranking de diaristas, serviços populares
- Status de pagamento, conversão de contatos
- Filtro por período: 7d, 30d, 90d, tudo

### Integração n8n (3 webhooks)
- Criar pedido automaticamente quando IA fecha agendamento
- Atualizar dados do contato (nome, endereço)
- Consultar dados do cliente no CRM (IA confirma info em vez de perguntar de novo)

---

## Funcionalidades Pendentes

### Prioridade Alta
- **Configurações** — tabela de preços editável, dados da empresa
- **Modo mobile** — menu hamburguer pra sidebar
- **Notificação de novo pedido** — badge/sino no menu

### Prioridade Média
- **Histórico de atendimento** — ver conversas do WhatsApp por cliente
- **Agenda da diarista** — ver pedidos da semana de cada uma
- **Recorrência automática** — pedido recorrente pra clientes fixos
- **Exportar relatórios** — PDF ou Excel

### Prioridade Baixa
- **Mapa dos pedidos** — endereços do dia pra otimizar rota
- **Dashboard financeiro** — DRE simples
- **Avaliação pós-serviço** — cliente avaliar a diarista
- **Autenticação real** — trocar localStorage por JWT

---

## Regras de Negócio

- Tabela de preços: 2h (R$125) até 10h (R$240)
- Pagamento tem 3 estados: pendente, parcial, pago
- Ao atribuir diarista, status do pedido muda automaticamente pra "diarista_atribuida"
- Ao concluir pedido, status do contato muda pra "cliente"
- Webhooks do n8n aceitam body como array ou objeto
