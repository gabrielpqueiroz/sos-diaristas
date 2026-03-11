# Spec.md — Especificações Técnicas

## Stack de Tecnologia

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) | Consistência com landing page |
| UI | Tailwind CSS + shadcn/ui | Design system elegante, acessível |
| Gráficos | Recharts | Leve, integra bem com React |
| Backend | FastAPI (Python 3.12) | Async, tipado, ideal para LangChain |
| ORM | SQLAlchemy 2.0 + Alembic | Migrations declarativas, async support |
| Banco | PostgreSQL 16 | Robusto, JSON support, timeseries-friendly |
| Agente IA | LangChain + OpenAI GPT-4o (ou Claude 3.5 Sonnet) | Tool calling para queries no banco |
| Meta Ads | `facebook-business` SDK (Python) | SDK oficial da Meta |
| Auth | JWT (python-jose) + bcrypt | Stateless, simples para v1 |
| Containerização | Docker + Docker Compose | Ambiente reproduzível |
| Task scheduler | APScheduler (embutido no FastAPI) | Sync periódico sem infra extra |

---

## Estrutura de Diretórios

```
sos-diaristas/
├── landing/                    ← landing page (Next.js, código atual movido aqui)
│   ├── src/app/
│   ├── public/
│   └── package.json
│
├── dashboard/                  ← admin dashboard (Next.js 14, TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx          ← sidebar + navbar
│   │   │   │   ├── page.tsx            ← visão geral
│   │   │   │   ├── campanhas/page.tsx  ← tabela de campanhas
│   │   │   │   ├── agente/page.tsx     ← chat com IA
│   │   │   │   └── configuracoes/page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             ← shadcn/ui components
│   │   │   ├── charts/         ← Recharts wrappers
│   │   │   ├── kpi-card.tsx
│   │   │   └── agent-chat.tsx
│   │   ├── lib/
│   │   │   ├── api.ts          ← fetch wrapper para o backend
│   │   │   └── auth.ts         ← JWT helpers
│   │   └── types/
│   │       └── metrics.ts
│   └── package.json
│
├── api/                        ← FastAPI backend (Python)
│   ├── app/
│   │   ├── main.py             ← FastAPI app, rotas, CORS, scheduler
│   │   ├── config.py           ← Settings (Pydantic BaseSettings)
│   │   ├── database.py         ← engine, SessionLocal, Base
│   │   ├── models/             ← SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── ad_account.py
│   │   │   ├── campaign.py
│   │   │   └── metric.py
│   │   ├── schemas/            ← Pydantic schemas (request/response)
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── accounts.py
│   │   │   ├── campaigns.py
│   │   │   ├── metrics.py
│   │   │   └── agent.py
│   │   ├── services/
│   │   │   ├── meta_ads.py     ← wrapper Meta Marketing API
│   │   │   ├── sync.py         ← lógica de sincronização
│   │   │   └── agent.py        ← LangChain agent setup
│   │   └── agents/
│   │       ├── tools.py        ← LangChain tools (queries no banco)
│   │       └── prompts.py      ← system prompt do gestor de tráfego
│   ├── alembic/
│   │   └── versions/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
├── docker-compose.override.yml ← sobreposições de dev (volumes, hot reload)
├── .env.example
├── CLAUDE.md
├── PRD.md
└── Spec.md
```

---

## Schema do Banco de Dados

```sql
-- Usuários do sistema
users
  id          UUID PK
  email       VARCHAR UNIQUE NOT NULL
  password    VARCHAR NOT NULL          -- bcrypt hash
  name        VARCHAR
  created_at  TIMESTAMP

-- Contas de anúncios conectadas
ad_accounts
  id              UUID PK
  name            VARCHAR NOT NULL
  account_id      VARCHAR NOT NULL      -- Meta: act_XXXXXXXXX
  access_token    TEXT NOT NULL         -- criptografado com Fernet
  created_at      TIMESTAMP
  last_synced_at  TIMESTAMP

-- Campanhas (snapshots sincronizados)
campaigns
  id              UUID PK
  ad_account_id   UUID FK → ad_accounts
  campaign_id     VARCHAR NOT NULL      -- ID da Meta
  name            VARCHAR NOT NULL
  status          VARCHAR               -- ACTIVE | PAUSED | ARCHIVED
  objective       VARCHAR
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

-- Métricas diárias por campanha
campaign_metrics
  id              UUID PK
  campaign_id     UUID FK → campaigns
  date            DATE NOT NULL
  impressions     BIGINT
  reach           BIGINT
  clicks          BIGINT
  spend           NUMERIC(12,2)
  cpm             NUMERIC(10,4)
  cpc             NUMERIC(10,4)
  ctr             NUMERIC(8,4)
  leads           INTEGER
  cost_per_lead   NUMERIC(10,4)
  frequency       NUMERIC(8,4)
  UNIQUE(campaign_id, date)

-- Histórico de conversas com o agente
agent_conversations
  id          UUID PK
  user_id     UUID FK → users
  messages    JSONB NOT NULL            -- array de {role, content, timestamp}
  created_at  TIMESTAMP
  updated_at  TIMESTAMP
```

