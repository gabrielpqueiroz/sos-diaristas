# Technology Stack — Geolocation Heatmap

**Project:** SOS Diaristas — Mapa de Atendimentos
**Researched:** 2026-03-17
**Confidence note:** External verification tools (WebSearch, WebFetch, Context7) were unavailable during this research session. All version references and claims are based on training knowledge (cutoff August 2025). Versions MUST be verified against npmjs.com before installation.

---

## Recommended Stack

### Map Rendering

| Technology | Version (verify) | Purpose | Why |
|------------|-----------------|---------|-----|
| `leaflet` | ^1.9.x | Core map engine | Most mature open-source web map library; tile-agnostic; no API key needed; 40kb gzipped; works with any tile provider including OpenStreetMap |
| `react-leaflet` | ^4.2.x | React wrapper for Leaflet | Official React integration for Leaflet; v4 targets React 18; provides hooks API (`useMap`, `useMapEvents`) compatible with Next.js client components |

**Confidence:** MEDIUM — react-leaflet v4 is well-established with React 18 support as of training cutoff. Verify current patch versions on npmjs.com before pinning.

**Critical Next.js constraint:** Leaflet accesses `window` and `document` at import time. In Next.js App Router, any component importing Leaflet MUST be:
1. Wrapped with `dynamic(() => import('./MapComponent'), { ssr: false })` in the page file
2. Marked `'use client'` at the top of the map component itself

Failure to do both causes a "window is not defined" build error. This is the single most common integration pitfall.

### Heatmap Layer

| Technology | Version (verify) | Purpose | Why |
|------------|-----------------|---------|-----|
| `leaflet.heat` | ^0.2.0 | Heatmap overlay on Leaflet map | The canonical heatmap plugin for Leaflet, used by the majority of Leaflet heatmap implementations; based on simpleheat; lightweight (~3kb); accepts `[lat, lng, intensity]` point arrays |

**Confidence:** MEDIUM-LOW — `leaflet.heat` is maintained but has had sparse updates. As of training cutoff it works with Leaflet 1.x. The package must be imported only on the client side (same SSR constraint as Leaflet itself). No TypeScript types are bundled — not relevant for this JS-only project.

**Integration pattern:** `leaflet.heat` is not a React component — it attaches directly to the Leaflet map instance. Use the `useMap()` hook from `react-leaflet` to get the map instance, then call `L.heatLayer(points, options).addTo(map)` inside a `useEffect`. Clean up the layer on unmount and re-create when filter state changes.

**Alternative considered: `react-leaflet-heatmap-layer-v3`** — a React-specific wrapper around `leaflet.heat`. Adds a React component abstraction but introduces an extra dependency that has not been actively maintained. Adds complexity without meaningful benefit for this project's single heatmap use case. Do not use.

### Geocoding

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Nominatim (OpenStreetMap) | API v1 (no version pinning needed) | Address text → lat/lng coordinates | Free, no API key, no billing, covers Brazilian addresses well; rate limit of 1 request/second is workable with the server-side queue approach |

**Confidence:** HIGH — Nominatim is the standard free geocoding option; its usage policy and rate limits are stable and well-documented at nominatim.org.

**How to call it:** From a Next.js API route (server-side only, never client-side), use native `fetch`:

```javascript
const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=br`;
const res = await fetch(url, {
  headers: { 'User-Agent': 'SOS-Diaristas/1.0 (contact@sosdiaristas.com.br)' }
});
```

The `User-Agent` header is **required** by Nominatim's usage policy. Requests without it may be blocked.

**Rate limiting:** Nominatim enforces 1 req/s. Do NOT call Nominatim from the browser or from a client component — this exposes the rate limit to every page load. All geocoding calls must go through the Next.js API route layer, which can enforce sequential processing with a simple in-memory delay queue or by geocoding in a background job.

### Database (geocoding cache)

No new database technology needed. The existing `pg` pool and `crm_orders` / `crm_contacts` tables are the right place to cache geocoded coordinates.

Add two nullable columns to the relevant table:

```sql
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE crm_orders ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
```

Before calling Nominatim, check if `lat IS NOT NULL` for the order. If cached, skip geocoding. The `geocoded_at` column enables cache invalidation if address data changes.

**Confidence:** HIGH — this is a straightforward PostgreSQL pattern, no new technology needed.

### Tile Provider

| Provider | Cost | Coverage | Why |
|----------|------|----------|-----|
| OpenStreetMap (Carto CDN) | Free | Global | No API key; excellent Brazilian city coverage; standard for open-source mapping projects |

**Tile URL:**
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

**Attribution required:** OpenStreetMap requires attribution in the map UI. `react-leaflet` includes an `<Attribution>` component — use it.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Map library | Leaflet + react-leaflet | Google Maps JS API | Google Maps requires billing setup and API key management; project explicitly ruled it out in PROJECT.md |
| Map library | Leaflet + react-leaflet | Mapbox GL JS | Mapbox requires a paid API key for production; higher bundle size; overkill for a single-city heatmap |
| Map library | Leaflet + react-leaflet | deck.gl (Uber) | Heavy WebGL-based library; steep learning curve; designed for complex data viz at scale, not simple heatmaps |
| Map library | Leaflet + react-leaflet | OpenLayers | More complex API than Leaflet; larger bundle; Leaflet's ecosystem has more React integration resources |
| Heatmap | leaflet.heat | react-leaflet-heatmap-layer-v3 | Unmaintained wrapper adds indirection without benefit for a single heatmap use case |
| Geocoding | Nominatim | Google Geocoding API | Paid; requires billing; project explicitly ruled it out |
| Geocoding | Nominatim | Mapbox Geocoding API | Paid beyond free tier; adds API key dependency |
| Geocoding | Nominatim | viacep.com.br | CEP-only; addresses from WhatsApp conversations are free-form text, not reliable CEP strings |

---

## Installation

```bash
# Map rendering
npm install leaflet react-leaflet

