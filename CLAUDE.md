# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This monorepo contains two systems:
1. **`/` (root = landing page)** — Next.js 14 landing page for SOS Diaristas (limpeza profissional, Foz do Iguaçu)
2. **`/dashboard`** — Next.js 14 admin dashboard (a ser criado)
3. **`/api`** — FastAPI + LangChain backend (a ser criado)

## Landing Page (raiz do projeto)

### Commands
```bash
npm run dev       # dev server em http://localhost:3000
npm run build     # build de produção
npm run start     # inicia build de produção
```

### Architecture
- **Next.js 14 App Router** — `src/app/` com layout.js (Meta Pixel + Google Ads) e page.js (landing completa)
- **API Route** — `src/app/api/lead/route.js` — recebe dados do formulário e envia evento Lead para Meta CAPI via server-side (SHA-256 hashed)
- **Tailwind CSS** — design system baseado em `brand.blue (#1B5FA8)`, `brand.navy (#1A3A6B)`, `brand.light (#E8F1FB)`, fonte Inter
- Formulário redireciona para WhatsApp após submit + dispara evento CAPI + Meta Pixel client-side + Google Ads conversion

### Environment variables (`.env.local`)
```
NEXT_PUBLIC_META_PIXEL_ID   # exposto no browser
META_PIXEL_ID               # server-side only
META_CAPI_ACCESS_TOKEN      # server-side only — NUNCA expor no browser
NEXT_PUBLIC_GOOGLE_ADS_ID   # exposto no browser (formato AW-XXXXXXXXX)
```

## Sistema de Dashboard (planejado — ver PRD.md e Spec.md)

### Estrutura planejada
```
/api/        FastAPI + LangChain + SQLAlchemy (Python)
/dashboard/  Next.js 14 + Tailwind + shadcn/ui (TypeScript)
docker-compose.yml
```

### Commands (quando implementado)
```bash
docker-compose up -d              # sobe todos os serviços
docker-compose up -d postgres     # só o banco

cd api && uvicorn main:app --reload   # API em dev
cd dashboard && npm run dev           # dashboard em dev

cd api && alembic upgrade head        # aplica migrations
cd api && alembic revision --autogenerate -m "desc"  # cria migration
```

## Design System (compartilhado landing + dashboard)

| Token | Valor |
|---|---|
| `brand.blue` | `#1B5FA8` |
| `brand.navy` | `#1A3A6B` |
| `brand.light` | `#E8F1FB` |
| Fonte | Inter (Google Fonts) |

O dashboard deve herdar exatamente este design system — mesmas cores, mesma tipografia, estilo limpo e profissional.

## Integrações externas

- **Meta Marketing API** — `graph.facebook.com/v19.0` — autenticação via `access_token` longo prazo
- **Meta CAPI** — `/{pixel_id}/events` — hashing SHA-256 obrigatório nos dados do usuário
- **LangChain** — agente de análise de métricas com tool calls para buscar dados no banco
