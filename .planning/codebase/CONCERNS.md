# Codebase Concerns

**Analysis Date:** 2026-03-16

---

## Security Considerations

**Hardcoded Admin Credentials in Client-Side Code:**
- Risk: Admin email (`admin@sosdiaristas.com`) and password (`sos2026`) are hardcoded as plaintext constants in a client component. Since it's a `'use client'` component, the entire source (including credentials) is sent to the browser and visible in the JS bundle.
- Files: `src/app/dashboard/login/page.js` lines 7–8
- Current mitigation: None — credentials are fully exposed in the downloaded bundle.
- Recommendations: Move authentication to a server action or API route. Compare credentials against environment variables server-side. At minimum, never store them in a client component.

**Authentication Relies on localStorage Flag Only:**
- Risk: The entire dashboard is "protected" by checking `localStorage.getItem('sos-auth') === '1'`. Any user who opens DevTools and sets this key bypasses login entirely. API routes have zero authentication checks — they are publicly accessible.
- Files: `src/app/dashboard/(app)/layout.js` lines 26–34, all `src/app/api/dashboard/**` routes
- Current mitigation: None server-side. Client check is bypassable.
- Recommendations: Add server-side middleware (`middleware.js`) with session cookies or JWT. All `/api/dashboard/*` routes should validate a server-side session token before returning data.

**Webhook Endpoints Have No Authentication:**
- Risk: `POST /api/webhook/novo-pedido` and `GET /api/webhook/consultar-contato` are publicly accessible with no API key, IP allowlist, or HMAC signature verification. Anyone can create orders or read customer data.
- Files: `src/app/api/webhook/novo-pedido/route.js`, `src/app/api/webhook/consultar-contato/route.js`, `src/app/api/dashboard/contatos/atualizar-por-telefone/route.js`
- Current mitigation: None.
- Recommendations: Add a shared secret header (`x-webhook-secret`) checked against an env var. n8n supports sending custom headers on outgoing requests.

**SQL String Interpolation in stats/route.js:**
- Risk: The `interval` variable (derived from `searchParams.get('period')`) is interpolated directly into SQL strings using template literals, not parameterized. Although the value is constrained by a `switch` statement, this pattern bypasses the parameterized query protection provided elsewhere.
- Files: `src/app/api/dashboard/stats/route.js` lines 29, 54, 78
- Current mitigation: Switch statement limits values to `'1 day'`, `'7 days'`, `'30 days'`, `'90 days'` — the immediate risk is low.
- Recommendations: Refactor to use parameterized interval or replace with explicit date range parameters (`$1::interval` with a safe mapping). Establishes a dangerous pattern if copied.

**Admin Username Exposed as Placeholder in Input:**
- Risk: The email input has `placeholder="admin@sosdiaristas.com"`, broadcasting the admin login to any visitor of `/dashboard/login`.
- Files: `src/app/dashboard/login/page.js` line 117
- Current mitigation: None.
- Recommendations: Remove the placeholder or use a generic value like "seu@email.com".

---

## Tech Debt

**No Test Coverage Whatsoever:**
- Issue: There are no test files anywhere in the project — no unit tests, no integration tests, no E2E tests.
- Files: Entire `src/` directory
- Impact: Any refactor or new feature can silently break existing functionality. Critical paths like order creation, contact updates, and webhook processing have zero automated verification.
- Fix approach: Add Vitest for unit/integration tests of API route logic. Focus first on `src/lib/db.js`, webhook routes, and order status transitions.

**Pricing Table Hardcoded in UI Component:**
- Issue: The `HOURS_PRICING` array (2h–10h with associated prices) is hardcoded directly in the Pedidos page component. Changing prices requires a code deploy.
- Files: `src/app/dashboard/(app)/pedidos/page.js` lines 7–17
- Impact: Business owner cannot update pricing without developer intervention.
- Fix approach: Move pricing to a database table or environment-accessible config. Expose a simple admin UI to edit prices.

