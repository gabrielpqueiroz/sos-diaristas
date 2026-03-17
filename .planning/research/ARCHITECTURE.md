# Architecture Patterns: Geocoding + Map + Heatmap

**Domain:** Geolocation heatmap added to existing Next.js 14 CRM dashboard
**Researched:** 2026-03-17
**Confidence:** MEDIUM — Leaflet/react-leaflet patterns confirmed via training knowledge; Next.js 14 App Router SSR limitations for Leaflet are well-documented. WebSearch and Context7 unavailable in this session; flag for validation before implementation.

---

## Recommended Architecture

The feature fits cleanly into the existing monolithic pattern: a new dashboard page (`/dashboard/mapa`) with its own API route (`/api/dashboard/mapa`) backed by PostgreSQL geocoding cache. No new infrastructure is required.

```
Browser (Client Component)
  └── MapaPage ('use client')
        ├── Filter bar (period selector)
        ├── MapContainer (react-leaflet, dynamic import, ssr: false)
        │     ├── TileLayer (OpenStreetMap tiles)
        │     ├── MarkerLayer (individual order pins)
        │     └── HeatmapLayer (leaflet.heat plugin)
        └── Summary panel (total pins, unique neighborhoods)

Next.js API Route
  └── GET /api/dashboard/mapa?period=30
        ├── Query crm_orders JOIN crm_contacts (filter by period + status)
        ├── For each order: check lat/lng cache in crm_orders
        │     ├── Cache hit → return stored coordinates
        │     └── Cache miss → call Nominatim → store lat/lng → return
        └── Return [{address, lat, lng, status, diarista, value}]

PostgreSQL
  └── crm_orders table (add lat/lng FLOAT columns)

External
  └── Nominatim API (api.openstreetmap.org/search)
        └── Rate limited: 1 req/s, called only on cache miss
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `src/app/dashboard/(app)/mapa/page.js` | Page shell, filter state, data fetch, renders map container | `/api/dashboard/mapa`, MapComponent |
| `src/app/dashboard/_components/MapComponent.js` | Leaflet map wrapper (dynamic import, ssr: false) | Receives props from MapaPage |
| `src/app/api/dashboard/mapa/route.js` | Fetches orders, triggers geocoding, returns lat/lng array | `src/lib/db.js`, `src/lib/geocode.js` |
| `src/lib/geocode.js` | Wraps Nominatim HTTP call, enforces 1 req/s rate limit | Nominatim API (external) |
| `crm_orders.lat`, `crm_orders.lng` | Persistent geocoding cache | Written by `geocode.js` via `mapa/route.js` |

**Boundary rules:**
- `MapComponent.js` must be a separate file so the page can `dynamic(() => import('./MapComponent'), { ssr: false })`. Leaflet accesses `window` at import time and crashes under Next.js SSR if not isolated this way.
- `geocode.js` is server-only. It must never be imported in a client component (no `'use client'` tag, no `NEXT_PUBLIC_` env access).
- The API route handles geocoding synchronously per request for simplicity. For large backfills, a separate one-time migration script is preferable to blocking the HTTP request.

---

## Data Flow

### Read path (page load)

```
1. User opens /dashboard/mapa (period defaults to "30 days")
2. MapaPage mounts → useEffect fires GET /api/dashboard/mapa?period=30
3. API route: SELECT from crm_orders JOIN crm_contacts WHERE period filter AND status IN ('agendado','confirmado','diarista_atribuida','em_andamento','concluido')
4. For each row:
   a. lat IS NOT NULL → skip geocoding, use cached value
   b. lat IS NULL → call Nominatim with address + "Foz do Iguaçu, PR, Brasil"
      → parse lat/lng from response
      → UPDATE crm_orders SET lat=?, lng=? WHERE id=?
      → use returned coordinates
   c. Nominatim returns no result → skip row (null coordinates excluded from map)
