# Codebase Structure

**Analysis Date:** 2026-03-16

## Directory Layout

```
sos-diaristas/
├── src/
│   ├── app/
│   │   ├── layout.js                          # Root layout (Meta Pixel + Google Ads)
│   │   ├── page.js                            # Public landing page
│   │   ├── globals.css                        # Global CSS (Tailwind base)
│   │   ├── api/
│   │   │   ├── lead/
│   │   │   │   └── route.js                   # Lead form → Meta CAPI
│   │   │   ├── dashboard/
│   │   │   │   ├── stats/route.js             # KPI summary
│   │   │   │   ├── hoje/route.js              # Today's orders + diaristas + summary
│   │   │   │   ├── contatos/
│   │   │   │   │   ├── route.js               # GET (list+filter), POST (create)
│   │   │   │   │   ├── [id]/route.js          # GET (detail), PATCH, DELETE
│   │   │   │   │   └── atualizar-por-telefone/route.js  # PATCH via phone (n8n)
│   │   │   │   ├── pedidos/
│   │   │   │   │   ├── route.js               # GET (list+filter), POST (create)
│   │   │   │   │   └── [id]/route.js          # PATCH, DELETE
│   │   │   │   ├── diaristas/route.js         # GET, POST, PATCH, DELETE
│   │   │   │   ├── calendario/route.js        # GET monthly calendar data
│   │   │   │   └── relatorios/route.js        # GET report data
│   │   │   └── webhook/
│   │   │       ├── novo-pedido/route.js       # POST from n8n (create order)
│   │   │       └── consultar-contato/route.js # GET from n8n (lookup contact)
│   │   └── dashboard/
│   │       ├── _components/
│   │       │   ├── styles.js                  # GLASS, BG_GRADIENT, STATUS_COLORS
│   │       │   └── icons.js                   # SVG icon components
│   │       ├── login/
│   │       │   └── page.js                    # Login page
│   │       └── (app)/
│   │           ├── layout.js                  # Sidebar + auth guard
│   │           ├── page.js                    # /dashboard → Hoje (main page)
│   │           ├── visao-geral/page.js        # KPI overview
│   │           ├── contatos/
│   │           │   ├── page.js               # Contact CRM list
│   │           │   └── [id]/page.js          # Contact detail
│   │           ├── pedidos/page.js            # Kanban board
│   │           ├── calendario/page.js         # Monthly calendar
│   │           ├── diaristas/page.js          # Diaristas management
│   │           ├── relatorios/page.js         # Reports
│   │           └── hoje/page.js              # Redirect → /dashboard
├── lib/
│   └── db.js                                  # PostgreSQL pool + query()
├── public/
│   ├── logo.png                              # Brand logo (used in sidebar, login)
│   └── logo-icon.jpg                         # Brand icon
├── .planning/
│   └── codebase/                             # Architecture docs (this file)
├── .claude/
│   └── rules/                                # Claude Code rules per domain
├── next.config.js                            # Next.js config (standalone output)
├── tailwind.config.js                        # Tailwind config
├── jsconfig.json                             # Path alias @/* → src/*
├── package.json                              # Dependencies
└── CLAUDE.md                                 # Project instructions for Claude
```

## Directory Purposes

**`src/app/api/dashboard/`:**
- Purpose: Internal API endpoints consumed only by dashboard page components
- Contains: Route handlers for CRUD operations on all CRM entities
- Key files: `hoje/route.js`, `contatos/route.js`, `pedidos/route.js`

**`src/app/api/webhook/`:**
- Purpose: External-facing endpoints called by n8n automation
- Contains: `novo-pedido/route.js`, `consultar-contato/route.js`
- Note: Accept both `[{...}]` array and `{...}` object bodies from n8n

**`src/app/dashboard/(app)/`:**
- Purpose: Route group for all authenticated dashboard pages — the `(app)` group applies the sidebar layout without adding a URL segment
- Contains: All CRM page components
- Key files: `page.js` (Hoje/main), `layout.js` (auth + sidebar)