**Contact Stats Are Denormalized and Updated Inconsistently:**
- Issue: `total_orders` and `total_revenue` on `crm_contacts` are recalculated with subqueries on every order mutation. Not all paths update both fields — the webhook `novo-pedido` only updates `total_orders`, not `total_revenue`. The `atualizar-por-telefone` endpoint never updates stats.
- Files: `src/app/api/webhook/novo-pedido/route.js` lines 57–63, `src/app/api/dashboard/pedidos/route.js` lines 80–88, `src/app/api/dashboard/pedidos/[id]/route.js` lines 43–53
- Impact: `total_revenue` and `total_orders` shown in the CRM can drift out of sync with actual order data.
- Fix approach: Add a PostgreSQL trigger that recalculates stats on `INSERT/UPDATE/DELETE` on `crm_orders`, removing the denormalization from application code.

**Meta Graph API Version Pinned to v19.0:**
- Issue: The Meta CAPI call hardcodes `v19.0` in the URL. Graph API versions are deprecated ~2 years after release; v19.0 was released early 2024.
- Files: `src/app/api/lead/route.js` line 59
- Impact: When Meta deprecates v19.0, the lead API will stop sending conversion events silently (the code catches errors but does not alert).
- Fix approach: Move the version to a named constant or environment variable so it can be updated without hunting through code.

**`Configuracoes` Navigation Link Points to Non-Existent Page:**
- Issue: The sidebar nav includes a "Configurações" item linking to `/dashboard/configuracoes`, but no corresponding page exists at `src/app/dashboard/(app)/configuracoes/page.js`.
- Files: `src/app/dashboard/(app)/layout.js` line 18
- Impact: Clicking "Configurações" results in a Next.js 404 for the admin user.
- Fix approach: Either create the page or remove the nav item until the feature is built.

**Meta Ads Status Badge Shows "Demo" Permanently:**
- Issue: The sidebar contains a hardcoded amber badge reading "Meta Ads: Demo". It appears to be a placeholder that was never wired to real status.
- Files: `src/app/dashboard/(app)/layout.js` lines 94–100
- Impact: The badge is misleading — it implies the ads integration is in demo mode even when live.
- Fix approach: Remove the badge or replace with a real integration status check.

**User Identity Hardcoded in Sidebar:**
- Issue: The sidebar user avatar and name are hardcoded as "G" and "Gabriel Q." — there is no concept of multiple users or dynamic identity.
- Files: `src/app/dashboard/(app)/layout.js` lines 102–109
- Impact: Low immediate impact. Becomes a problem if a second admin user is ever added.
- Fix approach: If single-user forever, acceptable. Otherwise, store user info in the session/auth token.

---

## Performance Bottlenecks

**N+1 Subqueries on Every Contact List Fetch:**
- Problem: `GET /api/dashboard/contatos` runs two correlated subqueries per row to count messages and orders.
- Files: `src/app/api/dashboard/contatos/route.js` lines 37–46
- Cause: Subquery `SELECT count(*) FROM n8n_chat_histories WHERE session_id = c.session_id` executes for every contact row returned. With many contacts, this is O(n) database round trips effectively.
- Improvement path: Use `LEFT JOIN ... GROUP BY` with aggregates instead of correlated subqueries. Add indexes on `n8n_chat_histories(session_id)` and `crm_orders(contact_id)` if not already present.

**Stats Query Parses Chat History Content with Regex:**
- Problem: `GET /api/dashboard/stats` extracts timestamps from chat message JSONB content using a PostgreSQL regex to compute daily conversation counts. This is expensive and fragile.
- Files: `src/app/api/dashboard/stats/route.js` lines 34–57
- Cause: Timestamps are not stored as proper columns — they are embedded in message content text and extracted at query time with `substring(message->>'content' from '...')`.
- Improvement path: Add a `created_at` timestamp column to `n8n_chat_histories` populated on insert, then query against that column directly.

**Pedidos Page Fetches Up to 200 Orders at Once:**
- Problem: The Kanban board fetches all orders with `limit=200` on every 30-second refresh cycle.
- Files: `src/app/dashboard/(app)/pedidos/page.js` line 50
- Cause: No server-side filtering by active status — all orders including `concluido` and `cancelado` are loaded into memory and filtered client-side.
- Improvement path: Filter by active statuses server-side, or implement proper pagination per column. Exclude `concluido`/`cancelado` from the default fetch.

