# PRD — SOS Diaristas: Dashboard de Análise Inteligente de Campanhas

## Visão do Produto

Sistema de dashboard administrativo para análise inteligente de métricas de campanhas do Meta Ads (Facebook/Instagram). Um agente de IA com comportamento de gestor de tráfego experiente analisa os dados em tempo real e entrega insights acionáveis, ajudando o gestor a tomar decisões mais rápidas e embasadas.

O dashboard herda a identidade visual da landing page existente — elegante, profissional, azul-marinho — transmitindo confiança e sofisticação.

---

## Problema

Gestores de tráfego perdem tempo abrindo o Gerenciador de Anúncios do Meta, navegando entre campanhas, cruzando dados manualmente e tentando interpretar o que os números significam. Não há uma visão consolidada com diagnóstico automático.

## Solução

Um painel centralizado que:
1. Busca métricas das campanhas via Meta Marketing API automaticamente
2. Persiste os dados no PostgreSQL para análise histórica
3. Apresenta os KPIs em cards e gráficos visuais
4. Possui um agente LangChain que interpreta os dados e entrega insights como um gestor sênior

---

## Usuários

- **Gestor de tráfego** (usuário principal) — acessa o dashboard diariamente para monitorar campanhas e receber recomendações do agente
- **Dono do negócio** — acessa ocasionalmente para visão geral de resultado e ROI

---

## Funcionalidades

### P0 — MVP obrigatório

**Autenticação**
- Login simples com email/senha (sem cadastro público — acesso controlado)
- Sessão persistida via JWT

**Conexão com Meta Ads**
- Configuração de `access_token` e `ad_account_id` via painel de configurações
- Suporte a múltiplas contas (ex: cliente A, cliente B)

**Sincronização de métricas**
- Busca automática (cron job) dos últimos 7, 14 e 30 dias
- Métricas coletadas por campanha: impressões, cliques, CPM, CPC, CTR, conversões (leads), CPL, valor gasto, alcance, frequência, ROAS (quando disponível)
- Breakdown por dia para gráficos de tendência

**Dashboard principal**
- Cards de KPIs: gasto total, leads gerados, CPL médio, CTR médio
- Gráfico de linha: evolução diária de gasto e leads
- Tabela de campanhas com status (ativa/pausada) e principais métricas
- Filtro por período e por conta de anúncios

**Agente IA (Gestor de Tráfego)**
- Interface de chat no sidebar ou modal
- O agente tem acesso às métricas do banco de dados via tools LangChain
- Responde perguntas como:
  - "Qual campanha está com CPL mais alto?"
  - "O que está puxando o gasto para cima essa semana?"
  - "Quais campanhas devo pausar?"
- Entrega análise proativa diária (gerada automaticamente ao abrir o dashboard)
- Tom: direto, técnico, como um gestor experiente — sem rodeios

### P1 — Segunda entrega

- Histórico de conversas com o agente
- Exportação de relatório em PDF com métricas + insights do agente
- Alertas automáticos: CPL acima do limite configurado, campanha zerou orçamento
- Comparação de períodos (semana atual vs. anterior)

### P2 — Futuro

- Suporte a Google Ads (mesma estrutura)
- Dashboard de leads gerados via landing page (integração com CAPI)
- Previsão de performance com base em histórico

---

## Regras de Negócio

- O `access_token` da Meta Ads é armazenado **criptografado** no banco
- A sincronização acontece a cada 6 horas por padrão (configurável)
- Métricas históricas são imutáveis — novos syncs apenas inserem/atualizam o registro do dia
- O agente nunca deve sugerir ações que violem as políticas do Meta Ads
- Rate limits da API do Meta devem ser respeitados (delay entre requests)

---

## Métricas de Sucesso

- Tempo médio de análise diária reduzido de 30 min para menos de 5 min
- Gestor usa o chat do agente pelo menos 1x por dia
- 0 erros críticos de sincronização em 30 dias de operação

---

## Fora do Escopo (v1)

- Criação ou edição de campanhas pelo dashboard
- Integração com outras plataformas (TikTok Ads, Google Ads)
- App mobile
- Multi-tenant (múltiplos clientes isolados — cada cliente terá sua própria instância)
