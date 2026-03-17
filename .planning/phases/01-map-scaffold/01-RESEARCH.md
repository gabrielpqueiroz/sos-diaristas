# Phase 1: Map Scaffold — Research

**Researched:** 2026-03-17
**Domain:** Leaflet + react-leaflet integration in Next.js 14 App Router (React 18)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAPA-01 | User can see a real map of Foz do Iguacu with dark tiles (CartoDB Dark Matter) in the dashboard | CartoDB Dark Matter tile URL documented; Leaflet TileLayer pattern confirmed |
| MAPA-02 | User can navigate the map with zoom and pan interactively | react-leaflet MapContainer provides zoom/pan out of the box; no extra code needed |
| MAPA-06 | New "Mapa" page accessible in the dashboard sidebar | navItems array pattern in layout.js confirmed; MapIcon SVG pattern confirmed |
</phase_requirements>

---

## Summary

Phase 1 installs Leaflet and react-leaflet, creates a minimal `/dashboard/mapa` page with a dark-tiled interactive map of Foz do Iguacu, and wires it into the existing sidebar navigation. No geocoding, no pins, no heatmap — just scaffold.

The critical integration constraint is that **react-leaflet v5 (the current `latest` npm tag) requires React 19**, which this project does not use. The project is on React 18 (`"react": "^18"` in package.json). Installation must pin to `react-leaflet@4.2.1` explicitly or npm will silently install v5 and fail peer dependency resolution.

The SSR incompatibility (Leaflet references `window` at import time) must be addressed from the first line of code. The canonical `dynamic(() => import(...), { ssr: false })` pattern is well-understood, high-confidence, and non-negotiable for Next.js App Router.

**Primary recommendation:** Install `leaflet@1.9.4 react-leaflet@4.2.1`, create `MapComponent.js` as a `'use client'` component with Leaflet CSS import, icon fix, and CartoDB Dark Matter tile; import it in `mapa/page.js` via `dynamic(..., { ssr: false })`; add `MapIcon` to `icons.js`; add nav entry to `layout.js`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `leaflet` | 1.9.4 (latest 1.x) | Core map engine | Mature open-source map library; no API key; works with any tile provider; 40kb gzipped |
| `react-leaflet` | 4.2.1 (React 18 max) | React wrapper for Leaflet | Official React integration; v4 targets React 18; provides MapContainer, TileLayer, useMap hook |

### Version Verification (npm registry, 2026-03-17)

| Package | Verified Version | Notes |
|---------|-----------------|-------|
| `leaflet` | 1.9.4 | Confirmed via `npm view leaflet version` |
| `react-leaflet` | 4.2.1 | MUST pin to v4. `latest` tag is 5.0.0 which requires React 19 — installing without a version pin will break peer deps on this React 18 project |
| `leaflet.heat` | 0.2.0 | Only version available; needed for Phase 3 but NOT Phase 1 — do not install in this phase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CartoDB Dark Matter tiles | OpenStreetMap standard tiles | OSM tiles are light-themed; CartoDB Dark Matter matches dashboard dark theme — no tradeoff, both are free |
| react-leaflet v4 | Mapbox GL JS | Requires paid API key; out of scope per project decisions |
| react-leaflet v4 | Google Maps JS | Requires billing; explicitly ruled out in STATE.md |

### Installation

```bash
npm install leaflet react-leaflet@4.2.1
```

**Do NOT install `@types/leaflet` or `@types/react-leaflet`** — this project is JavaScript only. Type packages are irrelevant and add dead weight.

**Do NOT install `leaflet.heat`** in Phase 1 — the heatmap layer is Phase 3 scope.

---

## Architecture Patterns

### Recommended File Structure for This Phase

```
src/
├── app/
│   ├── dashboard/
│   │   ├── (app)/
│   │   │   ├── mapa/
│   │   │   │   └── page.js          # NEW: /dashboard/mapa page
│   │   │   └── layout.js            # MODIFY: add MapIcon to navItems
│   │   └── _components/
│   │       ├── MapComponent.js      # NEW: 'use client' Leaflet wrapper
│   │       ├── icons.js             # MODIFY: add MapIcon export
│   │       └── styles.js            # no changes
```

### Pattern 1: Dynamic Import with ssr: false (CRITICAL)

**What:** The page file uses `next/dynamic` to import the map component only in the browser. The map component itself is a separate file marked `'use client'`.

**When to use:** Any time a library accesses `window`, `document`, or `navigator` on module load. Leaflet does this — it is a hard requirement.