---

## Fragile Areas

**Webhook Accepts First Array Element Only:**
- Files: `src/app/api/webhook/novo-pedido/route.js` line 21
- Why fragile: `Array.isArray(raw) ? raw[0] : raw` silently discards any additional items if n8n sends multiple records in a batch.
- Safe modification: Log a warning if `raw.length > 1`. If batch creation is needed, iterate and create all records.
- Test coverage: None.

**Date Handling Uses String Casting Instead of Proper Types:**
- Files: `src/app/api/dashboard/hoje/route.js` line 17, `src/app/api/dashboard/calendario/route.js` line 25
- Why fragile: `scheduled_date::text = $1` — comparing a `DATE` column cast to text against a string. Works when both sides format consistently but breaks under locale or timezone changes. The server's `new Date().toISOString().split('T')[0]` produces UTC dates; if the VPS timezone ever changes, "today's" orders will be off.
- Safe modification: Use `scheduled_date = $1::date` with explicit UTC date strings, and configure `timezone = 'America/Sao_Paulo'` in the PostgreSQL session or connection string.

**`updateOrder` in Hoje Page Swallows API Errors Silently:**
- Files: `src/app/dashboard/(app)/page.js` lines 40–51
- Why fragile: Errors from PATCH calls are only logged to console. The UI provides no feedback when an order update fails — the user sees no error and the auto-refresh may show stale data.
- Safe modification: Add `try/catch` with a visible error state (toast or inline message) when `fetch` fails or returns a non-2xx status.

**`relatorios/route.js` Applies Date Filter With String Replace:**
- Files: `src/app/api/dashboard/relatorios/route.js` lines 59, 92, 103
- Why fragile: `dateFilter.replace(/AND o\./g, '')` and `dateFilter.replace(/o\./g, '')` manipulate the filter string to adjust table aliases. If the filter format ever changes, the replace silently produces malformed SQL.
- Safe modification: Build separate filter strings per query context rather than mutating a shared string.

---

## Missing Critical Features

**No Server-Side API Route Authentication:**
- Problem: All `/api/dashboard/*` endpoints return sensitive business data (customer names, phone numbers, revenue) with no server-side auth check.
- Blocks: Safe multi-user access, any future mobile app or external integration.

**No Error Feedback on Failed Mutations:**
- Problem: When order updates, contact edits, or new pedido creation fail, the UI provides no visible feedback to the user.
- Files: `src/app/dashboard/(app)/page.js`, `src/app/dashboard/(app)/pedidos/page.js`, `src/app/dashboard/(app)/contatos/page.js`
- Blocks: Reliable data entry by non-technical users.

**No Audit Log:**
- Problem: There is no record of who changed what or when (e.g., status transitions, payment updates, diarista assignments). The only timestamps are `created_at`/`updated_at` on rows.
- Blocks: Accountability, dispute resolution, operational debugging.

---

## Test Coverage Gaps

**All API Routes Untested:**
- What's not tested: Order creation, contact update logic, webhook payload parsing, SQL query correctness.
- Files: `src/app/api/**`
- Risk: Breaking changes in DB schema or query logic go undetected until production.
- Priority: High

**Authentication Logic Untested:**
- What's not tested: Credential comparison, localStorage flag behavior, redirect logic.
- Files: `src/app/dashboard/login/page.js`, `src/app/dashboard/(app)/layout.js`
- Risk: A regression could lock out the admin or open the dashboard to unauthenticated access.
- Priority: High

**Webhook Integration Untested:**
- What's not tested: Array vs object body handling, contact creation when not found, order creation idempotency.
- Files: `src/app/api/webhook/novo-pedido/route.js`, `src/app/api/webhook/consultar-contato/route.js`
- Risk: n8n format changes silently break the integration.
- Priority: Medium

---

*Concerns audit: 2026-03-16*
