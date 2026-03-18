---
phase: 02-geocoding-infrastructure
plan: 01
subsystem: database
tags: [geocoding, nominatim, postgresql, pg, migration, backfill, node-scripts]

# Dependency graph
requires:
  - phase: 01-map-scaffold
    provides: react-leaflet map scaffold that will consume the geocoded coordinates
provides:
  - scripts/migrate-geocoding-columns.js — idempotent ALTER TABLE adding lat, lng, geocoded_at to crm_orders
  - src/lib/geocode.js — geocodeAddress() function using Nominatim structured query
  - scripts/geocode-backfill.js — one-shot backfill script for historical orders at 1 req/s
affects:
  - 02-geocoding-infrastructure/02-02 — map pins plan depends on lat/lng columns and geocode.js

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "process.loadEnvFile('.env.local') for loading Next.js env vars in standalone Node scripts"
    - "Nominatim structured query: street + city=Foz do Iguacu + countrycodes=br"
    - "Hand-rolled createThrottle(1000ms) using Date.now() + setTimeout — no npm package needed"
    - "lon-to-lng mapping: const { lat, lon } = results[0]; return { lat: parseFloat(lat), lng: parseFloat(lon) }"
    - "Backfill script: WHERE lat IS NULL AND address IS NOT NULL to avoid re-geocoding"

key-files:
  created:
    - scripts/migrate-geocoding-columns.js
    - src/lib/geocode.js
    - scripts/geocode-backfill.js
  modified: []

key-decisions:
  - "No new npm packages — Node 24 built-in fetch + process.loadEnvFile + existing pg cover all needs"
  - "NUMERIC type for lat/lng columns (avoids floating-point precision surprises vs DOUBLE PRECISION)"
  - "geocodeAddress() does NOT rate-limit — caller is responsible (backfill uses createThrottle)"
  - "address normalization strips content after first comma: split(',')[0].trim() — complement confuses Nominatim structured query"
  - "Build errors (useContext + dynamic server usage) are pre-existing from Phase 1 Leaflet setup — not introduced by this plan"

patterns-established:
  - "Pattern: standalone Node scripts use process.loadEnvFile('.env.local') (not dotenv package)"
  - "Pattern: Nominatim lon key must be mapped explicitly to lng to match DB column name"
  - "Pattern: backfill scripts process WHERE lat IS NULL AND address IS NOT NULL for idempotency"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: 10min
completed: 2026-03-18
---

# Phase 2 Plan 01: Geocoding Infrastructure Summary

**Nominatim geocoding layer with DB migration (lat/lng/geocoded_at columns), geocodeAddress() library, and 1 req/s backfill script for historical crm_orders — zero new npm packages**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-18T17:06:59Z
- **Completed:** 2026-03-18T17:08:49Z
- **Tasks:** 2
- **Files modified:** 3 created

## Accomplishments

- DB migration script adds lat, lng, geocoded_at columns to crm_orders idempotently (IF NOT EXISTS)
- geocodeAddress() function uses Nominatim structured query with proper User-Agent, address normalization (comma-stripping), and correct lon-to-lng mapping
- Backfill script processes ungeocoded orders at 1 req/s with per-order progress logging, final match rate summary, and --dry-run support

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DB migration script and geocode.js library** - `3541a73` (feat)
2. **Task 2: Create backfill script with rate limiter and progress logging** - `d1bdeb5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `scripts/migrate-geocoding-columns.js` — Standalone Node script: idempotent ALTER TABLE adding lat NUMERIC, lng NUMERIC, geocoded_at TIMESTAMPTZ to crm_orders
- `src/lib/geocode.js` — Exports geocodeAddress(address) calling Nominatim with structured query, address normalization, User-Agent header, and lon→lng mapping
- `scripts/geocode-backfill.js` — One-shot backfill runner: SELECT WHERE lat IS NULL, throttle 1 req/s, UPDATE lat/lng/geocoded_at, --dry-run support, progress + summary logging

## Decisions Made

- No new npm packages added — Node 24 built-in `fetch` handles HTTP, `process.loadEnvFile` handles env loading, existing `pg` handles DB. Zero dependency footprint for three scripts.
- `NUMERIC` chosen for lat/lng column type (avoids PostgreSQL DOUBLE PRECISION floating-point precision edge cases)
- `geocodeAddress()` is rate-limit-free by design — the backfill script controls timing, and future API routes should never call Nominatim directly (use cached DB values)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

`npm run build` exits with errors, but all errors are pre-existing from Phase 1 (Leaflet `useContext` SSR issue and `request.url` dynamic server usage in existing API routes). Confirmed by running build against the commit before any changes — same errors present. The new files (scripts/, src/lib/geocode.js) are not imported by any Next.js page and introduce no new build failures.

## User Setup Required

Before running the backfill, two manual steps are required:

1. **Run the DB migration** (adds the 3 columns):
   ```bash
   node scripts/migrate-geocoding-columns.js
   ```

2. **Run the backfill** (geocodes historical orders at 1 req/s):
   ```bash
   # Dry run first to verify without DB writes:
   node scripts/geocode-backfill.js --dry-run
   # Then for real:
   node scripts/geocode-backfill.js
   ```

Both scripts require DATABASE_URL in `.env.local`.

## Next Phase Readiness

- crm_orders schema is ready for geocoding (after migration runs)
- geocodeAddress() library is ready for import by future routes (Plan 02-02 API route)
- Backfill script ready for historical data population
- Pre-existing build issues (Leaflet SSR) are blockers for `npm run build` but do not affect runtime behavior

---
*Phase: 02-geocoding-infrastructure*
*Completed: 2026-03-18*
