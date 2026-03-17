# Project Research Summary

**Project:** SOS Diaristas — Mapa de Atendimentos (Geolocation Heatmap)
**Domain:** Geolocation heatmap page in an existing Next.js 14 CRM dashboard (single-city, service business)
**Researched:** 2026-03-17
**Confidence:** MEDIUM (core technology patterns HIGH; plugin internals and geocoding accuracy MEDIUM)

## Executive Summary

This feature adds a geolocation heatmap to the existing SOS Diaristas CRM dashboard, showing where cleaning service orders have been fulfilled across Foz do Iguaçu. The stack is entirely additive — two new npm packages (`leaflet` + `react-leaflet` for map rendering, `leaflet.heat` for density visualization) and a free geocoding API (Nominatim/OpenStreetMap). No new infrastructure, no new paid services, no new environment variables. The feature fits neatly into the monolithic Next.js 14 App Router pattern already in use.

The recommended approach is to build bottom-up: database migration first (add `lat`/`lng` columns to `crm_orders`), then the geocoding utility with rate limiting, then a one-time backfill script for historical orders, then the API route, then the map component, then the page. This ordering ensures each layer can be tested independently and that the Nominatim rate limit constraint never blocks the user-facing page load. The single most important architectural decision is separating the geocoding process from the map data response — geocoding must be non-blocking.

The primary risks are all well-documented: Leaflet's SSR incompatibility with Next.js App Router (fixed with `dynamic(..., { ssr: false })`), Nominatim's 1 req/s rate limit (fixed with a sequential delay queue and persistent cache), and address quality issues from WhatsApp-sourced free-text addresses (mitigated by always appending `, Foz do Iguaçu, PR, Brasil` and using a bounding box). None of these risks are novel — each has a clear, established prevention strategy that must be applied from the first line of code.

## Key Findings

### Recommended Stack