---

## API Endpoints

### Auth
```
POST /auth/login          → { access_token, token_type }
POST /auth/refresh
```

### Contas de Anúncios
```
GET    /accounts              → lista contas
POST   /accounts              → conecta nova conta (valida token com Meta)
DELETE /accounts/{id}
POST   /accounts/{id}/sync    → força sincronização manual
```

### Campanhas e Métricas
```
GET /campaigns                       → lista com métricas agregadas
GET /campaigns/{id}
GET /campaigns/{id}/metrics?start=&end=   → série temporal
GET /metrics/summary?period=7d|14d|30d    → KPIs consolidados
```

### Agente IA
```
POST /agent/chat              → { message } → { reply, sources }
GET  /agent/daily-insight     → análise proativa do dia
GET  /agent/conversations     → histórico
```

---

## Agente LangChain — Arquitetura

### System Prompt
O agente é instruído a se comportar como um **gestor de tráfego sênior com 10 anos de experiência** em Meta Ads para negócios locais brasileiros. Tom direto, analítico, sem rodeios. Sempre justifica insights com os números.

### Tools disponíveis para o agente

```python
@tool
def get_campaign_metrics(campaign_id: str, period_days: int) -> dict:
    """Retorna métricas de uma campanha específica"""

@tool
def get_top_campaigns(metric: str, limit: int) -> list:
    """Retorna top N campanhas por métrica (spend, leads, ctr, etc.)"""

@tool
def get_summary(period_days: int) -> dict:
    """Retorna KPIs consolidados de todas as campanhas"""

@tool
def get_trend(metric: str, period_days: int) -> list:
    """Retorna evolução diária de uma métrica"""

@tool
def compare_campaigns(campaign_ids: list[str], metric: str) -> dict:
    """Compara métricas entre campanhas"""
```

### Fluxo de uma mensagem
```
User message
    → LangChain agent (GPT-4o ou Claude Sonnet)
    → decide quais tools chamar
    → tools executam queries no PostgreSQL
    → agente sintetiza os dados
    → resposta em linguagem natural com insights
    → frontend exibe em markdown
```

---

## Docker Compose

```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: sosdiaristas
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports: ["5432:5432"]

  api:
    build: ./api
    environment:
      DATABASE_URL: postgresql+asyncpg://...
      SECRET_KEY: ${SECRET_KEY}
      META_ENCRYPTION_KEY: ${META_ENCRYPTION_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}  # ou ANTHROPIC_API_KEY
    ports: ["8000:8000"]
    depends_on: [postgres]

  dashboard:
    build: ./dashboard
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports: ["3001:3000"]
    depends_on: [api]
```

---

## Variáveis de Ambiente (`.env`)

```bash
# Banco
POSTGRES_USER=sosdiaristas
POSTGRES_PASSWORD=...
DATABASE_URL=postgresql+asyncpg://sosdiaristas:...@postgres:5432/sosdiaristas

# Auth
SECRET_KEY=...                    # chave JWT (256 bits)
META_ENCRYPTION_KEY=...           # Fernet key para criptografar access_tokens

# IA
OPENAI_API_KEY=...                # ou ANTHROPIC_API_KEY
LLM_PROVIDER=openai               # openai | anthropic

# Dashboard
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Design System do Dashboard

Herdar exatamente os tokens da landing page:

```typescript
// tailwind.config.ts (dashboard)
colors: {
  brand: {
    blue:  '#1B5FA8',
    navy:  '#1A3A6B',
    light: '#E8F1FB',
  }
}
fontFamily: { sans: ['Inter', 'sans-serif'] }
```

### Componentes visuais (shadcn/ui)
- `Card` — KPI cards com bordas suaves e shadow-sm
- `Table` — tabela de campanhas com ordenação
- `Badge` — status da campanha (verde/vermelho/cinza)
- `Dialog` / `Sheet` — configurações e detalhes
- `Sidebar` — navegação lateral com estilo navy escuro

### Paleta do dashboard
- Background: `#F8FAFC` (cinza muito claro)
- Sidebar: `brand.navy` (#1A3A6B) com texto branco
- Accent: `brand.blue` (#1B5FA8)
- Sucesso/positivo: `#16A34A`
- Alerta/negativo: `#DC2626`

---

## Ordem de Implementação

1. **Infraestrutura** — `docker-compose.yml`, PostgreSQL, FastAPI skeleton, Alembic migrations
2. **Auth** — login JWT, middleware de proteção de rotas
3. **Meta Ads Service** — conexão, busca de campanhas e métricas
4. **Sync Service** — salvar métricas no banco, cron job
5. **API Endpoints** — accounts, campaigns, metrics
6. **Dashboard Frontend** — layout, KPI cards, tabela, gráficos
7. **Agente LangChain** — tools, system prompt, endpoint de chat
8. **Chat UI** — interface de conversa no dashboard
9. **Polish** — análise proativa diária, alertas, histórico
