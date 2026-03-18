# Phase 2: Geocoding Infrastructure — Research

**Researched:** 2026-03-18
**Domain:** Nominatim (OpenStreetMap) geocoding + PostgreSQL schema migration + react-leaflet Marker rendering
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Endereços dos pedidos são geocodificados via Nominatim e coordenadas lat/lng salvas no banco (cache) | Nominatim API verified; response structure confirmed; DB migration pattern defined |
| INFRA-02 | Pedidos existentes são geocodificados via script de backfill (respeitando rate limit de 1 req/s) | Rate limiter pattern tested (1002ms gap verified); backfill script architecture documented |
| INFRA-03 | Endereços não encontrados pelo geocoding são tratados graciosamente (contagem exibida, mapa não quebra) | API endpoint returns `geocoded_count` + `failed_count`; empty array check prevents map crash |
| MAPA-03 | Usuário pode ver pins nos endereços dos pedidos geocodificados | react-leaflet v4 `<Marker>` props verified; MapComponent extension pattern documented |
</phase_requirements>

---

## Summary

Phase 2 has three distinct sub-problems: (1) a PostgreSQL schema migration adding three nullable columns to `crm_orders`, (2) a local Node.js backfill script that hits Nominatim at 1 req/s and persists coordinates, and (3) a new API route + MapComponent update that renders real pins from cached coordinates.

Nominatim coverage for Foz do Iguacu is verified as good. Live tests on 2026-03-18 returned coordinates for Rua Xavier da Silva, Rua Almirante Barroso, Av das Cataratas, and Rua Jorge Sanwais. The structured query approach (`street=` + `city=Foz+do+Iguacu` + `countrycodes=br`) returns identical results to free-form queries — either strategy works. A small fraction of addresses will not match (OSM data gaps, typos in the source data); this is expected and must not break the map.

The rate limiter does not need a third-party library. A minimal implementation using `Date.now()` and `setTimeout` tested successfully in Node 24 with 1001–1002ms between requests. No npm package is needed for this. The backfill script runs locally (not on Vercel) and directly imports the `pg` pool from `src/lib/db.js` — this is the correct pattern given the project has no ORM and no migration runner.

**Primary recommendation:** Use the structured Nominatim query with `street` + `city=Foz do Iguacu` + `countrycodes=br` parameters, a hand-rolled 1-req/s throttle using `setTimeout`, three nullable columns on `crm_orders` (`lat NUMERIC`, `lng NUMERIC`, `geocoded_at TIMESTAMPTZ`), and react-leaflet `<Marker>` components rendered from the API response in `MapComponent.js`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Nominatim (OpenStreetMap) | Public API | Forward geocoding: address → lat/lng | Free, no API key, no billing; project decision locked in STATE.md |
| `pg` (node-postgres) | 8.20.0 (already installed) | DB migration + backfill script | Already in project; same pool pattern as all other routes |
| `react-leaflet` | 4.2.1 (already installed) | `<Marker>` and `<Popup>` components | Already installed; v4 API confirmed compatible with React 18 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node built-in `fetch` | Node 24 (available) | HTTP calls in backfill script | Node 18+ has built-in fetch — no `node-fetch` needed |
| Node built-in `setTimeout` | Node 24 | Rate limiter in backfill script | No external rate-limiter library needed for this use case |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled throttle | `limiter` or `bottleneck` npm packages | For 1 req/s with one script on one machine, a 5-line throttle is sufficient and adds zero dependencies |
| Nominatim public API | Self-hosted Nominatim | Self-hosting requires a VPS with 32GB RAM and OSM planet file import; completely disproportionate for this use case |
| `NUMERIC` for lat/lng | `DOUBLE PRECISION` or `FLOAT8` | Both work; `NUMERIC` avoids floating-point precision surprises in PostgreSQL; either is fine for map coordinates |

### Installation

No new npm packages needed. All required libraries are already installed:
- `pg@8.20.0` — already in package.json
- `react-leaflet@4.2.1` — already installed from Phase 1
- `leaflet@1.9.4` — already installed from Phase 1

**Version verification (2026-03-18):** All packages confirmed via `package.json`. No new installations required for this phase.

---

## Architecture Patterns

### Recommended File Structure for This Phase