5. API returns [{id, address, lat, lng, status, diarista_name, value}]
6. MapaPage sets state, passes points array to MapComponent
7. MapComponent renders TileLayer + MarkerLayer + HeatmapLayer
```

### Filter change path

```
1. User selects different period (7/30/90 days)
2. MapaPage updates period state
3. useEffect dependency on period triggers new fetch
4. New results replace state → map re-renders with new data
5. Already-geocoded coordinates are cache hits — response is fast
```

### Write path (geocoding cache)

```
Nominatim call (inside API route, server-side only):
  address string → GET https://nominatim.openstreetmap.org/search
                      ?q={address}, Foz do Iguaçu, PR, Brasil
                      &format=json&limit=1
                      &addressdetails=0
  Response [{lat, lon, ...}] → extract lat/lon as floats
  UPDATE crm_orders SET lat=$1, lng=$2 WHERE id=$3
```

---

## Patterns to Follow

### Pattern 1: Dynamic Import with ssr: false (CRITICAL)

Leaflet and react-leaflet require DOM globals (`window`, `document`, `L`). Next.js App Router renders pages on the server by default. Importing Leaflet during SSR throws `window is not defined`.

**What:**
```javascript
// src/app/dashboard/(app)/mapa/page.js
'use client'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(
  () => import('@/app/dashboard/_components/MapComponent'),
  {
    ssr: false,
    loading: () => <div style={GLASS}>Carregando mapa...</div>
  }
)
```

**Why:** `ssr: false` defers the import to the browser bundle only. The `loading` fallback maintains layout stability while the map JS chunk loads. Without this, the build will fail or throw hydration errors at runtime.

**Confidence:** HIGH — this is the canonical, universally-documented pattern for Leaflet + Next.js.

---

### Pattern 2: Geocoding Cache in crm_orders

**What:** Add `lat FLOAT` and `lng FLOAT` columns to `crm_orders`. On API request, check `WHERE lat IS NOT NULL` — only call Nominatim for rows where both are null.

```sql
-- Migration
ALTER TABLE crm_orders ADD COLUMN lat FLOAT;
ALTER TABLE crm_orders ADD COLUMN lng FLOAT;
```

```javascript
// src/lib/geocode.js (server-only)
let lastCallMs = 0

