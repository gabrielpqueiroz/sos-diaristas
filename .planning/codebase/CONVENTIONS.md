# Coding Conventions

**Analysis Date:** 2026-03-16

## Language

- JavaScript only — no TypeScript anywhere in the project
- No type annotations, no `.ts`/`.tsx` files
- JSDoc comments are not used

## Naming Patterns

**Files:**
- All source files use `.js` extension
- Page files: always named `page.js` inside the route folder (e.g., `src/app/dashboard/(app)/pedidos/page.js`)
- API routes: always named `route.js` inside the route folder (e.g., `src/app/api/dashboard/pedidos/route.js`)
- Shared components: kebab-case filenames (e.g., `icons.js`, `styles.js`)
- Library files: short descriptive name (e.g., `src/lib/db.js`)

**Functions:**
- React components: PascalCase (e.g., `HojePage`, `AppLayout`, `PedidosPage`)
- Regular functions: camelCase (e.g., `formatPhone`, `formatDate`, `loadData`, `updateOrder`)
- Event handlers: camelCase prefixed with `handle` (e.g., `handleLogout`)
- Data loader functions: `loadData` convention used across all pages

**Variables:**
- camelCase for all variables
- Boolean states: plain descriptive names (e.g., `loading`, `saving`, `authed`)
- ID states for tracking active items: `updatingId`, `editSaving`, `draggedOrderId`
- Timer refs: `timerRef`, `refreshTimerRef`

**Constants:**
- SCREAMING_SNAKE_CASE for shared design tokens exported from `src/app/dashboard/_components/styles.js`:
  - `GLASS`, `GLASS_HOVER`, `BG_GRADIENT`, `STATUS_COLORS`, `STATUS_LABELS`
- SCREAMING_SNAKE_CASE for config arrays local to a page (e.g., `ORDER_COLUMNS`, `HOURS_PRICING`, `STATUS_CONFIG`)

**Database fields:**
- snake_case for all DB columns, matching PostgreSQL naming (e.g., `contact_id`, `session_id`, `scheduled_date`, `payment_status`)
- API responses preserve DB field names — no camelCase transformation on the server

## Code Style

**Formatting:**
- No Prettier or ESLint config detected — no automated formatting enforced
- Indentation: 2 spaces consistently throughout
- Single quotes for strings in JS
- No trailing semicolons in some files; inconsistent — follow the existing file style

**Linting:**
- No ESLint config present
- No Biome config present
- No pre-commit hooks detected

## Import Organization

**Order observed in page files:**
1. React hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
2. Next.js navigation (`useRouter`, `usePathname`, `next/navigation`)
3. Next.js components (`Image`, `Link` from `next/image`, `next/link`)
4. Internal shared components (`@/` alias for `src/`)
5. Local constants defined in the same file

**Path Aliases:**
- `@/*` maps to `./src/*` — defined in `jsconfig.json`
- Usage: `import { query } from '@/lib/db'`, `import { GLASS } from '../_components/styles'`
- API routes use `@/lib/db`; page components use relative paths for `_components`

**API route imports:**
```js
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
```

**Page component imports:**
```js
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GLASS } from '../_components/styles'
import { SomeIcon } from '../_components/icons'
```

## Error Handling

**API routes — standard pattern:**
```js
export async function GET(request) {
  try {
    // ... logic
    return NextResponse.json({ data: result.rows })
  } catch (error) {
    console.error('Error description:', error)
    return NextResponse.json({ error: 'Mensagem em português' }, { status: 500 })
  }
}
```

**Webhook routes — include `detail` in error response:**
```js
} catch (error) {
  console.error('Webhook novo-pedido error:', error.message, error.stack)
  return NextResponse.json({ error: 'Erro ao criar pedido', detail: error.message }, { status: 500 })
}
```

**404 pattern:**
```js
if (result.rows.length === 0) {
  return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
}
```

**400 validation pattern:**
```js
if (!requiredField) {
  return NextResponse.json({ error: 'Campo obrigatório' }, { status: 400 })
}
```

**Client-side error handling:**
```js
try {
  const res = await fetch('/api/dashboard/...')
  const json = await res.json()
  setData(json)
} catch (e) { console.error(e) }
```
- Client errors are swallowed with `console.error` — no user-facing error messages shown

## Logging

**API routes:**
- `console.error('Error description:', error)` in every catch block
- Webhook routes: `console.error('description:', error.message, error.stack)` for more detail

**Client components:**
- `console.error(e)` in catch blocks — minimal, no structured logging

## Data Fetching Pattern

**All dashboard pages use the same pattern:**
```js
const loadData = useCallback(async (silent = false) => {
  if (!silent) setLoading(true)
  try {
    const res = await fetch('/api/dashboard/...')
    const json = await res.json()
    setState(json)
  } catch (e) { console.error(e) }
  if (!silent) setLoading(false)
}, [])

useEffect(() => {
  loadData()
  timerRef.current = setInterval(() => loadData(true), INTERVAL_MS)
  return () => clearInterval(timerRef.current)
}, [loadData])
```

- `silent = true` skips the loading spinner for background refreshes
- Auto-refresh intervals: 20000ms (Hoje page), 30000ms (Pedidos page)
- `useRef` stores the timer so cleanup works correctly

## SQL Conventions

- Always parameterized queries: `$1, $2, $3...` — never string interpolation
- Dynamic `WHERE` clauses built with `WHERE 1=1` + conditional `AND` appends
- `COALESCE` used for optional fields in INSERT/UPDATE
- Dynamic index variable `idx` or `paramIdx` for building param arrays
- `RETURNING *` after INSERT/UPDATE to get the created/updated record
- Subqueries for derived fields (e.g., `total_orders`, `total_revenue`) recalculated on write

## UI Conventions

**Glassmorphism cards:**
- Always use `GLASS` constant from `styles.js` as the `style` prop — never hardcode glass values
- `style={GLASS}` for cards, `style={{ ...GLASS, ... }}` for overrides

**Loading state:**
```jsx
if (loading || !data) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-10 h-10 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}
```

**Empty state:**
```jsx
<div className="rounded-2xl p-12 text-center" style={GLASS}>
  <p className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
    Mensagem descritiva em português.
  </p>
</div>
```

**Color application:**
- Always use inline `style` for colors, not Tailwind color classes
- RGBA values for transparency: `rgba(255,255,255,0.4)` for muted text
- Named hex for emphasis colors: `#60a5fa`, `#34d399`, `#fbbf24`

**Text sizing:**
- Minimum `text-sm` — no `text-xs` for primary content (accessibility for primary user)
- KPI values: `text-2xl font-bold`
- Section headings: `text-base font-bold` or `text-2xl font-bold`
- Muted labels: `text-sm` with `rgba(255,255,255,0.4)`

**Buttons:**
- All text descriptive in Portuguese — no icon-only buttons for primary actions
- Rounded: `rounded-xl` (standard), `rounded-2xl` (cards)
- Padding: `px-4 py-2` minimum for clickable targets

## Module Design

**Exports:**
- Pages: `export default function PageName()`
- API routes: named exports per HTTP method (`export async function GET`, `export async function POST`, etc.)
- Shared constants: named exports from `styles.js` and `icons.js`
- DB: named export `export async function query(text, params)`

**No barrel files** — imports are direct to the file.

## Webhook Handling

**n8n body normalization — always applied at webhook entry:**
```js
const raw = await request.json()
const body = Array.isArray(raw) ? raw[0] : raw
```

---

*Convention analysis: 2026-03-16*