```
src/
├── app/
│   ├── api/
│   │   └── dashboard/
│   │       └── mapa/
│   │           └── route.js          # NEW: GET /api/dashboard/mapa
│   └── dashboard/
│       └── (app)/
│           └── mapa/
│               └── page.js            # MODIFY: pass pins data to MapComponent
│       └── _components/
│           └── MapComponent.js        # MODIFY: add <Marker> rendering
├── lib/
│   └── geocode.js                     # NEW: geocodeAddress() function
scripts/
└── geocode-backfill.js                # NEW: one-shot backfill script (run locally)
```

### Pattern 1: DB Migration via Raw SQL (no migration runner)

**What:** Run `ALTER TABLE` directly against the production PostgreSQL via a standalone script. The project has no ORM and no migration runner (no Prisma, no Knex, no Flyway).

**When to use:** Any schema change in this project. The existing pattern is raw SQL via `pg` pool — keep consistency.

**Example:**
```sql
-- Migration SQL to run against crm_orders
ALTER TABLE crm_orders
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC,
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
```

Run this as a script or directly in the DB console on the VPS (31.97.174.85). Using `IF NOT EXISTS` makes it idempotent (safe to re-run).

**Confidence:** HIGH — direct observation of the project; no migration runner exists.

---

### Pattern 2: `src/lib/geocode.js` — Geocoding Library Module

**What:** A pure async function that takes an address string and returns `{ lat, lng }` or `null`. Handles the User-Agent requirement, URL construction, error handling, and empty-result detection.

**Nominatim URL strategy (verified 2026-03-18):**

Two approaches tested and both work for Foz do Iguacu addresses:

1. **Structured query** (recommended): `?street={address}&city=Foz+do+Iguacu&format=json&limit=1&countrycodes=br`
2. **Free-form** (fallback): `?q={address},+Foz+do+Iguacu,+PR,+Brasil&format=json&limit=1&countrycodes=br`

Structured is preferred because `countrycodes=br` is a hard filter (not bias), and specifying `city` separately reduces false positives from other Brazilian cities with the same street name.

**Nominatim User-Agent requirement:** The OSM usage policy requires a valid `User-Agent` header identifying the application. A generic `fetch` default will eventually be rate-limited or banned. Always set it explicitly.

**Example:**
```javascript
// src/lib/geocode.js
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'sos-diaristas/1.0 (sistemasos.queirozautomacoes.com.br)'

/**
 * Geocode an address in Foz do Iguacu, Brazil.
 * Returns { lat: number, lng: number } or null if not found.
 * Does NOT rate-limit — caller is responsible for spacing requests.
 */
export async function geocodeAddress(address) {
  if (!address || address.trim().length < 3) return null

  const normalized = normalizeAddress(address)

  const params = new URLSearchParams({
    street: normalized,
    city: 'Foz do Iguacu',
    format: 'json',
    limit: '1',
    countrycodes: 'br',
  })

  const url = `${NOMINATIM_BASE}?${params.toString()}`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) return null

    const results = await response.json()

    if (!results || results.length === 0) return null

    const { lat, lon } = results[0]
    return { lat: parseFloat(lat), lng: parseFloat(lon) }
  } catch {
    return null
  }
}

/**
 * Normalize Brazilian address strings before geocoding.
 * Common patterns observed in crm_orders.address for Foz do Iguacu.
 */
function normalizeAddress(address) {
  return address
    .trim()
    // Remove complement info after comma (e.g., "Rua X 123, apto 2, bairro")
    // Keep only "Rua X 123" — structured query handles city separately
    .split(',')[0]
    .trim()
}
```

**Confidence:** HIGH — Nominatim API tested live; User-Agent requirement confirmed from official policy; response structure `{ lat, lon }` verified.

**Key detail:** Nominatim returns `lon` (not `lng`). The code must map `lon` → `lng` when persisting to PostgreSQL to stay consistent with the DB column name.

---

### Pattern 3: `scripts/geocode-backfill.js` — One-Shot Backfill

**What:** A standalone Node.js script that runs locally with `node scripts/geocode-backfill.js`. It reads all `crm_orders` rows where `lat IS NULL AND address IS NOT NULL`, geocodes each one at 1 req/s, and writes `lat`, `lng`, `geocoded_at` back to the row.

**Rate limiter:** A minimal hand-rolled throttle. No npm package needed.

```javascript
// Rate limiter — enforces at least 1000ms between requests
function createThrottle(minGapMs = 1000) {
  let lastAt = 0
  return async function throttle() {
    const now = Date.now()
    const wait = minGapMs - (now - lastAt)
    if (wait > 0) await new Promise(r => setTimeout(r, wait))
    lastAt = Date.now()
  }
}
```

