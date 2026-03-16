# Testing Patterns

**Analysis Date:** 2026-03-16

## Test Framework

**Runner:** None — no test framework is installed or configured.

**Assertion Library:** None

**Test Config:** Not present — no `jest.config.*`, `vitest.config.*`, or similar files exist.

**Run Commands:**
```bash
# No test commands available — package.json has no "test" script
# Only scripts defined: dev, build, start
```

## Test File Organization

**Test files:** None detected in the repository.

No `*.test.js`, `*.spec.js`, or `__tests__` directories exist in `src/`.

## Current State

This codebase has **zero automated tests**. There are no unit tests, integration tests, or end-to-end tests of any kind. There is no testing infrastructure installed.

The `devDependencies` in `package.json` contain only:
- `autoprefixer`
- `postcss`
- `tailwindcss`

No testing library (Jest, Vitest, Playwright, Cypress, Testing Library) is present.

## What Exists Instead of Tests

**Manual verification approach:**
- The application is developed and verified manually via the browser
- API routes are tested via n8n webhook calls in production/staging
- Database operations are verified by observing the dashboard UI

**Error visibility:**
- All API route catch blocks use `console.error` — errors surface in server logs (Vercel)
- Webhook routes include `detail: error.message` in error responses so n8n can report failures

## Risk Areas Without Test Coverage

**API routes** (`src/app/api/dashboard/`):
- All CRUD operations (contacts, orders, diaristas) are untested
- Dynamic SQL building (WHERE clause construction in `contatos/route.js`, `pedidos/route.js`) is fragile without tests

**Webhook routes** (`src/app/api/webhook/`):
- `novo-pedido/route.js` — upsert logic (find-or-create contact) is untested
- Array vs. object body normalization: `Array.isArray(raw) ? raw[0] : raw`

**Client components:**
- All `fetch` + state management logic in page components is untested
- Auto-refresh timer logic in `page.js` and `pedidos/page.js` is untested

**DB utility** (`src/lib/db.js`):
- Pool initialization and connection handling is untested

## Adding Tests (Recommended Approach)

Given the stack (Next.js 14, plain JavaScript, no TypeScript), the recommended setup would be:

**Install:**
```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

**Config file to create:** `vitest.config.js` at project root

**Test file placement:**
- API route tests: co-located as `src/app/api/dashboard/pedidos/route.test.js`
- Utility tests: `src/lib/db.test.js`
- Component tests: `src/app/dashboard/(app)/page.test.js`

**Mocking approach for DB:**
```js
// Mock the query function
vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}))
```

**Priority test targets (highest risk, no coverage):**
1. `src/app/api/webhook/novo-pedido/route.js` — business-critical, called by n8n
2. `src/app/api/dashboard/pedidos/route.js` — dynamic SQL construction
3. `src/app/api/dashboard/contatos/route.js` — search and filter logic
4. `src/lib/db.js` — pool singleton behavior

---

*Testing analysis: 2026-03-16*