```javascript
// src/app/dashboard/(app)/mapa/page.js
'use client'

import dynamic from 'next/dynamic'
import { BG_GRADIENT } from '../../_components/styles'

const MapComponent = dynamic(
  () => import('../../_components/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center" style={{ height: '600px' }}>
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }
)

export default function MapaPage() {
  return (
    <div className="p-6" style={{ background: BG_GRADIENT, minHeight: '100vh' }}>
      <h1 className="text-2xl font-bold text-white mb-6">Mapa de Atendimentos</h1>
      <div className="rounded-2xl overflow-hidden" style={{ height: '600px' }}>
        <MapComponent />
      </div>
    </div>
  )
}
```

**Confidence:** HIGH — canonical Next.js + Leaflet pattern, documented in react-leaflet FAQ.

---

### Pattern 2: MapComponent — 'use client' with Icon Fix

**What:** The actual Leaflet component lives in `_components/MapComponent.js`. It is a standard client component. It imports `leaflet/dist/leaflet.css` and applies the default icon fix.

**Critical:** The icon fix must happen before any `<Marker>` is rendered. Phase 1 has no markers yet, but baking the fix in at scaffold time prevents a broken-marker surprise in Phase 2.

```javascript
// src/app/dashboard/_components/MapComponent.js
'use client'

import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix broken default marker icons in webpack/Next.js bundling
// Must run before any L.marker() or <Marker> is used
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Foz do Iguacu geographic center
const FOZ_CENTER = [-25.5163, -54.5854]
const DEFAULT_ZOOM = 13

export default function MapComponent() {
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
    </MapContainer>
  )
}
```

**Confidence:** HIGH — CartoDB tile URL is the standard dark tile URL; Leaflet icon fix pattern is documented across the ecosystem.

**Why CDN URLs for icon fix rather than copying files to /public:** Phase 1 is scaffold only; Phase 2 will add actual markers. Using CDN URLs for the fix avoids a file-copy step in Phase 1. Either approach (CDN or `/public/leaflet/`) is valid.

---

### Pattern 3: MapIcon SVG for Sidebar

**What:** Add a `MapIcon` to `icons.js` following the exact same SVG component pattern already used for every other icon. All existing icons use `width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"`.

```javascript
// Add to src/app/dashboard/_components/icons.js
export function MapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}
```

**Confidence:** HIGH — exact pattern match to existing icons in the file.

---

### Pattern 4: Sidebar navItems Entry

**What:** Add a new entry to the `navItems` array in `layout.js`. The array drives the entire sidebar — no other changes to layout.js are needed.

```javascript
// Modify src/app/dashboard/(app)/layout.js

// 1. Add to imports:
import { ..., MapIcon } from '../_components/icons'

// 2. Add to navItems array (insert after 'relatorios', before 'config'):
{ id: 'mapa', label: 'Mapa', href: '/dashboard/mapa', icon: <MapIcon /> },
```

**Positioning:** Place the Mapa entry between Relatórios and Configurações in the nav. This follows the existing order: operational tools first (Hoje, Visão Geral, Contatos, Pedidos, Calendário, Diaristas), then analytics/reporting (Relatórios, Mapa), then settings.

**Confidence:** HIGH — `navItems` array structure is directly visible in the source. The `isActive` function in layout.js handles the active state via `pathname.startsWith(href)`, so `/dashboard/mapa` will highlight correctly.

---

### Anti-Patterns to Avoid

- **Direct Leaflet import in server component:** `import L from 'leaflet'` at the top of `mapa/page.js` without `dynamic` wrapping causes `window is not defined` crash at build time. Always keep Leaflet imports inside the `'use client'` component file only.
- **`react-leaflet` without version pin:** `npm install react-leaflet` installs v5.0.0 (React 19 required). This project is React 18. Always pin: `react-leaflet@4.2.1`.
- **MapContainer without explicit height:** `<MapContainer style={{ height: '100%' }}>` inside a div with no explicit height results in a zero-height invisible map. The parent div must have an explicit pixel height.
- **Missing `leaflet/dist/leaflet.css` import:** Without the CSS, map zoom controls render as unstyled text, tile layers overlap incorrectly, and attribution overlaps content. Import it in the `'use client'` component file.
- **Removing attribution:** CartoDB tiles require the `© OpenStreetMap contributors © CARTO` attribution. Leave Leaflet's built-in attribution control in place.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive tile map with zoom/pan | Custom canvas tile renderer | `leaflet` + `react-leaflet` | Leaflet handles tile fetching, viewport math, touch events, zoom animation, accessibility |
| Dark map tiles | Custom tile server | CartoDB Dark Matter tile URL | Free CDN, covers all zoom levels globally, no API key |
| SSR-safe dynamic import | Custom module loading | `next/dynamic` with `ssr: false` | Built-in Next.js solution; handles hydration, loading states, chunk splitting |
| SVG map icon for sidebar | New icon library | Inline SVG (matches existing pattern) | Project uses zero icon libraries; all icons are inline SVG components in `icons.js` |