**Tested behavior (2026-03-18):** Verified 1001–1002ms gaps between requests using this pattern in Node 24.

**Script structure:**
```javascript
// scripts/geocode-backfill.js
// Run: node scripts/geocode-backfill.js
// Requires: DATABASE_URL in .env.local (or set in shell env)

import 'dotenv/config'   // or: process.loadEnvFile('.env.local') in Node 20.12+
import pg from 'pg'
import { geocodeAddress } from '../src/lib/geocode.js'

// ... fetch orders WHERE lat IS NULL AND address IS NOT NULL
// ... for each: throttle(), geocode, UPDATE crm_orders SET lat=$1, lng=$2, geocoded_at=now() WHERE id=$3
// ... log progress: "X/Y geocoded, Z failed (address not found)"
```

**dotenv note:** The project uses `.env.local` (Next.js convention), not `.env`. The backfill script runs outside Next.js, so it needs to load env vars manually. Two options:
- `import 'dotenv/config'` with `dotenv` package (need `npm install --save-dev dotenv`)
- `process.loadEnvFile('.env.local')` — available in Node 20.12+ (project uses Node 24, so this works without any package)

Use `process.loadEnvFile('.env.local')` to avoid adding a dev dependency.

**Confidence:** HIGH — `process.loadEnvFile` available since Node 20.12; project is on Node 24 (confirmed).

---

### Pattern 4: `GET /api/dashboard/mapa` — Map Data API Route

**What:** Returns geocoded order coordinates for the map page. Follows the existing API route pattern (`NextResponse.json`, `query` from `@/lib/db`, error returns `{ error, detail }`).

**Query:** Only return orders with coordinates (`lat IS NOT NULL`), filtered to `concluido` and `agendado` statuses (the only ones meaningful for geographic display). Include a count of orders without coordinates for INFRA-03.

**Response shape:**
```json
{
  "pins": [
    { "id": "uuid", "lat": -25.54, "lng": -54.58, "status": "concluido", "address": "..." }
  ],
  "total_with_coords": 42,
  "total_without_coords": 8
}
```

**Example:**
```javascript
// src/app/api/dashboard/mapa/route.js
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const pins = await query(`
      SELECT id, lat, lng, status, address, scheduled_date
      FROM crm_orders
      WHERE lat IS NOT NULL
        AND status IN ('concluido', 'agendado', 'confirmado', 'diarista_atribuida', 'em_andamento')
      ORDER BY scheduled_date DESC
    `)

    const counts = await query(`
      SELECT
        count(*) FILTER (WHERE lat IS NOT NULL) as with_coords,
        count(*) FILTER (WHERE lat IS NULL AND address IS NOT NULL) as without_coords
      FROM crm_orders
    `)

    return NextResponse.json({
      pins: pins.rows,
      total_with_coords: parseInt(counts.rows[0].with_coords),
      total_without_coords: parseInt(counts.rows[0].without_coords),
    })
  } catch (error) {
    console.error('Error fetching mapa data:', error.message, error.stack)
    return NextResponse.json({ error: 'Erro ao buscar dados do mapa', detail: error.message }, { status: 500 })
  }
}
```

**Confidence:** HIGH — exact pattern from existing routes (relatorios, hoje, pedidos).

---

### Pattern 5: MapComponent Update — Rendering Pins

**What:** `MapComponent.js` receives `pins` as a prop (array of `{ lat, lng, ... }`), renders a `<Marker>` for each pin inside the `<MapContainer>`. The icon fix from Phase 1 is already in place.

**react-leaflet v4 Marker API (verified):**
- `position` prop: `LatLngExpression` = `[lat, lng]` array — required
- `<Popup>` as child: optional, renders on marker click