The feature requires only two new npm packages on top of the existing stack. Leaflet (`^1.9.x`) is the most mature open-source web map library with no API key requirement; `react-leaflet` (`^4.2.x`) provides the React integration compatible with React 18. The `leaflet.heat` plugin (`^0.2.0`) is the canonical heatmap layer for Leaflet, lightweight at ~3kb, but has no React wrapper — it must be managed imperatively via the `useMap()` hook. Nominatim (OpenStreetMap's geocoding API) is free, requires no API key, and covers Brazilian addresses adequately when addresses are supplemented with city context. The existing PostgreSQL `crm_orders` table simply gains two nullable `FLOAT` columns for the coordinate cache.

**Core technologies:**
- `leaflet` + `react-leaflet`: Map rendering and React integration — free, no API key, OSM tile compatible
- `leaflet.heat`: Heatmap density layer — canonical Leaflet plugin, managed imperatively via `useMap()`
- Nominatim (OpenStreetMap): Geocoding — free, 1 req/s limit, good Brazilian city coverage
- `crm_orders.lat` / `crm_orders.lng`: Persistent geocoding cache — standard PostgreSQL pattern, no new infrastructure
- OpenStreetMap tiles (Carto Dark Matter): Basemap — free, no API key, dark theme compatible with existing design system

**Version verification required before install:** `leaflet` (confirm 1.9.x), `react-leaflet` (confirm v4 supports React 18), `leaflet.heat` (confirm 0.2.0 works with Leaflet 1.9.x). External verification tools were unavailable during research — npmjs.com check is mandatory before `npm install`.

### Expected Features

The MVP delivers the core analytical value: a real map of Foz do Iguaçu with geocoded order pins and a density heatmap, filterable by period, with a count KPI and graceful handling of ungeocoded addresses.

**Must have (table stakes):**
- Basemap rendering (Leaflet + OpenStreetMap tiles, dark tile theme)
- Geocoding cache infrastructure (`lat`/`lng` columns + Nominatim backfill)
- Order pins (markers) at geocoded addresses
- Heatmap density layer (`leaflet.heat`)
- Period filter (7 / 30 / 90 days) — without this the map is a static, unanalyzable snapshot
- Order count KPI ("X atendimentos neste período")
- Graceful fallback for failed geocoding (count shown, no crash)
- Loading state consistent with dashboard dark glassmorphism theme

**Should have (differentiators, next iteration):**
- Neighborhood-level summary panel (ranked list of bairros by order count)
- Click-on-pin order detail popup (links map to CRM)
- Toggle between heatmap and pins views

**Defer to v2+:**
- Cold zone visualization (requires GeoJSON neighborhood boundaries — not freely available)
- Diarista coverage overlay (requires zone-assignment logic not yet in system)
- Real-time GPS tracking (requires mobile app — out of scope entirely)
- Filter by diarista or order status on map (scope creep before basic map usage is validated)

### Architecture Approach

The feature is entirely additive to the existing monolith — one new page (`/dashboard/mapa`), one new API route (`/api/dashboard/mapa`), one new utility module (`src/lib/geocode.js`), and two new columns on `crm_orders`. The critical structural constraint is that Leaflet must be isolated in a separate client component file imported with `dynamic(..., { ssr: false })` from the page. The geocoding utility is server-only and must never be imported in a client component.

**Major components:**
1. `src/app/dashboard/(app)/mapa/page.js` — Page shell: owns period filter state, fetches data from API, renders map container via dynamic import
2. `src/app/dashboard/_components/MapComponent.js` — Leaflet wrapper: `'use client'`, receives points as props, renders TileLayer + MarkerLayer + HeatmapLayer, manages layer lifecycle
3. `src/app/api/dashboard/mapa/route.js` — Data API: queries orders with period filter, checks coordinate cache, triggers geocoding for cache misses only, returns `[{lat, lng, address, status, ...}]`
4. `src/lib/geocode.js` — Geocoding utility: server-only, enforces 1 req/s rate limit, calls Nominatim, stores results
5. `scripts/geocode-backfill.js` — One-time migration script: processes all historical orders before go-live
6. `crm_orders` table migration — Adds `lat FLOAT`, `lng FLOAT`, `geocoded_at TIMESTAMPTZ` columns

### Critical Pitfalls

1. **Leaflet SSR crash (`window is not defined`)** — Use `dynamic(() => import('./MapComponent'), { ssr: false })` in the page and `'use client'` in the component. This is non-negotiable. Forgetting it causes build failures.
2. **Nominatim rate limit violations** — Never use `Promise.all` for geocoding. Use a sequential loop with explicit 1100ms delay. Separate the geocoding endpoint from the map data endpoint. Cache aggressively.
3. **Addresses geocode to wrong city** — `crm_orders.address` is free-form WhatsApp text with no city. Always append `, Foz do Iguaçu, PR, Brasil` and pass a Foz do Iguaçu bounding box `viewbox` to every Nominatim request.
4. **Broken marker icons (404s)** — Apply `delete L.Icon.Default.prototype._getIconUrl` + `L.Icon.Default.mergeOptions({...})` fix immediately on component creation. Without it every marker renders as a broken image.
5. **Map resets view on every filter change** — Never use filter state as the `key` prop on `<MapContainer>`. Update data layers in-place via `useRef` + layer add/remove API to preserve user's zoom/pan state.

## Implications for Roadmap

Based on research, a 3-phase build order is strongly recommended. Dependencies flow data → infrastructure → display, and all critical pitfalls cluster around the first phase. Build bottom-up.

### Phase 1: Map Scaffold and Static Display

**Rationale:** All rendering pitfalls (SSR crash, broken icons, missing CSS, invisible height) must be solved before any real data is wired in. Building with static mock data first lets the map component be validated in isolation. This phase establishes the `dynamic()` import pattern that everything else depends on.

**Delivers:** A working, styled Leaflet map of Foz do Iguaçu with static test pins and the correct dark tile theme (Carto Dark Matter). Sidebar navigation entry added. No real data yet.

**Addresses:** Table stakes — basemap rendering, loading state, dashboard integration

**Avoids:**
- Pitfall 1: SSR crash — `dynamic(..., { ssr: false })` baked in from the start
- Pitfall 2: Broken marker icons — icon fix applied before any `<Marker>` is written
- Pitfall 6: Missing CSS import — `leaflet/dist/leaflet.css` in client component
- Pitfall 9: React Strict Mode double-init — use `react-leaflet` `<MapContainer>` (handles this in v4+)

**Research flag:** Standard patterns — no additional research needed. react-leaflet + Next.js dynamic import is thoroughly documented.

### Phase 2: Geocoding Infrastructure

**Rationale:** Geocoding must exist and be cached before any map can display real data. The backfill script must run before go-live or the first page load will time out. The rate-limiting and address-normalization concerns must be designed in from the start — they cannot be retrofitted.

**Delivers:** `lat`/`lng` columns on `crm_orders`, `geocode.js` utility with 1 req/s rate limiter, `scripts/geocode-backfill.js` one-time script, and `GET /api/dashboard/mapa` route that returns cached coordinates only (no blocking geocoding on read path).

**Uses:** Nominatim API, existing `pg` pool, existing `crm_orders` table

**Implements:** Geocoding cache pattern, non-blocking read/write separation

**Avoids:**
- Pitfall 3: Rate limit violations — sequential delay queue in `geocode.js`
- Pitfall 5: Wrong-city results — `, Foz do Iguaçu, PR, Brasil` appended + viewbox
- Pitfall 7: Re-geocoding cached addresses — `WHERE lat IS NULL` guard
- Pitfall 10: Address without city context — JOIN `crm_contacts` for city fallback
- Pitfall 13: Slow first load — data route returns cached coordinates immediately; geocoding is a separate non-blocking operation

**Research flag:** No additional research needed. Nominatim usage policy, rate limits, and request format are well-documented. Address normalization approach is derivable from existing schema.

### Phase 3: Heatmap, Filters, and Polish

**Rationale:** With geocoded data available from Phase 2, the heatmap layer and period filter can be wired in. The `leaflet.heat` integration has its own lifecycle pitfalls that must be addressed at this stage. Filter state management must avoid resetting the map view.

**Delivers:** Heatmap density overlay, period filter (7/30/90 days), order count KPI, "X endereços sem coordenadas" indicator for ungeocoded addresses. Feature complete for v1.

**Uses:** `leaflet.heat` plugin, `useMap()` hook, `useRef` for layer lifecycle management

**Implements:** HeatmapLayer component with proper add/remove lifecycle, filter-driven data refresh without map remount

**Avoids:**
- Pitfall 4: `L.heatLayer is not a function` — import `leaflet.heat` inside `useEffect`, store layer in `useRef`, remove before recreating
- Pitfall 8: Map view reset on filter — never use filter state as `key` on `<MapContainer>`
- Pitfall 12: Uniform heatmap blob — group orders by coordinate, pass count as intensity weight

**Research flag:** `leaflet.heat` plugin API should be verified against current npm version before implementation. The `useMap()` + `useEffect` integration pattern is established community practice but plugin internals are MEDIUM confidence.

### Phase Ordering Rationale

- Phase 1 before Phase 2: The display layer must be testable with static data before real geocoding is added. SSR errors from Phase 1 would block everything if not caught early.
- Phase 2 before Phase 3: The heatmap is meaningless without geocoded coordinates. The backfill script must run before the heatmap is activated.
- Phase 3 last: Filter state and heatmap lifecycle are integration concerns — they only make sense when the underlying data pipeline (Phase 2) is proven.
- Backfill script in Phase 2 (not Phase 3): The historical geocoding backfill is infrastructure, not UI. Running it before Phase 3 means the heatmap shows real data immediately on first activation.

### Research Flags

Needs careful validation before implementation:
- **Phase 2:** Verify current Nominatim geocoding accuracy for Foz do Iguaçu address formats by testing 5–10 real addresses from `crm_orders` before writing the backfill script. Adjust normalization strategy if match rate is below 70%.
- **Phase 3:** Verify `leaflet.heat` npm version is `leaflet.heat` (dot, not dash) and that `0.2.0` installs cleanly against the installed Leaflet version. Run `npm install` and confirm no peer dependency conflicts before writing HeatmapLayer.

Standard patterns (skip additional research):
- **Phase 1:** Leaflet + Next.js dynamic import is one of the most documented SSR workarounds in the ecosystem. Follow the pattern as specified.
- **Phase 2:** PostgreSQL nullable column cache and Nominatim HTTP API are standard, stable patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | react-leaflet v4 + React 18 is established; `leaflet.heat` is MEDIUM-LOW (sparse updates, no external verification in this session). Verify versions on npmjs.com before install. |
| Features | HIGH | Derived from first-party PROJECT.md + direct codebase analysis. Feature scope is well-bounded for a single-city internal tool. |
| Architecture | MEDIUM | Next.js dynamic import pattern is HIGH confidence. `leaflet.heat` imperative layer management is MEDIUM — verify against current package API. |
| Pitfalls | HIGH | SSR crash, Nominatim rate limits, broken icons, and address-without-city are all confirmed, well-documented issues with years of community evidence. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Nominatim match rate for real addresses:** The actual percentage of `crm_orders.address` values that geocode successfully is unknown until tested. If below ~60%, a fallback geocoding strategy (manual pin drop, secondary geocoder) should be planned.
- **`leaflet.heat` npm version compatibility:** External package verification was unavailable during research. Must be confirmed against current Leaflet version before committing to this plugin. The alternative (`react-leaflet-heatmap-layer-v3`) was ruled out as unmaintained, so if `leaflet.heat` has breaking issues, a custom canvas overlay would be the fallback.
- **Carto Dark Matter tile URL:** The exact CDN URL for CartoDB Dark Matter tiles should be confirmed against current Carto documentation. The standard OSM tile URL works but will visually clash with the dark dashboard theme.
- **Vercel serverless timeout:** If historical orders are large (500+) and the backfill script is run via Vercel, it will exceed the 10s function timeout. The backfill script must be run locally or on the VPS, not as a Vercel API route.

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — Feature requirements, technology constraints (Leaflet, Nominatim, no Google Maps), single-city scope
- `CLAUDE.md` — Existing stack (Next.js 14.2.5, React 18, pg pool, JavaScript only, no TypeScript), schema, design system
- `.planning/codebase/ARCHITECTURE.md` — Existing component patterns and page structure

### Secondary (MEDIUM confidence)
- Training knowledge (cutoff August 2025): react-leaflet v4 SSR pattern, `leaflet.heat` integration via `useMap()`, Nominatim rate limits and User-Agent requirement
- Nominatim Usage Policy: https://operations.osmfoundation.org/policies/nominatim/ (rate limit, User-Agent requirement) — known stable reference, not fetched in this session

### Tertiary (LOW confidence — verify before implementation)
- `leaflet.heat` GitHub: https://github.com/Leaflet/Leaflet.heat — plugin API surface, verify current version
- react-leaflet changelog — verify v4/v5 status and React 18 compatibility at time of install

---
*Research completed: 2026-03-17*
*Ready for roadmap: yes*