export async function geocodeAddress(address) {
  // Rate limit: 1 req/s
  const now = Date.now()
  const wait = 1000 - (now - lastCallMs)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastCallMs = Date.now()

  const query = encodeURIComponent(`${address}, Foz do Iguaçu, PR, Brasil`)
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SOS-Diaristas/1.0 (sistemasos.queirozautomacoes.com.br)' }
  })
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}
```

**Why:** Nominatim's Terms of Service require a max of 1 request/second and a `User-Agent` header identifying the app. Without the rate limiter, simultaneous page loads will result in HTTP 429 responses and geocoding failures. Without the User-Agent, requests may be blocked.

**Confidence:** HIGH — Nominatim usage policy is publicly documented at nominatim.org/release-docs/develop/api/Search/.

---

### Pattern 3: Heatmap via leaflet.heat

**What:** The `leaflet.heat` plugin is not a React component — it is a Leaflet layer added imperatively. Use the `useMap` hook from react-leaflet to access the Leaflet map instance and add the layer.

```javascript
// Inside MapComponent.js
import { useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function HeatmapLayer({ points }) {
  const map = useMap()

  useEffect(() => {
    if (!points.length) return
    // leaflet.heat is loaded via dynamic require
    const L = require('leaflet')
    require('leaflet.heat')
    const heat = L.heatLayer(
      points.map(p => [p.lat, p.lng, 1.0]),
      { radius: 35, blur: 25, maxZoom: 15, gradient: { 0.4: '#1B5FA8', 0.7: '#4A90D9', 1.0: '#E8F1FB' } }
    )
    heat.addTo(map)
    return () => map.removeLayer(heat)
  }, [points, map])

  return null
}
```

**Why:** `leaflet.heat` has no official React wrapper. The `useMap` hook is the correct react-leaflet escape hatch to access the raw Leaflet instance. The gradient colors `#1B5FA8` / `#4A90D9` / `#E8F1FB` match the existing brand design system (`brand.blue`, `brand.light`).

**Confidence:** MEDIUM — react-leaflet `useMap` pattern is established. `leaflet.heat` integration approach matches community documentation, but exact API should be verified against the current package version before implementation.

---

### Pattern 4: Leaflet Marker Icon Fix

**What:** react-leaflet's default marker icons break in Next.js/Webpack builds because the image paths are resolved incorrectly. Requires an explicit icon fix before any `<Marker>` is rendered.

```javascript
// Inside MapComponent.js, before component definition
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})
```

Copy marker images from `node_modules/leaflet/dist/images/` to `public/leaflet/`. Without this, all markers render as broken image boxes.

**Confidence:** HIGH — this bug and fix are documented in react-leaflet GitHub issues and multiple tutorials. It affects every Next.js + react-leaflet project without exception.

---

### Pattern 5: Fit to Data Bounds

**What:** Rather than hardcoding the Foz do Iguaçu center, use Leaflet's `fitBounds` when data is loaded to automatically zoom to show all geocoded points.

```javascript
// Fallback if no data loaded yet
const FOZ_DO_IGUACU = [-25.5163, -54.5854]
const DEFAULT_ZOOM = 12

// When data arrives with at least one point:
// map.fitBounds(L.latLngBounds(points.map(p => [p.lat, p.lng])))
```

**Why:** Service addresses may cluster in specific bairros. `fitBounds` ensures all pins are visible regardless of where demand concentrates. The hardcoded fallback center (`-25.5163, -54.5854`) is the geographic center of Foz do Iguaçu.

**Confidence:** HIGH (standard Leaflet API).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Importing Leaflet in a Server Component

**What:** Adding `import 'leaflet'` or `import { MapContainer } from 'react-leaflet'` anywhere outside a `'use client'` component or without `ssr: false`.

**Why bad:** Leaflet references `window` and `document` at module load time. Next.js evaluates imports during the server-side render pass. The build will throw `ReferenceError: window is not defined` and the page will not load.

**Instead:** Always isolate Leaflet in a separate component file imported with `dynamic(..., { ssr: false })`.

---

### Anti-Pattern 2: Geocoding on Every Request

**What:** Calling Nominatim every time `/api/dashboard/mapa` is hit, regardless of whether coordinates are already stored.

**Why bad:** With 50 orders, a cache miss on every request generates 50 sequential Nominatim calls at 1 req/s = 50 seconds response time. Violates Nominatim's usage policy. Multiple simultaneous users multiply the violation.

**Instead:** Check `lat IS NOT NULL` first. Only geocode rows with null coordinates. Store on first successful geocode.

---

### Anti-Pattern 3: Geocoding in a Client Component

**What:** Calling Nominatim directly from the browser via `fetch` from within `MapaPage` or `MapComponent`.

**Why bad:** Exposes the User-Agent requirement problem (browsers send their own UA, not the app identifier required by Nominatim ToS). Harder to rate-limit. CORS may block the request depending on Nominatim's configuration. No ability to cache in the database.

**Instead:** All geocoding happens in the API route handler (`src/app/api/dashboard/mapa/route.js`), server-side only.

---

### Anti-Pattern 4: Blocking API Response on Bulk Geocoding

**What:** On first use when the database has 0 cached coordinates, the API route tries to geocode all 100+ historical orders before responding.

**Why bad:** Response timeout (Vercel default 10s per serverless function) will be exceeded. At 1 req/s, 100 orders = 100 seconds minimum.

**Instead:** Two-part strategy:
1. A one-time migration script (`scripts/geocode-backfill.js`) run locally/on VPS that processes all historical orders with proper rate limiting.
2. The API route only geocodes new cache misses (orders created after the backfill), which will be 0–5 at most per request.

---

## Suggested Build Order

Dependencies flow from data to display. Build bottom-up.

```
Step 1: Database migration
  → ALTER TABLE crm_orders ADD lat/lng columns
  → Required by: everything else

Step 2: Geocoding utility
  → src/lib/geocode.js (rate limiter + Nominatim call)
  → Required by: API route

Step 3: Backfill script
  → scripts/geocode-backfill.js (one-time, run before going live)
  → Depends on: geocode.js, DATABASE_URL

Step 4: API route
  → src/app/api/dashboard/mapa/route.js
  → Depends on: db.js, geocode.js, lat/lng columns
  → Returns [{lat, lng, address, status, diarista_name, value}]

Step 5: Map component
  → src/app/dashboard/_components/MapComponent.js
  → Depends on: react-leaflet, leaflet.heat, Leaflet icon fix
  → Pure display: receives points as props

Step 6: Mapa page
  → src/app/dashboard/(app)/mapa/page.js
  → Depends on: MapComponent (dynamic import), API route
  → Owns: period filter state, data fetch, loading state

Step 7: Sidebar integration
  → Add "Mapa" entry to navItems array in layout.js
  → Depends on: page existing and working
```

Build in this order because:
- Steps 1–3 can be done and tested without touching the UI
- Step 4 can be tested with curl before the map exists
- Step 5 can be built with static mock data before the API is wired
- Steps 6–7 integrate the parts

---

## Scalability Considerations

| Concern | Current scale (~200 orders) | At 2K orders | At 20K orders |
|---------|----------------------------|--------------|---------------|
| Geocoding cache misses | 0–5 per request after backfill | Same — cache persists | Same — fully cached |
| API response time | <500ms (all cached) | <500ms | <500ms (needs index on lat IS NULL) |
| Map render performance | Fine — 200 points | Fine — 2K points | May lag — consider server-side clustering |
| Nominatim rate limit | Non-issue after backfill | Non-issue | Non-issue |
| Heatmap visual clarity | Good | Good | Needs radius/blur tuning |

Add `CREATE INDEX idx_orders_lat ON crm_orders(lat)` when checking for cache misses becomes the bottleneck. At 20K+ orders, consider clustering points at the API layer (return neighborhood centroids + counts) instead of all raw coordinates.

---

## Integration Points with Existing Architecture

| Existing Element | How the Map Feature Touches It |
|-----------------|-------------------------------|
| `src/lib/db.js` | No change — `mapa/route.js` calls `query()` as all routes do |
| `src/app/dashboard/(app)/layout.js` | Add one `navItems` entry: `{ id: 'mapa', label: 'Mapa', href: '/dashboard/mapa', icon: MapIcon }` |
| `src/app/dashboard/_components/styles.js` | Reuse `GLASS`, `BG_GRADIENT` constants — no changes needed |
| `src/app/dashboard/_components/icons.js` | Add `MapIcon` SVG for sidebar |
| `crm_orders` table | Add `lat FLOAT`, `lng FLOAT` columns only — no schema breaks |
| `crm_contacts` table | No changes — address already available via JOIN if needed |

The feature adds zero new infrastructure and zero new environment variables. It is entirely additive to the existing monolith.

---

## Key Constraints Respected

- No TypeScript — all new files are `.js`
- No shadcn/ui — Tailwind + inline styles matching existing `GLASS`/`BG_GRADIENT` tokens
- No Google Maps — Leaflet + OpenStreetMap + Nominatim only
- No new paid services — all free/open source
- Rate limit compliance — Nominatim 1 req/s enforced in `geocode.js`, User-Agent required
- UX for non-technical user — large controls, clear labels, loading state while map initializes

---

## Sources

- Nominatim Usage Policy: https://operations.osmfoundation.org/policies/nominatim/ (rate limit, User-Agent requirement) — MEDIUM confidence (training knowledge, verify current policy before implementation)
- react-leaflet dynamic import pattern: widely documented in Next.js community; canonical issue is `window is not defined` — HIGH confidence
- Leaflet default icon fix in Webpack/Next.js: documented in react-leaflet GitHub issues and multiple tutorials — HIGH confidence
- leaflet.heat plugin: https://github.com/Leaflet/Leaflet.heat — MEDIUM confidence (training knowledge; verify current npm version and `useMap` integration pattern)
- Foz do Iguaçu coordinates: `-25.5163, -54.5854` — HIGH confidence (geographic data)

---

*Architecture research: 2026-03-17*