---

## Common Pitfalls

### Pitfall 1: react-leaflet v5 installed instead of v4 (CRITICAL for this project)

**What goes wrong:** `npm install react-leaflet` (without a version) installs v5.0.0. v5 has `peerDependencies: { react: "^19.0.0" }`. This project uses React 18. npm may warn but still install; the app then fails with React API incompatibility at runtime.

**Why it happens:** The `latest` dist-tag on npm for react-leaflet is `5.0.0` as of 2026-03-17 (verified).

**How to avoid:** Always use `npm install react-leaflet@4.2.1` — the explicit version pin.

**Warning signs:** `npm install` output shows react-leaflet@5.x; peer dependency warnings about React version.

---

### Pitfall 2: `window is not defined` at Build Time

**What goes wrong:** Leaflet crashes Next.js SSR because it accesses `window` at module load time.

**Why it happens:** Next.js 14 App Router renders all components server-side unless explicitly opted out.

**How to avoid:** Two guards required together:
1. `MapComponent.js` must have `'use client'` as the first line
2. `mapa/page.js` must import MapComponent via `dynamic(..., { ssr: false })`

**Warning signs:** Build fails with `ReferenceError: window is not defined`; only manifests in `npm run build`, not always in `npm run dev`.

---

### Pitfall 3: Broken Marker Icons (404 on PNG Assets)

**What goes wrong:** Default Leaflet marker icons show as broken images. Console shows 404 for `marker-icon.png`.

**Why it happens:** Leaflet resolves icon URLs relative to the CSS file path, which breaks in webpack bundlers.

**How to avoid:** Apply the `L.Icon.Default.mergeOptions` fix with explicit absolute URLs (CDN or `/public/leaflet/` copies) in the map component, before any marker is rendered.

**Warning signs:** Map renders but pins are broken images. This will manifest in Phase 2 when markers are added — bake the fix into Phase 1 to avoid a Phase 2 surprise.

---

### Pitfall 4: Zero-Height Map Container

**What goes wrong:** Map renders as a zero-height invisible element.

**Why it happens:** `<MapContainer style={{ height: '100%' }}>` requires the parent element chain to have explicit heights defined. CSS `height: 100%` is only as tall as its parent.

**How to avoid:** Set an explicit pixel height on the wrapper div in `mapa/page.js`:
```jsx
<div className="rounded-2xl overflow-hidden" style={{ height: '600px' }}>
  <MapComponent />
</div>
```
AND set `style={{ height: '100%', width: '100%' }}` on the `<MapContainer>`.

---

### Pitfall 5: CartoDB Tile URL Subdomains Missing

**What goes wrong:** Map shows blank gray tiles or 404 tile errors.

**Why it happens:** CartoDB dark tiles use `{s}` subdomain rotation and require the `subdomains="abcd"` prop on `<TileLayer>`. Omitting `subdomains` leaves `{s}` unreplaced in the URL.

**How to avoid:** Always include `subdomains="abcd"` on the CartoDB TileLayer.

---

## Code Examples

### CartoDB Dark Matter TileLayer (verified URL pattern)

```javascript
// Source: https://github.com/CartoDB/basemap-styles
<TileLayer
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  subdomains="abcd"
  maxZoom={20}
/>
```

The `{r}` placeholder enables retina tile delivery (appends `@2x` on HiDPI screens). Include it.

### Full MapComponent (scaffold, no markers yet)

