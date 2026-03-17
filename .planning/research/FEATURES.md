# Feature Landscape

**Domain:** Geolocation heatmap page in a service-business CRM dashboard (cleaning service, single city)
**Project:** SOS Diaristas — Mapa de Atendimentos
**Researched:** 2026-03-17
**Confidence:** HIGH (well-established domain; verified against project context and existing system)

---

## Table Stakes

Features users expect from a service-area map. Missing any of these and the map feels broken or useless.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Real map of the city (not a blank canvas) | A map without a recognizable basemap has no value — users need street context | Low | OpenStreetMap tiles via Leaflet; center on Foz do Iguaçu [-25.5478, -54.5882] |
| Pins (markers) at order addresses | Primary data display — "where did we serve?" is the core question | Medium | Geocoded lat/lng per order; fallback dot if geocoding fails |
| Heatmap layer showing demand concentration | Spatial density is what makes a map strategic, not just informational | Medium | leaflet.heat plugin; intensity = order count at that coordinate cluster |
| Filter by period (last 7 / 30 / 90 days) | Without time filtering, the map becomes noise — users can't see trends | Low | Date range filter; drives the API query |
| Order count summary (total visible on map) | Users need a sanity check — "I see N orders on this map" | Low | Single KPI card above or beside the map |
| Loading state while data fetches | Map tiles + geocoded data fetch takes 1–3s; blank screen reads as broken | Low | Spinner or skeleton consistent with existing dashboard UX |
| Map zoom/pan (interactive) | Standard map interaction; removing it would feel like a screenshot | Low | Built into Leaflet by default; no extra work |
| Geocoding cache (coordinates stored in DB) | Nominatim has a 1 req/s rate limit — re-geocoding breaks the feature at scale | Medium | `lat` and `lng` columns on `crm_orders`; geocode once, cache forever |
| Graceful handling of ungeocoded addresses | Some addresses from WhatsApp will be incomplete; app must not crash | Medium | Show count of "addresses not found"; skip those points silently |

---

## Differentiators

Features that go beyond expectations and create strategic value — valuable but not mandatory for v1.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Neighborhood-level summary panel | Instead of just pins, show "Jardim Naipi: 12 atendimentos" as a ranked list | Medium | Join address data with `neighborhood` field from `crm_contacts`; display as sidebar list sorted by count |
| Toggle between heatmap and pins | Power users want to alternate views: heatmap for density, pins for individual records | Low | Toggle button; both layers already rendered, just show/hide |
| Click on pin to see order detail | Turns the map from read-only into an entry point for the CRM | Medium | Popup with contact name, date, service type, diarista assigned |
| "Cold zones" visual cue | Highlight areas of the city with zero coverage — strategic for marketing expansion | High | Requires polygon overlay of city neighborhoods; significant mapping data work |
| Diarista coverage overlay | Show which diaristas serve which areas, to optimize dispatch | High | Requires diarista-to-zone assignment logic not yet in the system |

---

## Anti-Features

Features to explicitly NOT build in this milestone. Each has a clear reason.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time GPS tracking of diaristas | Requires mobile app or tracking SDK, which does not exist; complexity far exceeds value for this use case | Static map of completed/scheduled orders is sufficient |
| Google Maps API | Billing required; rate limits require API key management; OSM/Nominatim is free and sufficient for Brazilian addresses | Use Leaflet + OpenStreetMap tiles |
| Choropleth maps (colored polygons by zone) | Requires GeoJSON boundary data for Foz do Iguaçu neighborhoods, which is not freely available in structured form | Heatmap density achieves the same visual goal without polygon data |
| Filter by diarista on the map | Scope creep for v1; complicates the UI without strong validated user need | Log as future enhancement after validating basic map usage |
| Filter by order status on the map | Same as above — adds filter complexity before the basic feature is proven useful | All active statuses (agendado → concluido) shown by default |
| Customer-facing map (public page) | Service area transparency is not a product requirement; this is an internal operations tool | Dashboard-only, behind the auth guard |
| Geocoding at form submission time (WhatsApp bot) | Would require changes to the n8n flow; out of scope | Geocode lazily when the map page loads, using the cache-on-first-hit strategy |
| Reverse geocoding (lat/lng → address display) | We already have address strings from orders; no need to go the other direction | Use existing `address` field for display in popups |
| Auto-refresh on the map page | Map data does not change second-to-second; unnecessary network load | Manual refresh or a single load on page mount |

---

## Feature Dependencies

```
Geocoding cache columns (lat/lng on crm_orders)
  → Pins on map            (requires coordinates)
  → Heatmap layer          (requires coordinates)
  → Click-to-detail popup  (requires pins)

Basemap rendering (Leaflet + OSM tiles)
  → All map features       (nothing works without the map itself)

Period filter (date range state)
  → Pins on map            (API query scoped by date)
  → Heatmap layer          (same dataset)
  → Order count KPI        (same dataset)

Nominatim geocoding API (background process)
  → Geocoding cache        (fills the cache)
  → Graceful fallback      (for addresses that return no result)
```

---

## MVP Recommendation

Prioritize for the initial delivery:

1. **Basemap + Pins** — Core visual: real map of Foz do Iguaçu with one marker per geocoded order address
2. **Geocoding cache** — Infrastructure that enables everything else; must be in place first
3. **Heatmap layer** — The strategic view; overlay on top of pins (or toggle)
4. **Period filter (7 / 30 / 90 days)** — Without this the map is a static snapshot with no analytical value
5. **Order count KPI** — One number: "X atendimentos neste período"; validates the map data to the user
6. **Graceful handling of failed geocoding** — Required for production reliability given free-text WhatsApp addresses

Defer to next iteration:

- **Neighborhood summary panel** — High value but adds UI surface area; validate the map itself first
- **Click-to-detail popup** — Nice to have; adds CRM linking but not essential for the spatial analysis goal
- **Toggle heatmap/pins** — Simple to build but adds UX decision-making; default to heatmap-on-pins

---

## Notes on Existing System Integration

- Address data lives in `crm_orders.address` (free-text) and `crm_contacts.address` / `neighborhood` / `city`
- Prefer `crm_orders.address` as the geocoding source — it is the service location, not the contact's billing address
- `crm_contacts.neighborhood` can serve as a fallback group for the neighborhood summary panel differentiator
- The existing pattern for dashboard pages is: `'use client'` + `useEffect` fetch on mount + `useState` for data — the map page should follow this pattern exactly
- Leaflet requires `dynamic()` with `ssr: false` in Next.js App Router because it accesses `window` at import time — this is a mandatory implementation detail, not optional
- The dark glassmorphism theme means the default Leaflet light map tile (CartoDB Light / OSM Standard) will visually clash; CartoDB Dark Matter tiles are the correct pairing for this design system

---

## Sources

- Project context: `.planning/PROJECT.md` (HIGH confidence — first-party requirements)
- Codebase analysis: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STACK.md` (HIGH confidence — actual code)
- Leaflet + leaflet.heat ecosystem knowledge (MEDIUM confidence — training data up to Aug 2025; Leaflet is stable and unlikely to have changed materially)
- Nominatim usage policy and rate limits: known constraint from project requirements (HIGH confidence — explicitly stated in PROJECT.md)
- react-leaflet + Next.js SSR pattern (HIGH confidence — well-documented community pattern, stable across versions)