**`src/app/dashboard/_components/`:**
- Purpose: Shared UI primitives used across all dashboard pages
- Contains: `styles.js` (design tokens), `icons.js` (SVG components)
- Note: The underscore prefix `_` prevents Next.js from treating this as a route segment

**`src/lib/`:**
- Purpose: Server-side utilities shared across API routes
- Contains: Only `db.js` — the single PostgreSQL pool singleton
- Note: All API routes import `{ query }` from `@/lib/db`

## Key File Locations

**Entry Points:**
- `src/app/layout.js`: Root HTML shell, tracking scripts injected here
- `src/app/page.js`: Public landing page
- `src/app/dashboard/(app)/page.js`: Dashboard home (Hoje page, `/dashboard`)
- `src/app/dashboard/login/page.js`: Login form with hardcoded credentials

**Configuration:**
- `jsconfig.json`: Path alias `@/*` → `src/*`
- `next.config.js`: Standalone output mode for Vercel deployment
- `tailwind.config.js`: Tailwind customization
- `.env.local`: Environment variables (not committed)

**Core Logic:**
- `src/lib/db.js`: All database access goes through here
- `src/app/dashboard/_components/styles.js`: All visual design tokens
- `src/app/dashboard/(app)/layout.js`: Auth check and sidebar navigation definition

**Webhooks:**
- `src/app/api/webhook/novo-pedido/route.js`: n8n creates orders
- `src/app/api/webhook/consultar-contato/route.js`: n8n queries contacts
- `src/app/api/dashboard/contatos/atualizar-por-telefone/route.js`: n8n updates contacts

## Naming Conventions

**Files:**
- Pages: always `page.js` inside a folder matching the route segment
- Layouts: always `layout.js`
- API routes: always `route.js`
- Shared components: `kebab-case.js` (e.g., `styles.js`, `icons.js`)
- Dynamic segments: `[id]` folder naming

**Directories:**
- Route groups: `(app)` with parentheses — groups routes under a shared layout without URL impact
- Private dirs: `_components` with underscore — excluded from routing
- API namespacing: `api/dashboard/` for internal, `api/webhook/` for external

**Component exports:**
- All page and layout components are default exports
- Shared utilities (styles, icons) are named exports

## Where to Add New Code

**New Dashboard Page:**
- Page component: `src/app/dashboard/(app)/{page-name}/page.js`
- Add `'use client'` directive at top (all dashboard pages are client components)
- Add nav item to `navItems` array in `src/app/dashboard/(app)/layout.js`

**New API Endpoint:**
- Internal (dashboard use): `src/app/api/dashboard/{resource}/route.js`
- Webhook (n8n use): `src/app/api/webhook/{action}/route.js`
- Import `{ query }` from `@/lib/db` for all DB access

**New Shared Icon:**
- Add SVG component to `src/app/dashboard/_components/icons.js` as named export

**New Design Token:**
- Add to `src/app/dashboard/_components/styles.js` as named export constant

**New Database Query:**
- Write raw SQL directly in the API route handler using `query(sql, params)`
- No separate repository or service layer — SQL lives in the route file

**New Dynamic Route (detail page):**
- Create `src/app/dashboard/(app)/{resource}/[id]/page.js`
- Create `src/app/api/dashboard/{resource}/[id]/route.js` for the corresponding API

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No

**`.planning/`:**
- Purpose: Architecture analysis documents for GSD tooling
- Generated: By `/gsd:map-codebase` command
- Committed: Yes

**`.claude/`:**
- Purpose: Claude Code rules for different domains (API, dashboard)
- Generated: No (manually maintained)
- Committed: Yes

**`get-shit-done/`:**
- Purpose: GSD CLI tool codebase (separate nested git repo)
- Generated: No
- Committed: Yes (nested repo)

**`public/`:**
- Purpose: Static assets served at root URL
- Contains: `logo.png`, `logo-icon.jpg`
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-16*
