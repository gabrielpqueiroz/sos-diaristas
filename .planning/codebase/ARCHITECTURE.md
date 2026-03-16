# Architecture

**Analysis Date:** 2026-03-16

## Pattern Overview

**Overall:** Monolithic Next.js 14 App Router application — public landing page + private admin CRM in a single codebase.

**Key Characteristics:**
- No separate frontend/backend split — API routes and pages coexist under `src/app/`
- No ORM — raw parameterized SQL via a single shared `pg` pool
- No global state management library — local `useState`/`useEffect` with direct `fetch` calls per page
- Client-side auth guard only — localStorage flag `sos-auth` checked in layout
- Credentials hardcoded in login page (not env-based)

## Layers

**Public Layer:**
- Purpose: Marketing landing page with lead capture form
- Location: `src/app/page.js`
- Contains: Landing page UI, lead form that submits to `/api/lead`
- Depends on: `src/app/api/lead/route.js` (Meta CAPI integration)
- Used by: Public visitors

**Admin Dashboard Layer:**
- Purpose: CRM for managing contacts, orders, diaristas, and daily operations
- Location: `src/app/dashboard/(app)/`
- Contains: Page components — Hoje, Visão Geral, Contatos, Pedidos, Calendário, Diaristas, Relatórios
- Depends on: `/api/dashboard/*` routes, `src/app/dashboard/_components/`
- Used by: Authenticated admin user

**API Layer:**
- Purpose: Server-side data access and external integrations
- Location: `src/app/api/`
- Contains: Next.js route handlers (route.js files)
- Depends on: `src/lib/db.js` for all database queries
- Used by: Dashboard pages (internal fetch), n8n (webhooks)

**Data Access Layer:**
- Purpose: Singleton PostgreSQL connection pool
- Location: `src/lib/db.js`
- Contains: `query()` function and `getPool()` singleton
- Depends on: `DATABASE_URL` environment variable, `pg` npm package
- Used by: All API route handlers

**Shared UI Components:**
- Purpose: Design system tokens and SVG icons reused across dashboard pages
- Location: `src/app/dashboard/_components/`
- Contains: `styles.js` (GLASS, BG_GRADIENT, STATUS_COLORS, STATUS_LABELS), `icons.js` (SVG icon components)
- Depends on: Nothing
- Used by: All dashboard page components and layout

## Data Flow

**Lead Capture (Landing → Meta CAPI):**

1. Visitor fills form on `src/app/page.js`
2. Browser POSTs to `/api/lead`
3. `src/app/api/lead/route.js` hashes PII with SHA-256 and POSTs to `https://graph.facebook.com/v19.0/{PIXEL_ID}/events`
4. Response returned to browser

**n8n Webhook → New Order:**

1. n8n POSTs to `POST /api/webhook/novo-pedido` with phone + service details
2. `src/app/api/webhook/novo-pedido/route.js` looks up `crm_contacts` by `session_id` (phone)
3. If not found, creates new contact with status `agendado`
4. Inserts row in `crm_orders`, updates contact stats
5. Returns `{ ok: true, order_id, contact_id }`

**Dashboard Page Data Flow:**

1. Page component mounts with `'use client'`
2. `useEffect` fires `fetch('/api/dashboard/{resource}')` via `useCallback`-wrapped `loadData`
3. API route handler runs `query()` against PostgreSQL with parameterized SQL
4. JSON response sets component state, triggers re-render
5. Auto-refresh: Hoje page refreshes silently every 20s, Pedidos every 30s via `setInterval`

**Dashboard Mutation Flow (e.g., update order status):**

1. User action on page triggers `async function updateOrder(id, updates)`
2. Component calls `PATCH /api/dashboard/pedidos/{id}` with JSON body
3. API route runs UPDATE SQL
4. Component calls `loadData(true)` (silent refresh) to pull new state

**State Management:**
- No global store. Each page manages its own state with `useState`.
- Auth state: single localStorage key `sos-auth = '1'` checked in `src/app/dashboard/(app)/layout.js`

## Key Abstractions

**`query(text, params)` — `src/lib/db.js`:**
- Purpose: Single function for all database operations, handles connection checkout/release
- Pattern: Returns full `pg` result object; callers access `.rows`

**`GLASS`, `BG_GRADIENT`, `STATUS_COLORS` — `src/app/dashboard/_components/styles.js`:**
- Purpose: Shared design tokens applied via inline `style={}` props on all dashboard components
- Pattern: Import named constants, spread or reference directly in JSX style attributes

**`navItems` array — `src/app/dashboard/(app)/layout.js`:**
- Purpose: Single source of truth for sidebar navigation links and icons
- Pattern: Array of `{ id, label, href, icon }` objects rendered as `<Link>` elements

**Route Handlers — `src/app/api/**\/route.js`:**
- Purpose: Each file exports HTTP method handlers (GET, POST, PATCH, DELETE)
- Pattern: `import { query } from '@/lib/db'` → parameterized SQL → `return NextResponse.json()`
- Error pattern: `catch (error) { return NextResponse.json({ error: '...', detail: error.message }, { status: 500 }) }`

## Entry Points

**Root Layout:**
- Location: `src/app/layout.js`
- Triggers: Every page render
- Responsibilities: Injects Meta Pixel and Google Ads scripts into `<head>`, sets HTML lang, wraps body

**Landing Page:**
- Location: `src/app/page.js`
- Triggers: GET `/`
- Responsibilities: Public marketing page, lead capture form

**Dashboard Layout (Auth Guard):**
- Location: `src/app/dashboard/(app)/layout.js`
- Triggers: Any `/dashboard/*` route except login
- Responsibilities: Checks `localStorage.sos-auth`, redirects to `/dashboard/login` if absent, renders sidebar navigation

**Dashboard Home (Hoje):**
- Location: `src/app/dashboard/(app)/page.js`
- Triggers: GET `/dashboard`
- Responsibilities: Today's operations view — orders list, diarista assignments, payment status, summary KPIs

**Login:**
- Location: `src/app/dashboard/login/page.js`
- Triggers: GET `/dashboard/login`
- Responsibilities: Validates hardcoded credentials (email/password in source), sets `localStorage.sos-auth = '1'`

## Error Handling

**Strategy:** Each API route wraps logic in try/catch. Errors always return JSON with two fields for easy debugging.

**Patterns:**
- API error shape: `{ error: 'Human message', detail: error.message }` with appropriate HTTP status
- Always `console.error(error.message, error.stack)` in catch blocks
- Frontend: `catch (e) { console.error(e) }` — errors are swallowed silently in most page components (no user-visible error UI for data fetch failures)
- Validation: Required fields checked at top of handler; return 400 with `{ error: '...' }` if missing

## Cross-Cutting Concerns

**Logging:** `console.error` only in API catch blocks. No structured logging library.
**Validation:** Manual checks in each route handler. No shared validation schema or library.
**Authentication:** localStorage flag checked client-side in layout. No server-side session, no JWT, no middleware.
**Path Alias:** `@/*` maps to `src/*` (configured in `jsconfig.json`), used consistently in all imports.

---

*Architecture analysis: 2026-03-16*