**Example:**
```javascript
// src/app/dashboard/_components/MapComponent.js (modified)
'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const FOZ_CENTER = [-25.5163, -54.5854]
const DEFAULT_ZOOM = 13

export default function MapComponent({ pins = [] }) {
  return (
    <MapContainer
      center={FOZ_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />
      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]}>
          <Popup>{pin.address || 'Endereço não disponível'}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

**page.js update:** The mapa page fetches `/api/dashboard/mapa` with `useEffect`, passes `pins` to `MapComponent` via the dynamic import. The `total_without_coords` count is displayed as a note below the map (INFRA-03).

**Confidence:** HIGH — react-leaflet v4 `<Marker>` API verified from official docs; `key={pin.id}` is correct for list rendering (uses DB UUID).

---

### Anti-Patterns to Avoid

- **Geocoding at request time (no cache):** Never call Nominatim on every API request. The cache in the DB (`lat IS NOT NULL`) is the entire point of this phase — always check the cache first.
- **Calling Nominatim from a Vercel serverless function:** Nominatim rate limit is 1 req/s. Vercel functions can run concurrently — this will immediately violate the rate limit and trigger banning. All Nominatim calls happen only in the local backfill script.
- **`geocoded_at = null` meaning "failed geocoding":** `geocoded_at IS NULL` means "not yet attempted" OR "no address on this order". Don't use a second column for failed status — the absence of `lat` is sufficient to identify failed/skipped rows. The backfill script logs failures but does not mark them in the DB beyond leaving `lat` as NULL.
- **Re-running backfill without a WHERE filter:** Always filter `WHERE lat IS NULL AND address IS NOT NULL` so already-geocoded rows are never re-processed.
- **Rendering `<Marker>` with null position:** If any `pin.lat` is null (defensive case), Leaflet will throw. Always filter `pins.filter(p => p.lat && p.lng)` before rendering, or ensure the API query only returns rows where `lat IS NOT NULL`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Forward geocoding | Custom geocoder | Nominatim (OpenStreetMap) | Free, no key, well-maintained, sufficient coverage for Foz do Iguacu (verified) |
| DB migrations | Custom migration runner | Raw SQL `ALTER TABLE ... IF NOT EXISTS` | Project has no ORM; adding a migration library for 3 columns is overkill |
| Rate limiter for 1 req/s | npm package (`limiter`, `bottleneck`) | 5-line `setTimeout`-based throttle | Single-process backfill script; no concurrency; no library adds value here |
| HTTP client for geocoding | `axios`, `node-fetch` | Node 24 built-in `fetch` | Node 24 has stable built-in `fetch`; no package needed |
| Env var loading in script | `dotenv` npm package | `process.loadEnvFile('.env.local')` | Available since Node 20.12; project is on Node 24; no package needed |

**Key insight:** This phase adds zero new npm packages. Every tool needed is either already installed or built into Node 24.

---

## Common Pitfalls

### Pitfall 1: Nominatim Returns `lon` Not `lng`

**What goes wrong:** The Nominatim JSON response uses `lon` as the key name. If the code does `const { lat, lng } = results[0]`, `lng` will be `undefined` and `null` will be written to the DB.

**Why it happens:** OpenStreetMap/Nominatim uses `lon` (following ISO 6709 convention), while most mapping libraries use `lng`.

**How to avoid:** Explicitly destructure: `const { lat, lon } = results[0]` and then store as `lng: parseFloat(lon)`.

**Warning signs:** All rows have `lat` populated but `lng` is NULL after backfill.

---

### Pitfall 2: Nominatim Banning from Missing/Generic User-Agent

**What goes wrong:** Requests start returning `403` or `Usage limit reached` errors mid-backfill.

**Why it happens:** The OSM usage policy explicitly requires a valid User-Agent identifying the application. Generic defaults (like Node.js's built-in fetch default `node`) trigger rate-limiting faster.

**How to avoid:** Always include `headers: { 'User-Agent': 'sos-diaristas/1.0 (sistemasos.queirozautomacoes.com.br)' }` in every Nominatim request. The contact URL/email helps OSM identify legitimate traffic.

**Warning signs:** `403` or HTML error responses mid-backfill.

---

### Pitfall 3: `process.loadEnvFile` Reads `.env.local`, Not `.env`

**What goes wrong:** Backfill script connects with undefined `DATABASE_URL` and throws `missing required parameter 'connectionString'`.

**Why it happens:** Next.js convention is `.env.local` but many tools default to `.env`.

**How to avoid:** Call `process.loadEnvFile('.env.local')` (not `.env`) at the top of the backfill script, before importing anything that uses `process.env.DATABASE_URL`.

**Warning signs:** `pg` connection error at script start; `process.env.DATABASE_URL` is `undefined`.

---

### Pitfall 4: Address Normalization Issues

**What goes wrong:** Nominatim returns no results for valid addresses because the address string contains commas (e.g., `"Rua X 123, apto 2, Vila Y"`).

**Why it happens:** Nominatim's structured `street=` parameter should contain only the street and house number. Apartment/complement info and neighbourhood confuse the geocoder.

**How to avoid:** Strip everything after the first comma before sending the structured query: `address.split(',')[0].trim()`. The `city=Foz do Iguacu` parameter handles the city disambiguation.

**Warning signs:** Addresses with commas return no results while similar addresses without commas succeed.

---

### Pitfall 5: `MapContainer` Remount When `pins` Prop Changes

**What goes wrong:** When the mapa page re-fetches data and passes new `pins`, the `<MapContainer>` may remount, resetting zoom and pan position.

**Why it happens:** If the `key` of the `MapContainer` or any ancestor component changes, React unmounts and remounts the whole tree including the map.

**How to avoid:** Never put `key={pins.length}` or similar dynamic keys on `MapContainer`. The `pins.map()` inside `MapContainer` updates the markers without remounting the container. Keep the `MapContainer` stable; only the `<Marker>` children change.

**Warning signs:** Map resets to `FOZ_CENTER` zoom 13 every time data loads.

---

### Pitfall 6: Low Match Rate for Unusual Address Formats

**What goes wrong:** The backfill reports many addresses as "not found" because `crm_orders.address` contains formats that don't match OSM data (abbreviations, typos, incomplete addresses).

**Why it happens:** OSM data for Brazilian cities outside São Paulo/Rio is community-contributed and varies in completeness. Match rates around 60-80% are expected for a city like Foz do Iguacu.

**How to avoid:** The STATE.md already flags this: "Verificar taxa de match do Nominatim para endereços reais de crm_orders antes de escrever o backfill (testar 5-10 endereços reais). If below ~60%, ajustar normalização." The backfill script must log the final match rate. If it's below 60%, check for common abbreviations in the data (e.g., `Av.` vs `Avenida`, `R.` vs `Rua`) and add them to `normalizeAddress()`.

**Warning signs:** Backfill reports fewer than 60% match rate.

---

## Code Examples

### Nominatim API Response Structure (verified 2026-03-18)

```json
{
  "place_id": 6119048,
  "lat": "-25.5467061",
  "lon": "-54.5482588",
  "display_name": "Rua Edmundo de Barros, Foz do Iguaçu, Paraná, Brasil",
  "boundingbox": ["-25.5467506", "-25.5466556", "-54.5507105", "-54.5458069"]
}
```

Key observations:
- `lat` and `lon` are **strings**, not numbers — must use `parseFloat()`
- `lon` is the longitude key (not `lng`)
- Results array is empty `[]` when address is not found (not null, not error)

### Rate Limiter (tested in Node 24)

```javascript
// Verified to produce 1001-1002ms gaps between invocations
function createThrottle(minGapMs = 1000) {
  let lastAt = 0
  return async function throttle() {
    const now = Date.now()
    const wait = minGapMs - (now - lastAt)
    if (wait > 0) await new Promise(r => setTimeout(r, wait))
    lastAt = Date.now()
  }
}
```

### Nominatim Structured Query (verified for Foz do Iguacu)

```javascript
const params = new URLSearchParams({
  street: normalizedAddress,  // "Rua Xavier da Silva 100" (no neighbourhood/complement)
  city: 'Foz do Iguacu',
  format: 'json',
  limit: '1',
  countrycodes: 'br',         // Hard filter, not bias
})
// Source: https://nominatim.org/release-docs/latest/api/Search/
// Tested: returns -25.5372890,-54.5783868 for "Rua Xavier da Silva 100"
```

### react-leaflet v4 Marker Rendering

```javascript
// Source: https://react-leaflet.js.org/docs/v4/api-components/
import { Marker, Popup } from 'react-leaflet'