```javascript
'use client'

import { MapContainer, TileLayer } from 'react-leaflet'
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

export default function MapComponent() {
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
    </MapContainer>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-leaflet v3 (React 16/17) | react-leaflet v4 (React 18) | 2022 | v4 uses hooks API (`useMap`, `useMapEvents`); v3 class-based API deprecated |
| react-leaflet v4 (React 18) | react-leaflet v5 (React 19) | ~2024-2025 | v5 drops React 18 support — irrelevant for this project until React is upgraded |
| Copying marker PNGs to /public | CDN URL for icon fix | Ongoing | Both work; CDN is simpler for initial scaffold; /public copy is more self-contained |

**Deprecated/outdated:**
- `react-leaflet@3.x`: Uses class-based components and older context API. Do not use.
- `react-leaflet@5.x` with this project: Requires React 19. This project uses React 18 — install v4.2.1.

---

## Open Questions

1. **`{r}` retina placeholder in CartoDB URL**
   - What we know: The `{r}` placeholder is standard for CartoDB tiles and enables `@2x` retina images
   - What's unclear: Whether react-leaflet's `<TileLayer>` passes `{r}` through or requires custom configuration
   - Recommendation: Include `{r}` in the URL — Leaflet itself handles retina detection and substitutes `@2x` when appropriate. If tiles render incorrectly, remove `{r}` as a fallback.

2. **`MapContainer` and React 18 Strict Mode double-invoke**
   - What we know: react-leaflet v4 handles the "map container already initialized" error internally for `<MapContainer>`, unlike raw Leaflet imperative API
   - What's unclear: Whether dev hot-reload with Strict Mode still causes issues in v4.2.1
   - Recommendation: Use `<MapContainer>` (not `L.map()`) — react-leaflet v4 abstracts the lifecycle correctly. If dev hot-reload shows issues, they will not appear in production.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected in project |
| Config file | None — Wave 0 must address |
| Quick run command | N/A until Wave 0 setup |
| Full suite command | N/A until Wave 0 setup |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAPA-01 | Map page renders CartoDB dark tiles | smoke (visual) | manual-only — tile rendering is visual, not assertable in unit tests | ❌ Wave 0 |
| MAPA-02 | Map container mounts with zoom/pan interactive | smoke (DOM) | manual-only — requires browser interaction testing | ❌ Wave 0 |
| MAPA-06 | /dashboard/mapa exists and is reachable via sidebar | smoke (DOM) | manual-only — requires browser navigation | ❌ Wave 0 |

**Justification for manual-only:** Phase 1 requirements are entirely visual/interactive rendering requirements (map tiles, sidebar link). These are appropriately verified by manual smoke testing in the browser. A unit test asserting "MapComponent renders a div" would test nothing meaningful about MAPA-01/02/06. No automated test framework is currently present in the project.

### Sampling Rate

- **Per task commit:** `npm run build` — verifies no SSR/window errors at build time
- **Per wave merge:** `npm run build && npm run dev` (manual smoke test in browser)
- **Phase gate:** Manual verification: map visible at `/dashboard/mapa`, tiles dark-themed, sidebar entry present and active

### Wave 0 Gaps

- [ ] No test framework present — project has zero test infrastructure
- [ ] For this phase, `npm run build` is the only automated verification gate
- [ ] Manual smoke test checklist needed before phase is marked complete

*(No automated test files to create — the phase has no logic to unit test, only visual rendering to manually verify)*

---

## Sources

### Primary (HIGH confidence)

- `npm view react-leaflet version` (2026-03-17) — confirmed v5.0.0 as latest, v4.2.1 as React 18 max
- `npm view react-leaflet@4 peerDependencies` (2026-03-17) — confirmed React 18 peer dep requirement for v4.x
- `npm view leaflet version` (2026-03-17) — confirmed 1.9.4 as current latest
- `npm view leaflet.heat version` (2026-03-17) — confirmed 0.2.0 (not needed in Phase 1)
- `src/app/dashboard/(app)/layout.js` — confirmed navItems array structure, import patterns
- `src/app/dashboard/_components/icons.js` — confirmed SVG icon pattern (width=15, height=15, stroke)
- `package.json` — confirmed React 18, no TypeScript, no existing map dependencies
- `.planning/research/STACK.md` — confirmed technology decisions and SSR pattern
- `.planning/research/ARCHITECTURE.md` — confirmed file structure and component boundaries
- `.planning/research/PITFALLS.md` — confirmed pitfall catalog
- CartoDB basemap styles: `https://github.com/CartoDB/basemap-styles` — dark_all tile URL pattern

### Secondary (MEDIUM confidence)

- react-leaflet v4 docs pattern: `dynamic(() => import(...), { ssr: false })` — well-established community pattern for Next.js + Leaflet integration
- CartoDB Dark Matter `{r}` retina placeholder behavior — training knowledge, not verified against current CartoDB docs

### Tertiary (LOW confidence)

- None for this phase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry verified, peer deps confirmed
- Architecture: HIGH — file structure derived directly from reading live source files
- Pitfalls: HIGH for SSR/icon/version issues (canonical, documented); MEDIUM for retina tile behavior

**Research date:** 2026-03-17
**Valid until:** 2026-09-17 (Leaflet ecosystem is stable; react-leaflet v4 is not moving)

**Key constraint to communicate to planner:** `react-leaflet@4.2.1` MUST be pinned explicitly. The `latest` npm tag resolves to v5.0.0 (React 19 only). A plain `npm install react-leaflet` will install the wrong version for this project.
