# External Integrations

**Analysis Date:** 2026-03-16

## APIs & External Services

**Advertising / Tracking:**
- Meta Conversions API (CAPI) - Server-side lead event tracking
  - SDK/Client: Native `fetch` to `https://graph.facebook.com/v19.0/{PIXEL_ID}/events`
  - Auth: `META_CAPI_ACCESS_TOKEN` (server-only env var, never sent to browser)
  - Data hashed with SHA-256 before sending (phone, email, name, city, state, country)
  - Implementation: `src/app/api/lead/route.js`
  - Triggered: When landing page form is submitted (`POST /api/lead`)

- Meta Pixel (browser-side) - PageView tracking
  - SDK: Inline fbevents.js snippet injected in `src/app/layout.js`
  - Auth: `NEXT_PUBLIC_META_PIXEL_ID` (public browser env var)
  - Tracks PageView on every page load

- Google Ads Tag - Conversion tracking
  - SDK: Inline gtag.js snippet injected in `src/app/layout.js`
  - Auth: `NEXT_PUBLIC_GOOGLE_ADS_ID` (format `AW-XXXXXXXXX`)
  - Loaded via `https://www.googletagmanager.com/gtag/js`

**Automation (n8n):**
- n8n - WhatsApp chatbot automation that creates orders and updates contacts
  - Calls inbound webhooks on this app (see Webhooks section below)
  - No outbound calls to n8n from this app

## Data Storage

**Databases:**
- PostgreSQL - Primary data store
  - Connection: `DATABASE_URL` env var
  - Client: `pg` npm package, singleton Pool with max 10 connections
  - Pool config: `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 10000`
  - Implementation: `src/lib/db.js` exports `query(text, params)` helper
  - Host: VPS at `31.97.174.85`
  - Schema tables:
    - `crm_contacts` - Customer CRM records
    - `crm_orders` - Service orders
    - `crm_diaristas` - Cleaning staff
    - `n8n_chat_histories` - WhatsApp conversation history (JSONB)

**File Storage:**
- Local filesystem only (`public/` for static assets like `logo.png`)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Custom (hardcoded credentials, no external provider)
  - Credentials: hardcoded in `src/app/dashboard/login/page.js` (`admin@sosdiaristas.com` / `sos2026`)
  - Implementation: localStorage flag `sos-auth = '1'` set on successful login
  - Session check: `layout.js` at `src/app/dashboard/(app)/layout.js` reads localStorage on mount
  - No JWT, no server-side session validation, no cookie

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry or similar)

**Logs:**
- `console.error` with `error.message` and `error.stack` in all API route catch blocks

## CI/CD & Deployment

**Hosting:**
- Vercel (production URL: `sistemasos.queirozautomacoes.com.br`)
- GitHub repo: `gabrielpqueiroz/sos-diaristas`

**CI Pipeline:**
- Not detected (no GitHub Actions or similar config)

## Webhooks & Callbacks

**Incoming (called by n8n):**
- `POST /api/webhook/novo-pedido` - n8n calls this when WhatsApp SDR closes a booking
  - Accepts body as `[{...}]` (array) or `{...}` (object) — normalized with `Array.isArray(raw) ? raw[0] : raw`
  - Creates/finds contact by `phone` (used as `session_id`), then creates order
  - Implementation: `src/app/api/webhook/novo-pedido/route.js`

- `PATCH /api/dashboard/contatos/atualizar-por-telefone` - n8n calls this to update contact name/address
  - Implementation: `src/app/api/dashboard/contatos/atualizar-por-telefone/route.js`

- `GET /api/webhook/consultar-contato?phone=xxx` - n8n AI agent queries customer data from CRM
  - Returns contact info + last 5 orders
  - Implementation: `src/app/api/webhook/consultar-contato/route.js`

**Outgoing (called by this app):**
- Meta CAPI: `POST https://graph.facebook.com/v19.0/{PIXEL_ID}/events` on lead form submit

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string (server only)
- `META_PIXEL_ID` - Meta Pixel ID for server-side CAPI calls
- `META_CAPI_ACCESS_TOKEN` - Meta CAPI access token (keep server-side only)
- `NEXT_PUBLIC_META_PIXEL_ID` - Meta Pixel ID for browser pixel snippet
- `NEXT_PUBLIC_GOOGLE_ADS_ID` - Google Ads tag ID for browser gtag

**Secrets location:**
- `.env.local` (local development, not committed)
- Vercel environment variables (production)

---

*Integration audit: 2026-03-16*