{pins.map((pin) => (
  <Marker key={pin.id} position={[pin.lat, pin.lng]}>
    <Popup>{pin.address}</Popup>
  </Marker>
))}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `node-fetch` for HTTP in Node scripts | Node built-in `fetch` | Node 18 (stable in 21+) | No package needed for HTTP calls in Node 20+ |
| `dotenv` package for env loading in scripts | `process.loadEnvFile()` | Node 20.12 | No package needed for loading `.env` files |
| Google Maps Geocoding API | Nominatim (OpenStreetMap) | Project decision | Free, no billing, no API key |

**Deprecated/outdated:**
- `require('node-fetch')`: Unnecessary in Node 18+; project is on Node 24.
- `require('dotenv').config()`: Still works but `process.loadEnvFile('.env.local')` is built-in since Node 20.12.

---

## Open Questions

1. **Address format in real `crm_orders` data**
   - What we know: `crm_orders.address` is a free-text field populated by n8n webhooks. Live tests show Nominatim handles "Rua X 123, Foz do Iguacu" well when the complement/neighbourhood is stripped.
   - What's unclear: The actual distribution of address formats in the production database. The STATE.md blocker item says to test 5-10 real addresses before writing the backfill.
   - Recommendation: Plan 02-01 should include a verification step where the implementer runs a quick query on production to sample 5-10 addresses and manually tests them against Nominatim before writing the normalizer.