# Heatmap plugin (no React wrapper needed)
npm install leaflet.heat
```

**Do NOT install `@types/leaflet` or `@types/react-leaflet`** — this project uses JavaScript only, type packages are irrelevant and will be dead weight.

---

## Next.js Integration Pattern

The SSR avoidance pattern is non-negotiable. The page file (`mapa/page.js`) must use dynamic import:

```javascript
// src/app/dashboard/(app)/mapa/page.js
import dynamic from 'next/dynamic';

const MapaAtendimentos = dynamic(
  () => import('./_components/MapaAtendimentos'),
  {
    ssr: false,
    loading: () => <div style={{ height: '500px' }}>Carregando mapa...</div>
  }
);

export default function MapaPage() {
  return <MapaAtendimentos />;
}
```

The actual map component (`_components/MapaAtendimentos.js`) must have `'use client'` at the top and can safely import from `react-leaflet` and `leaflet.heat`.

**Leaflet default icon fix:** Leaflet's default marker icon uses `_getIconUrl` which breaks in bundled environments (webpack/Next.js) because the image paths can't be resolved. Add this once at the top of your map component, before any map initialization:

```javascript
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths broken by webpack bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
```

Alternatively, use custom SVG markers via `L.divIcon` to avoid the issue entirely.

---

## API Route: Geocoding

A new API route is needed to handle geocoding with cache lookup:

**`GET /api/dashboard/mapa/geocodificar?id={order_id}`**

Logic:
1. Query `crm_orders` for the order — if `lat IS NOT NULL`, return cached coordinates immediately
2. If `lat IS NULL`, call Nominatim with `address + ', Foz do Iguaçu, PR, Brasil'` appended (improves match rate for local addresses)
3. On success: update `crm_orders SET lat=$1, lng=$2, geocoded_at=now() WHERE id=$3`, return coordinates
4. On Nominatim failure (no results, rate limit error): return `{ lat: null, lng: null, error: 'not_found' }` — do not crash

**`GET /api/dashboard/mapa/pontos?days=30`**

Returns all orders with `lat IS NOT NULL` for the selected period, formatted as `[{ lat, lng, weight, address, status, scheduled_date }]` for the frontend.

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| react-leaflet for Next.js | MEDIUM | Well-established pattern; SSR constraint is documented; external verification unavailable for exact current versions |
| leaflet.heat plugin | MEDIUM-LOW | Works with Leaflet 1.x; maintenance is sparse; no active alternative exists with better maintenance |
| Nominatim geocoding | HIGH | Stable free API; usage policy well-documented; known to work for Brazilian addresses |
| PostgreSQL lat/lng cache | HIGH | Standard pattern; no new technology; fits existing `pg` pool |
| Tile provider (OSM) | HIGH | No API key, free, stable |
| SSR dynamic import pattern | HIGH | Documented Next.js pattern; required for any DOM-dependent library |

---

## Version Verification Checklist

Before running `npm install`, verify these on npmjs.com:

- [ ] `leaflet` — confirm latest 1.x is still 1.9.x range and compatible with react-leaflet v4
- [ ] `react-leaflet` — confirm v4 supports React 18 and is not deprecated in favor of v5
- [ ] `leaflet.heat` — confirm 0.2.0 still installs without conflicts against leaflet 1.9.x
- [ ] Check react-leaflet release notes for any App Router-specific changes after August 2025

---

## Sources

- PROJECT.md: Explicit constraint decisions (Leaflet, Nominatim, no Google Maps) — HIGH confidence, authored by project owner
- .planning/codebase/STACK.md: Existing stack baseline (Next.js 14.2.5, React 18, pg, Tailwind, JavaScript only)
- Training knowledge (cutoff August 2025): react-leaflet patterns, SSR avoidance, Nominatim usage policy — MEDIUM confidence, unverified externally in this session
- Nominatim Usage Policy: https://operations.osmfoundation.org/policies/nominatim/ (known stable reference, not fetched in this session)
