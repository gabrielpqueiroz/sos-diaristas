# Spec.md — Especificações Técnicas

## Stack de Tecnologia

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | JavaScript (sem TypeScript) |
| Estilização | Tailwind CSS (inline, sem shadcn) |
| Banco | PostgreSQL 16 (VPS) |
| Driver DB | `pg` (node-postgres) |
| Automação | n8n (webhooks HTTP) |
| Deploy | Vercel (auto-deploy via GitHub) |
| Domínio | sistemasos.queirozautomacoes.com.br |

---

## Estrutura do Projeto

```
sos-diaristas/
├── src/
│   ├── app/
│   │   ├── page.js                          # Landing page pública
│   │   ├── layout.js                        # Root layout (Pixel + Google Ads)
│   │   ├── globals.css                      # Tailwind base
│   │   ├── api/
│   │   │   ├── lead/route.js                # Form → Meta CAPI
│   │   │   ├── dashboard/
│   │   │   │   ├── stats/route.js           # KPIs gerais
│   │   │   │   ├── contatos/route.js        # CRUD contatos
│   │   │   │   ├── contatos/[id]/route.js
│   │   │   │   ├── contatos/atualizar-por-telefone/route.js
│   │   │   │   ├── pedidos/route.js         # CRUD pedidos
│   │   │   │   ├── pedidos/[id]/route.js
│   │   │   │   ├── diaristas/route.js       # CRUD diaristas
│   │   │   │   ├── calendario/route.js
│   │   │   │   ├── hoje/route.js
│   │   │   │   └── relatorios/route.js
│   │   │   └── webhook/
│   │   │       ├── novo-pedido/route.js     # n8n → criar pedido
│   │   │       └── consultar-contato/route.js # n8n → buscar cliente
│   │   └── dashboard/
│   │       ├── (app)/
│   │       │   ├── page.js                  # HOJE (página principal)
│   │       │   ├── visao-geral/page.js
│   │       │   ├── contatos/page.js
│   │       │   ├── contatos/[id]/page.js
│   │       │   ├── pedidos/page.js          # Kanban
│   │       │   ├── calendario/page.js
│   │       │   ├── diaristas/page.js
│   │       │   ├── relatorios/page.js
│   │       │   └── layout.js               # Sidebar + auth
│   │       ├── login/page.js
│   │       └── _components/
│   │           ├── icons.js
│   │           └── styles.js               # GLASS, BG_GRADIENT, STATUS_COLORS
│   └── lib/
│       └── db.js                            # PostgreSQL pool
├── public/                                   # Logo, imagens
├── CLAUDE.md
├── PRD.md
├── Spec.md
├── package.json
└── tailwind.config.js
```

---

## Schema do Banco de Dados

```sql
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,                    -- telefone (identificador n8n)
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  status TEXT DEFAULT 'novo',        -- novo|qualificado|agendado|cliente|inativo|perdido
  is_recurring BOOLEAN DEFAULT false,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  last_contact_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE crm_diaristas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  specialties TEXT,                   -- separado por vírgula
  status TEXT DEFAULT 'ativa',       -- ativa|inativa|ferias
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE crm_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES crm_contacts(id),
  session_id TEXT,
  service_type TEXT,                  -- ex: "Limpeza 5h"
  status TEXT DEFAULT 'pendente',    -- pendente|agendado|confirmado|diarista_atribuida|em_andamento|concluido|cancelado
  scheduled_date DATE,
  scheduled_time TIME,
  address TEXT,
  diarista_id UUID REFERENCES crm_diaristas(id),
  value NUMERIC,
  payment_status TEXT DEFAULT 'pendente',  -- pendente|parcial|pago
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE n8n_chat_histories (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  message JSONB,
  type TEXT,                          -- human|ai
  created_at TIMESTAMP DEFAULT now()
);
```

---

## API Endpoints

### Dashboard
```
GET  /api/dashboard/stats?period=7d|30d|90d      → KPIs gerais
GET  /api/dashboard/hoje                          → Dados do dia (pedidos, diaristas, amanhã)
GET  /api/dashboard/relatorios?periodo=7d|30d|90d|all → Dados de relatórios
GET  /api/dashboard/calendario?month=YYYY-MM      → Pedidos por dia do mês
```

### Contatos
```
GET    /api/dashboard/contatos?search=&status=&page=&limit=  → Lista paginada
POST   /api/dashboard/contatos                               → Criar contato
GET    /api/dashboard/contatos/[id]                          → Detalhe
PATCH  /api/dashboard/contatos/[id]                          → Atualizar
DELETE /api/dashboard/contatos/[id]                          → Excluir
PATCH  /api/dashboard/contatos/atualizar-por-telefone        → Webhook n8n
```

### Pedidos
```
GET    /api/dashboard/pedidos?status=&page=&limit=  → Lista com statusCounts
POST   /api/dashboard/pedidos                       → Criar pedido
PATCH  /api/dashboard/pedidos/[id]                  → Atualizar (status, pagamento, etc)
DELETE /api/dashboard/pedidos/[id]                  → Excluir
```

### Diaristas
```
GET    /api/dashboard/diaristas          → Lista com contagem de pedidos
POST   /api/dashboard/diaristas          → Criar
PATCH  /api/dashboard/diaristas          → Atualizar
DELETE /api/dashboard/diaristas?id=xxx   → Excluir
```

### Webhooks (n8n)
```
POST /api/webhook/novo-pedido            → Cria pedido (aceita array ou objeto)
GET  /api/webhook/consultar-contato?phone=xxx → Consulta cliente no CRM
```

### Landing Page
```
POST /api/lead                           → Form → Meta CAPI
```

---

## Tabela de Preços

| Horas | Valor |
|---|---|
| 2h | R$ 125 |
| 3h | R$ 135 |
| 4h | R$ 145 |
| 5h | R$ 155 |
| 6h | R$ 180 |
| 7h | R$ 210 |
| 8h | R$ 220 |
| 9h | R$ 230 |
| 10h | R$ 240 |

---

## Design System

| Token | Valor |
|---|---|
| brand.blue | #1B5FA8 |
| brand.navy | #1A3A6B |
| brand.light | #E8F1FB |
| Fonte | Inter (Google Fonts) |
| Tema | Dark + Glassmorphism |
| Cards | GLASS (styles.js) |
| Background | BG_GRADIENT (styles.js) |

---

## Variáveis de Ambiente

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db

# Landing page tracking
NEXT_PUBLIC_META_PIXEL_ID=xxx
META_PIXEL_ID=xxx
META_CAPI_ACCESS_TOKEN=xxx         # NUNCA expor no browser
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-xxx
```

---

## Integrações

### n8n → Sistema
- Agente IA no WhatsApp (n8n) agenda serviços chamando webhook `novo-pedido`
- Agente consulta dados do cliente via `consultar-contato`
- Agente atualiza nome/endereço via `atualizar-por-telefone`

### Landing → WhatsApp
- Formulário dispara Meta CAPI server-side + Pixel client-side
- Redireciona pra WhatsApp com mensagem pré-formatada