2. **Match rate threshold**
   - What we know: Foz do Iguacu has good OSM coverage for main streets (verified). Rural/irregular addresses may fail.
   - What's unclear: Typical match rate for this specific dataset.
   - Recommendation: Log a final summary at the end of the backfill script: "Geocoded: X/Y (Z%). Failed: W addresses." If below 60%, the normalizer needs improvement. This is not a blocker for shipping — INFRA-03 explicitly handles unmatched addresses gracefully.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected in project |
| Config file | None — no test runner installed |
| Quick run command | `npm run build` (build-time SSR verification) |
| Full suite command | `npm run build && npm run dev` (manual smoke test) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | lat/lng columns exist in crm_orders after migration | smoke (SQL) | `psql $DATABASE_URL -c "SELECT lat, lng, geocoded_at FROM crm_orders LIMIT 1"` | ❌ Wave 0 (manual SQL check) |
| INFRA-02 | Backfill script runs without error and updates rows | integration | `node scripts/geocode-backfill.js` — check exit code + DB row count | ❌ Wave 0 |
| INFRA-03 | API returns `total_without_coords` and map page renders when some pins are missing | smoke (manual) | manual-only — visual check of map page with partial data | ❌ Wave 0 |
| MAPA-03 | Pins visible on map at expected lat/lng | smoke (visual) | manual-only — browser inspection | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run build` — verifies no SSR/import errors
- **Per wave merge:** `npm run build` + manual browser check of `/dashboard/mapa` with real pins
- **Phase gate:** SQL verification that geocoded rows exist + visual confirmation of pins on map

### Wave 0 Gaps

- [ ] No test framework installed — project has zero test infrastructure (same as Phase 1)
- [ ] DB migration verification is a manual SQL query, not an automated test
- [ ] Backfill script is the "test" for INFRA-02 — it must log pass/fail counts clearly

*(Automated unit testing is not practical for this phase: geocoding is external HTTP + DB writes, and map rendering is visual. Manual verification against success criteria is the correct gate.)*

---

## Sources

### Primary (HIGH confidence)

- Nominatim live API tested 2026-03-18 — response structure `{ lat, lon }` as strings confirmed; geocoding verified for Foz do Iguacu streets
- `https://nominatim.org/release-docs/latest/api/Search/` — structured query parameters (`street`, `city`, `countrycodes`) confirmed
- `https://operations.osmfoundation.org/policies/nominatim/` — rate limit (1 req/s), User-Agent requirement confirmed
- `https://react-leaflet.js.org/docs/v4/api-components/` — Marker `position` prop type and Popup child component API confirmed
- `package.json` — no new npm packages needed; all required libraries already installed
- `src/lib/db.js` — `query()` function pattern confirmed for API route and backfill script
- Node.js v24.13.1 — built-in `fetch` available; `process.loadEnvFile` available (Node 20.12+)
- Rate limiter tested in Node 24 — 1001-1002ms gaps confirmed

### Secondary (MEDIUM confidence)

- OSM Help forum post on Brazilian address geocoding — confirms match rate ~70% average; complement stripping strategy recommended
- STATE.md blocker note: "Verificar taxa de match do Nominatim para endereços reais de crm_orders antes de escrever o backfill"

### Tertiary (LOW confidence)

- None for this phase — all critical claims verified via live API tests or official documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all already installed; verified
- Nominatim API: HIGH — live-tested on 2026-03-18 with real Foz do Iguacu addresses
- Architecture: HIGH — derived directly from existing project source patterns
- Rate limiter: HIGH — tested in Node 24; gaps 1001-1002ms confirmed
- Address match rate: MEDIUM — general coverage good, specific dataset unknown until backfill runs

**Research date:** 2026-03-18
**Valid until:** 2026-09-18 (Nominatim API is stable; react-leaflet v4 is not moving)
