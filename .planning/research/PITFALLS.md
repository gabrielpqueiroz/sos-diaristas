# Domain Pitfalls

**Domain:** Geolocation heatmap — Leaflet + Nominatim geocoding in Next.js 14 App Router dashboard
**Project:** SOS Diaristas — Mapa de Atendimentos
**Researched:** 2026-03-17
**Confidence note:** WebSearch and WebFetch were unavailable during this session. All findings are drawn from training knowledge (cutoff August 2025) about these specific library combinations. Confidence levels are assigned conservatively. Core claims (SSR incompatibility, Nominatim rate limits, leaflet-defaulticon) are well-established, high-recurrence problems — HIGH confidence. Plugin-specific nuances are MEDIUM. Vercel/Edge runtime specifics are MEDIUM.

---

## Critical Pitfalls

Mistakes that cause build failures, broken deploys, or full rewrites.

---

### Pitfall 1: Leaflet Crashes at Build Time — `window is not defined`

**What goes wrong:** `import L from 'leaflet'` or `import { MapContainer } from 'react-leaflet'` at the top level of any Next.js component causes the build (or server render) to crash with `ReferenceError: window is not defined`. Leaflet accesses `window`, `document`, and `navigator` on module load — before any component mounts. App Router runs every component as a React Server Component by default, which means no browser globals exist.

**Why it happens:** Next.js 14 App Router renders all components server-side unless explicitly opted out. Leaflet is a browser-only library that was never designed for SSR.

**Consequences:** The entire `/mapa` page throws a 500 or fails to build. The error only appears at build time or on first server render — local `npm run dev` with cached pages may not reveal it immediately.

**Prevention:**
- Mark the entire map component (or at minimum the file that imports Leaflet) with `'use client'` at the top.
- Wrap the component import with `dynamic(() => import('./MapaComponent'), { ssr: false })` in the page that includes the map. This is the canonical pattern.
- Never import `leaflet` or `react-leaflet` in a server component or an API route.

**Detection:**
- Build fails with `ReferenceError: window is not defined` or `navigator is not defined`.
- Component renders fine in dev but crashes on `npm run build`.

**Phase:** Must be addressed in Phase 1 (map scaffolding). If SSR is not disabled before any Leaflet import is added, the build will be broken from the first line.

**Confidence:** HIGH — this is the single most-reported issue for Leaflet + Next.js, documented in react-leaflet's own FAQ.

---

### Pitfall 2: Default Marker Icons Are Broken (404 on Tile/Icon Requests)

**What goes wrong:** After getting the map to render, all default Leaflet marker pins are broken — the pin icon images show as broken image placeholders. The console shows 404s for `marker-icon.png`, `marker-icon-2x.png`, and `marker-shadow.png`.

**Why it happens:** Leaflet resolves its default icon images relative to the CSS file path using a webpack/bundler URL that does not work with Next.js asset handling. The icons exist in `node_modules/leaflet/dist/images/` but the computed URL at runtime points nowhere.

**Consequences:** Every `<Marker>` on the map renders a broken image. The map itself works, but pins are invisible or broken.

**Prevention:** Apply the standard fix immediately after installing Leaflet — before writing any other map code:

```js
// In the map component, before any L.marker usage:
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })
```

Or use a CDN URL for icons instead of the bundled images.

**Detection:** Broken image icons on the map. Console 404s mentioning `marker-icon.png`.

**Phase:** Phase 1 (map scaffolding) — bake this fix into the initial component template.

**Confidence:** HIGH — this is the second most-reported Leaflet + webpack/Next.js issue, present for years across CRA, Vite, and Next.js.

---

### Pitfall 3: Nominatim Rate Limit Causes Geocoding Failures at Scale

**What goes wrong:** Nominatim enforces a strict limit of 1 request per second per IP. If the geocoding logic fires requests for multiple addresses concurrently (e.g., on page load for all uncached orders), Nominatim returns HTTP 429 or silently returns empty results. The geocoding appears to "work" for the first address and fail randomly for the rest.

**Why it happens:** JavaScript's natural async/await with `Promise.all` sends all requests simultaneously. Even sequential processing with `await` in a loop may fire faster than 1 req/s if the network is fast.

**Consequences:** Many addresses fail to geocode, show no pins on the map, and the cache never gets populated — so they fail again on every page load until manually fixed.

**Prevention:**
- Never use `Promise.all` for Nominatim requests. Use a sequential loop with a deliberate 1100ms delay between each request.
- Geocode in a background API route triggered on-demand, not on map page load.
- Always check the cached `lat`/`lng` columns in `crm_orders` first — only geocode if both are NULL.
- Consider a queue: when the map page loads, request geocoding only for the oldest N un-geocoded addresses, not all of them at once.

