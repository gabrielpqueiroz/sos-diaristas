# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Aplicação monolítica Next.js 14 para **SOS Diaristas** (serviço de limpeza profissional, Foz do Iguaçu).
Contém landing page pública + dashboard admin CRM, tudo no mesmo projeto.

- **Produção:** `sistemasos.queirozautomacoes.com.br` (Vercel)
- **GitHub:** `gabrielpqueiroz/sos-diaristas`
- **Banco:** PostgreSQL em VPS (`31.97.174.85`)
- **Automação:** n8n (webhooks para criar pedidos e atualizar contatos)

## Commands

```bash
npm run dev       # dev server em http://localhost:3000
npm run build     # build de produção
npm run start     # inicia build de produção
```

## Architecture

- **Next.js 14 App Router** — `src/app/`
- **Tailwind CSS** — design system dark theme, glassmorphism
- **PostgreSQL** — via `pg` pool (`src/lib/db.js`)
- **Sem TypeScript** — todo o projeto é JavaScript
- **Sem shadcn/ui** — componentes customizados com Tailwind inline
- **Auth simples** — localStorage (sem JWT)

## Estrutura de Páginas

```
src/app/
├── page.js                          # Landing page pública
├── layout.js                        # Root layout (Meta Pixel + Google Ads)
├── api/
│   ├── lead/route.js                # Landing form → Meta CAPI
│   ├── dashboard/
│   │   ├── stats/route.js           # KPIs gerais
│   │   ├── contatos/route.js        # CRUD contatos
│   │   ├── contatos/[id]/route.js   # Detalhe contato
│   │   ├── contatos/atualizar-por-telefone/route.js  # Webhook n8n
│   │   ├── pedidos/route.js         # CRUD pedidos
│   │   ├── pedidos/[id]/route.js    # Update/delete pedido
│   │   ├── diaristas/route.js       # CRUD diaristas
│   │   ├── calendario/route.js      # Dados calendário
│   │   ├── hoje/route.js            # Dados do dia
│   │   └── relatorios/route.js      # Dados relatórios
│   └── webhook/
│       ├── novo-pedido/route.js     # n8n cria pedido (aceita array ou objeto)
│       └── consultar-contato/route.js  # n8n consulta dados do cliente
├── dashboard/
│   ├── (app)/
│   │   ├── page.js                  # Página HOJE (página principal)
│   │   ├── visao-geral/page.js      # Visão geral com KPIs
│   │   ├── contatos/page.js         # CRM contatos
│   │   ├── contatos/[id]/page.js    # Detalhe contato
│   │   ├── pedidos/page.js          # Kanban pedidos
│   │   ├── calendario/page.js       # Calendário mensal
│   │   ├── diaristas/page.js        # Cadastro diaristas
│   │   ├── relatorios/page.js       # Relatórios
│   │   ├── hoje/page.js             # Redirect → /dashboard
│   │   └── layout.js                # Sidebar + auth check
│   ├── login/page.js                # Login
│   └── _components/
│       ├── icons.js                 # SVG icons
│       └── styles.js                # GLASS, BG_GRADIENT, STATUS_COLORS
```

## Database Schema (PostgreSQL)

```sql
crm_contacts    — id, session_id, name, phone, email, address, neighborhood, city,
                  status, is_recurring, total_orders, total_revenue, last_contact_at
crm_orders      — id, contact_id, session_id, service_type, status, scheduled_date,
                  scheduled_time, address, diarista_id, value, payment_status, notes
crm_diaristas   — id, name, phone, specialties, status, notes
n8n_chat_histories — id, session_id, message (JSONB), type (human|ai)
```

### Status de pedidos
`pendente → agendado → confirmado → diarista_atribuida → em_andamento → concluido`
Também: `cancelado`

### Status de pagamento
`pendente | parcial | pago`

### Status de contatos
`novo | qualificado | agendado | cliente | inativo | perdido`

### Status de diaristas
`ativa | inativa | ferias`

## Design System

| Token | Valor |
|---|---|
| `brand.blue` | `#1B5FA8` |
| `brand.navy` | `#1A3A6B` |
| `brand.light` | `#E8F1FB` |
| Fonte | Inter (Google Fonts) |
| Tema | Dark com glassmorphism |
| Background | `BG_GRADIENT` (definido em styles.js) |
| Cards | `GLASS` (definido em styles.js) |

## Webhooks para n8n (3 endpoints)

1. `POST /api/webhook/novo-pedido` — Cria pedido (aceita `[{...}]` ou `{...}`)
2. `PATCH /api/dashboard/contatos/atualizar-por-telefone` — Atualiza nome/endereço
3. `GET /api/webhook/consultar-contato?phone=xxx` — Consulta cliente no CRM

## Environment Variables (`.env.local`)

```
DATABASE_URL                # PostgreSQL connection string
NEXT_PUBLIC_META_PIXEL_ID   # Meta Pixel (browser)
META_PIXEL_ID               # Meta Pixel (server)
META_CAPI_ACCESS_TOKEN      # Meta CAPI token — NUNCA expor no browser
NEXT_PUBLIC_GOOGLE_ADS_ID   # Google Ads (browser, formato AW-XXXXXXXXX)
```

## Tabela de Preços (hardcoded em pedidos/page.js)

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

## Notas Importantes

- A usuária principal do dashboard é uma senhora — UX deve ser intuitivo, fontes grandes, botões claros com texto descritivo
- O dashboard usa tema escuro (dark mode) com efeito glass
- Página "Hoje" (`/dashboard`) é a principal — controle do dia a dia
- Auto-refresh: Hoje (20s), Pedidos (30s)
- Todos os endpoints retornam `{ detail: error.message }` no erro para facilitar debug