**Detection:**
- Some addresses geocode, others silently return no coordinates.
- HTTP 429 responses in server logs.
- Geocoding works for 1–2 addresses then stops.

**Phase:** Phase 2 (geocoding API route). The rate-limit-safe sequential pattern must be designed in from the start, not retrofitted.

**Confidence:** HIGH — Nominatim's usage policy is publicly documented and 1 req/s is the stated hard limit.

---

### Pitfall 4: `leaflet.heat` Plugin Has No Official React Wrapper — Direct DOM Manipulation Required

**What goes wrong:** `leaflet-heat` (the standard heatmap plugin) is not a React-aware library. It does not have a `react-leaflet` layer component. Developers attempt to import it as a normal module or use a `useEffect` but run into module-not-found errors, or the heatmap layer does not update when data changes.

**Why it happens:** `leaflet-heat` is a vanilla Leaflet plugin that extends `L.Layer` directly. It must be imported with side-effect-only syntax and its instance must be managed via the `useMap()` hook from `react-leaflet`.

**Consequences:** Heatmap layer either never renders, or renders once and does not update when the period filter changes.

**Prevention:**
- Import the plugin after confirming the `window` is available: inside `useEffect` or after the `'use client'` / `ssr: false` guard.
- Use `react-leaflet`'s `useMap()` hook to get the Leaflet map instance, then call `L.heatLayer(points, options).addTo(map)`.
- On filter changes, remove the existing heatmap layer before adding a new one. Store the layer reference in a `useRef`.
- Verify: `npm install leaflet.heat` — the package name on npm is `leaflet.heat` (with a dot), not `leaflet-heat` (with a dash). The wrong package name is a common install mistake.

**Detection:**
- `TypeError: L.heatLayer is not a function` — plugin not loaded yet.
- Heatmap appears on first load but does not update when filter changes — layer ref not being managed.

**Phase:** Phase 3 (heatmap layer). The layer lifecycle pattern (add/remove on data change) must be explicit in the design.

**Confidence:** MEDIUM — based on training knowledge of leaflet.heat's API surface. The npm package name distinction (dot vs dash) should be verified at install time.

---

### Pitfall 5: Nominatim Returns No Results for Free-Form Brazilian Addresses

**What goes wrong:** The addresses in `crm_orders.address` come from WhatsApp conversations via n8n. They are free-form text like "Rua das Flores 123 JD América" or "vila a condor perto do mercado". Nominatim's geocoder is not tolerant of Brazilian street abbreviations, incomplete neighborhoods, or colloquial references. It returns 0 results for a significant portion of addresses.

**Why it happens:** Nominatim requires well-structured addresses to geocode accurately. Brazilian addresses often omit city, have creative spellings, or reference local landmarks that are not in OSM.

**Consequences:** A large fraction of orders have no coordinates and no pins on the map, making the heatmap meaningless for operational decisions.

**Prevention:**
- Always append `, Foz do Iguaçu, PR, Brasil` to every address before sending to Nominatim. This dramatically improves match rate for the known operating area.
- Use Nominatim's `structured` query format when possible: `street`, `city`, `state`, `country` as separate parameters.
- Store a `geocoding_status` column alongside `lat`/`lng`: values `null` (not attempted), `success`, `failed`, `manual`. This lets the system skip re-attempting known-bad addresses.
- Add a `viewbox` parameter to Nominatim requests bounded to Foz do Iguaçu's bounding box. This biases results to the correct city.
- Plan for a manual override UI in a future phase where the admin can drop a pin for failed addresses.

**Detection:**
- Geocoding API returns empty `[]` for more than 20% of addresses.
- Addresses with neighborhoods only (no street number) consistently fail.

**Phase:** Phase 2 (geocoding API route) — address normalization must be built before the geocoding loop, not after.

**Confidence:** MEDIUM — Nominatim's behavior with Brazilian Portuguese addresses is well-known to be inconsistent, but exact failure rates are environment-specific.

---

## Moderate Pitfalls

### Pitfall 6: CSS Import for Leaflet Breaks or Is Missing

**What goes wrong:** The map renders but has no visual styling — tiles appear but controls (zoom buttons, attribution) are unstyled or overlapping. Or the component throws `Module not found: Can't resolve 'leaflet/dist/leaflet.css'`.

**Why it happens:** Leaflet requires `import 'leaflet/dist/leaflet.css'` to render correctly. In a `'use client'` component this works. In a server component or if imported in the wrong scope it may fail or be ignored.

**Prevention:**
- Import `'leaflet/dist/leaflet.css'` at the top of the `'use client'` map component file, not in `layout.js` or a server component.
- Verify the CSS import is present and the map container div has an explicit height (e.g., `height: 600px` or `h-[600px]`). A map with `height: 0` or `height: auto` is invisible.

**Detection:**
- Map controls have no styling.
- Zoom +/− buttons render as plain text.
- Map container is invisible (height: 0).

**Phase:** Phase 1 (map scaffolding).

**Confidence:** HIGH

---

### Pitfall 7: Geocoding API Route Runs on Every Page Load Instead of Being Idempotent

**What goes wrong:** The map page triggers geocoding for all orders on every load, including orders that were already geocoded successfully. This hammers Nominatim, burns time, and can get the server IP temporarily blocked.

**Why it happens:** The geocoding logic does not check existing `lat`/`lng` values, or the cache-check query has a bug (e.g., checking `lat IS NULL` but not `lng IS NULL`).

**Prevention:**
- The geocoding route must query `WHERE lat IS NULL OR lng IS NULL` before building the work queue.
- After a successful geocode, immediately `UPDATE crm_orders SET lat = $1, lng = $2 WHERE id = $3` — never leave it uncached.
- The map data API (`GET /api/dashboard/mapa`) should only return orders, not trigger geocoding. Geocoding should be a separate `POST /api/dashboard/mapa/geocodificar` endpoint.

**Detection:**
- Server logs show Nominatim requests for the same address multiple times.
- Geocoding slows down every map page load.

**Phase:** Phase 2 (geocoding). Separation of concerns (read vs geocode) must be a design constraint from the start.

**Confidence:** HIGH

---

### Pitfall 8: Map Component Re-mounts on Every Filter Change, Losing Zoom/Pan State

**What goes wrong:** When the user changes the period filter (7/30/90 days), the entire map unmounts and remounts. The viewport resets to the default center and zoom, losing any pan/zoom the user had set. The map also flickers.

**Why it happens:** React re-renders the parent component on state change. If the `<MapContainer>` receives new props (e.g., `key={period}`) or is conditionally rendered, Leaflet destroys and recreates the map instance.

**Consequences:** Jarring UX — the map "resets" every time a filter is applied. For a non-technical user (the owner described in context), this feels broken.

**Prevention:**
- Do not use the `period` state as the `key` prop on `<MapContainer>`.
- Keep the map instance alive; only update the data layers (markers, heatmap) when the filter changes.
- Use `useEffect([period])` to fetch new data and update layers in-place using Leaflet's layer add/remove API.

**Detection:**
- Map scrolls back to center Foz do Iguaçu on every filter change.
- Brief white flash before map tiles reload.

**Phase:** Phase 3 (filter integration).

**Confidence:** HIGH

---

### Pitfall 9: Map Breaks in Strict Mode / React 18 Double-Invoke

**What goes wrong:** In development with React Strict Mode enabled, Leaflet throws `Map container is already initialized` on hot reload or fast refresh. The map renders once, then crashes on the second initialization.

**Why it happens:** React 18 Strict Mode in development intentionally double-invokes effects to detect side effects. Leaflet's `L.map(container)` call does not tolerate being called twice on the same DOM node.

**Consequences:** Map only visible until first hot reload in development. Does not affect production, but makes development painful.

**Prevention:**
- `react-leaflet`'s `<MapContainer>` handles this correctly internally in recent versions (v4+). Use `react-leaflet` rather than raw Leaflet imperative API for the container initialization.
- If using raw Leaflet: store the map instance in a `useRef`. In `useEffect` cleanup, call `mapRef.current?.remove()` before reinitializing.

**Detection:**
- `Uncaught Error: Map container is already initialized` in dev console after first hot reload.

**Phase:** Phase 1 (map scaffolding).

**Confidence:** MEDIUM

---

### Pitfall 10: `crm_orders.address` Has No `Foz do Iguaçu` City Component

**What goes wrong:** Orders store address as free text (from WhatsApp). Nominatim receives `"Rua X, 123, Jardim América"` without any city context and geocodes it to the wrong city or returns no results.

**Why it happens:** The existing schema stores `address` (street), `neighborhood`, and `city` as separate columns in `crm_contacts` — but `crm_orders.address` is a single free-form text field. When n8n creates an order via webhook, it may pass only the street address.

**Consequences:** Geocoding places pins in wrong Brazilian cities or fails entirely. Heatmap data is geographically incorrect.

**Prevention:**
- The geocoding API route should JOIN `crm_orders` with `crm_contacts` to get the contact's city/neighborhood when composing the geocoding query string.
- Fallback: always append `, Foz do Iguaçu, PR, Brasil` to the address string when `city` is empty or NULL in the geocoding payload.
- Add a `viewbox` bounding box for Foz do Iguaçu to the Nominatim query as a secondary constraint.

**Detection:**
- Pins appear outside Paraná state on the map.
- Geocoding returns results with `display_name` not containing `Foz do Iguaçu`.

**Phase:** Phase 2 (geocoding). Database JOIN strategy must be defined before the geocoding loop is written.

**Confidence:** HIGH — this is directly observable from the existing schema documented in CLAUDE.md and PROJECT.md.

---

## Minor Pitfalls

### Pitfall 11: OpenStreetMap Tile Attribution Is Required

**What goes wrong:** Deploying a Leaflet map with OpenStreetMap tiles without the required attribution text `© OpenStreetMap contributors` violates OSM's tile usage policy. In practice this is not automatically enforced, but it is a policy violation.

**Why it happens:** Developers remove or hide the default Leaflet attribution control to clean up the UI.

**Prevention:** Leave Leaflet's default attribution control in place. It is small and unobtrusive. The `<MapContainer>` renders it automatically with OpenStreetMap tiles.

**Phase:** Phase 1 (map scaffolding) — do not remove attribution.

**Confidence:** HIGH

---

### Pitfall 12: Heatmap Points Need Intensity Weighting

**What goes wrong:** `leaflet.heat` accepts points as `[lat, lng, intensity]`. If all points are passed with intensity `1` (or no intensity), the heatmap shows a uniform blob with no visual differentiation. Areas with 10 orders look the same as areas with 1 order when the data is sparse.

**Why it happens:** Developers pass raw coordinates without thinking about the intensity parameter.

**Prevention:**
- Group orders by geocoded address (same lat/lng) and pass the count as intensity.
- Tune `radius` and `blur` options to match Foz do Iguaçu's geographic scale — default values are tuned for large cities.

**Phase:** Phase 3 (heatmap layer).

**Confidence:** MEDIUM

---

### Pitfall 13: The Map Page Will Be Slow on First Load if Geocoding Is Synchronous

**What goes wrong:** If the `/api/dashboard/mapa` route geocodes un-geocoded orders synchronously before returning data, the first page load can take 10–30+ seconds (depending on how many un-geocoded orders exist at 1 req/s rate limit).

**Prevention:**
- The map data route should return immediately with whatever cached coordinates exist.
- Un-geocoded addresses are a separate background operation, not blocking the page response.
- Show a count of "X endereços ainda sem coordenadas" in the UI so the user understands the map may be incomplete.

**Phase:** Phase 2 (geocoding route design). Must be non-blocking from the start.

**Confidence:** HIGH

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Phase 1: Map component scaffold | `window is not defined` build crash | `dynamic(() => import(...), { ssr: false })` on the map component |
| Phase 1: Map component scaffold | Broken marker icons (404) | Apply `L.Icon.Default.mergeOptions` fix at component creation |
| Phase 1: Map component scaffold | Invisible map (height 0) | Explicit CSS height on `<MapContainer>` wrapper div |
| Phase 2: Geocoding API route | Nominatim rate limit violations | Sequential loop with 1100ms delay; never `Promise.all` |
| Phase 2: Geocoding API route | Wrong city geocoding results | Always append `, Foz do Iguaçu, PR, Brasil`; use viewbox |
| Phase 2: Geocoding API route | Re-geocoding already-cached addresses | Check `WHERE lat IS NULL` before building work queue |
| Phase 2: Geocoding API route | Slow page loads from sync geocoding | Separate geocoding endpoint from data endpoint; return cached data immediately |
| Phase 3: Heatmap layer | `L.heatLayer is not a function` | Import `leaflet.heat` inside `useEffect` after client confirms `window` exists |
| Phase 3: Heatmap layer | Heatmap not updating on filter change | Store layer ref in `useRef`, remove and recreate on data change |
| Phase 3: Filter integration | Map resets view on every filter change | Never use filter state as `key` prop on `<MapContainer>` |

---

## Sources

- react-leaflet documentation (https://react-leaflet.js.org) — SSR/dynamic import guidance (MEDIUM confidence, from training knowledge, not verified live)
- Nominatim Usage Policy (https://operations.osmfoundation.org/policies/nominatim/) — 1 req/s limit (HIGH confidence, well-established public policy)
- leaflet.heat npm package (https://www.npmjs.com/package/leaflet.heat) — API surface and integration pattern (MEDIUM confidence, from training knowledge)
- Project schema analysis — `crm_orders.address` free-form text concern derived directly from CLAUDE.md and PROJECT.md (HIGH confidence)
- CONCERNS.md — existing date handling fragility with timezone noted as existing risk that intersects with geocoding (HIGH confidence, primary source)

---

*NOTE: WebSearch and WebFetch were unavailable during this research session. All pitfalls derive from training knowledge (cutoff August 2025) about Leaflet v1.x, react-leaflet v4.x, and Nominatim. The Leaflet SSR, broken icons, and Nominatim rate limit pitfalls are well-established problems with years of community documentation — HIGH confidence. Plugin internals (leaflet.heat) are MEDIUM confidence. Validate package names and API signatures against current npm/docs before implementing.*
