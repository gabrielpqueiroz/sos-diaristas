# Phase 3: Heatmap and Filters — Research

**Researched:** 2026-03-20
**Domain:** leaflet.heat + react-leaflet v4 useMap hook + period filter state management
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAPA-04 | Usuário pode ver camada de calor mostrando concentração de atendimentos | leaflet.heat 0.2.0 API verified; HeatmapLayer component pattern using useMap() documented; import workaround for Leaflet 1.9 confirmed |
| MAPA-05 | Usuário pode filtrar dados do mapa por período (últimos 7, 30 ou 90 dias) | API query pattern with `?days=` param documented; useState filter in page.js with refetch on change; MapContainer stability pattern verified (no remount on data change) |
</phase_requirements>

---

## Summary

Phase 3 adds two capabilities to the existing map page: a heatmap layer showing density of service orders by area, and period filter buttons (7 / 30 / 90 days) that update both pins and the heatmap without resetting the map's zoom or pan position.

The critical implementation constraint is that **leaflet.heat 0.2.0 is a UMD plugin that mutates the global `L` object**. When bundled by webpack (Next.js), the standard `import L from 'leaflet'; import 'leaflet.heat'` pattern works reliably as a side-effect import because webpack preserves import order within a module. The key is the import order: `import L from 'leaflet'` must appear before `import 'leaflet.heat/dist/leaflet-heat.js'`, so the plugin finds `L` already initialized. The STATE.md concern about Leaflet 1.9 compatibility is **partially confirmed** — there is a known issue when using `import * as L from 'leaflet'` (named imports), but the project already uses `import L from 'leaflet'` (default import), which is the working pattern. No compatibility breakage applies to this project.

The heatmap layer must be created and managed via a dedicated `HeatmapLayer` child component that uses `useMap()` to access the Leaflet map instance and `useEffect + useRef` to add/remove the layer on mount/unmount and update it when `points` prop changes. This is the canonical react-leaflet v4 pattern for integrating external Leaflet plugins. It is the only correct approach that avoids the MapContainer remounting on data changes.

The period filter is implemented entirely in the page component (`mapa/page.js`) as a `useState` hook holding the selected period. The filter value is passed as a query param to the API route (`/api/dashboard/mapa?days=30`), and the API adds a `WHERE` clause on `scheduled_date`. The filter also needs to be passed as a prop to `MapComponent`, which forwards it to `HeatmapLayer` and the `Marker` list.

**Primary recommendation:** Install `leaflet.heat@0.2.0` (no other packages), create a `HeatmapLayer` client component using `useMap()` + `useEffect` + `useRef`, add period filter state to `mapa/page.js`, extend the API route with a `?days=` query parameter, and pass filter state through to the map component via props. Never put a `key` on `MapContainer` or re-create it on data change.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `leaflet.heat` | 0.2.0 (only version) | Heatmap layer on Leaflet map | Official Leaflet heatmap plugin; maintained by Leaflet core team (mourner); canvas-based, fast for small-to-medium datasets |
| `react-leaflet` | 4.2.1 (already installed) | `useMap()` hook for plugin integration | Already installed; `useMap()` is the react-leaflet v4 API for accessing map inside child components |
| `leaflet` | 1.9.4 (already installed) | Core map engine | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useState` (React) | React 18 (already installed) | Period filter state in page component | Filter selection (7/30/90 days) lives in page.js, not inside MapComponent |
| `useEffect` (React) | React 18 | Heatmap layer lifecycle | Add layer on mount, update on points change, remove on unmount |
| `useRef` (React) | React 18 | Stable reference to heatmap layer instance | Allows updating existing layer without recreating it |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `leaflet.heat` | `react-leaflet-heatmap-layer-v3` | Wrapper package targets react-leaflet v3 API; not confirmed compatible with v4; adds a dependency for something we can implement in ~25 lines |
| `leaflet.heat` | `heatmap.js` (patrick-wied) | Richer visual options but heavier; overkill for service order density visualization |
| `leaflet.heat` | Custom canvas layer | Significant custom code; leaflet.heat already handles clustering, gradient, blur correctly |

### Installation

```bash
npm install leaflet.heat
```

**Version verification (npm registry, 2026-03-20):** `leaflet.heat` has only one version: `0.2.0`. Confirmed via `npm view leaflet.heat`. No newer version exists. This is the only option available.

**No other new packages needed.** All React hooks, `leaflet`, and `react-leaflet` are already installed.

---

## Architecture Patterns

### Files Changed in This Phase

```
src/app/
├── api/dashboard/mapa/route.js        # MODIFY: add ?days= query param filter
└── dashboard/
    ├── (app)/mapa/page.js             # MODIFY: add filter state + buttons + refetch
    └── _components/
        ├── MapComponent.js            # MODIFY: accept heatPoints prop, render HeatmapLayer
        └── HeatmapLayer.js            # NEW: useMap() + useEffect + useRef layer component
```

No new pages, no new API routes, no sidebar changes.

### Pattern 1: HeatmapLayer Component — useMap + useRef + useEffect (CRITICAL)

**What:** A React component that lives inside `<MapContainer>` (as a child). It calls `useMap()` to get the Leaflet map instance, creates a `L.heatLayer`, stores it in a `useRef`, and manages the layer lifecycle in `useEffect`.

**Why this pattern:** This is the canonical react-leaflet v4 pattern for integrating Leaflet plugins. The `useMap()` hook only works inside a MapContainer descendant. Using `useRef` to store the layer instance allows updating the data (via `layer.setLatLngs()`) without destroying and re-creating the layer, which avoids visual flicker.

**leaflet.heat import fix — verified workaround for Leaflet 1.9 + webpack:**

The problem: leaflet.heat 0.2.0 is a UMD plugin that mutates the global `L` object. When bundled by webpack, if imported as `import * as L from 'leaflet'`, named exports are used and the plugin mutation is not reflected. The fix: use **default import** (`import L from 'leaflet'`) followed by a **side-effect import** of the plugin file. This is exactly how the project already imports Leaflet in `MapComponent.js` (`import L from 'leaflet'`).

```javascript
// src/app/dashboard/_components/HeatmapLayer.js
'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat/dist/leaflet-heat.js'  // side-effect: attaches L.heatLayer to L

// HeatmapLayer must be rendered as a child of <MapContainer>
// points: array of [lat, lng] or [lat, lng, intensity]
export default function HeatmapLayer({ points = [] }) {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    // Create layer on first render or if it doesn't exist
    if (!heatLayerRef.current) {
      heatLayerRef.current = L.heatLayer([], {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.4: '#1B5FA8', 0.65: '#3b82f6', 1: '#60a5fa' },  // brand colors
      }).addTo(map)
    }

    // Update layer data whenever points change
    heatLayerRef.current.setLatLngs(points)

    // Cleanup: remove layer when component unmounts
    return () => {
      if (heatLayerRef.current) {
        heatLayerRef.current.remove()
        heatLayerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points])  // re-run only when points change; map instance is stable

  return null  // this component renders nothing — it manages an imperative Leaflet layer
}
```

**Confidence:** HIGH — `useMap()` API confirmed from official react-leaflet docs; `L.heatLayer().addTo(map)` API confirmed from leaflet.heat README; `setLatLngs()` is the update method for re-rendering the heatmap without recreation; import order fix verified from Leaflet issue #8451 and community sources.

---

### Pattern 2: MapComponent — Accept heatPoints Prop + Render Both Layers

**What:** `MapComponent.js` receives both `pins` (for markers) and `heatPoints` (for the heatmap). It renders `<HeatmapLayer>` and `<Marker>` components as `<MapContainer>` children. Both layers are visible simultaneously by default.

**Key constraint:** `HeatmapLayer` must be imported via a dynamic import inside `MapComponent.js` (which is itself already inside the `dynamic({ ssr: false })` boundary set up in `mapa/page.js`). Since `MapComponent.js` is a `'use client'` component, a regular import of `HeatmapLayer.js` (also `'use client'`) works fine — no additional `dynamic()` wrapper needed inside `MapComponent`.

```javascript
// src/app/dashboard/_components/MapComponent.js (modified)
'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import HeatmapLayer from './HeatmapLayer'

// ... icon fix unchanged ...

// heatPoints: array of [lat, lng] for the heatmap
// pins: array of { id, lat, lng, address } for marker pins
export default function MapComponent({ pins = [], heatPoints = [] }) {
  return (
    <MapContainer
      center={FOZ_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer ... />
      <HeatmapLayer points={heatPoints} />
      {pins.map((pin) => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]}>
          <Popup>
            <span style={{ color: '#1a1a2e' }}>
              {pin.address || 'Endereco nao disponivel'}
            </span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

**Confidence:** HIGH — direct extension of existing MapComponent pattern from Phase 2.

---

### Pattern 3: Period Filter State in mapa/page.js

**What:** Add period filter state to the page component. The selected period (7, 30, or 90 days) is stored in `useState`. When it changes, the page refetches `/api/dashboard/mapa?days={period}`. The `MapComponent` receives both `pins` and `heatPoints` derived from the API response.

**Critical constraint:** Never use the `period` value as part of a `key` prop on the `MapComponent` or any ancestor — this would remount the `<MapContainer>` and reset zoom/pan. Only the data passed via props changes; the `<MapContainer>` instance stays alive throughout the page lifecycle.

**heatPoints extraction:** The heatmap layer uses `[lat, lng]` arrays. Extract these from the same `pins` data returned by the API — no separate heatmap data endpoint is needed.

```javascript
// src/app/dashboard/(app)/mapa/page.js (modified)
'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { BG_GRADIENT, GLASS } from '../../_components/styles'

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

const PERIOD_OPTIONS = [
  { label: 'Ultimos 7 dias', value: 7 },
  { label: 'Ultimos 30 dias', value: 30 },
  { label: 'Ultimos 90 dias', value: 90 },
]

export default function MapaPage() {
  const [period, setPeriod] = useState(30)
  const [data, setData] = useState({ pins: [], total_with_coords: 0, total_without_coords: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback((days) => {
    setLoading(true)
    fetch(`/api/dashboard/mapa?days=${days}`)
      .then(res => res.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  // Derive heatPoints from pins — same data, different format
  const heatPoints = data.pins.map(p => [p.lat, p.lng])

  return (
    <div className="p-6" style={{ background: BG_GRADIENT, minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Mapa de Atendimentos</h1>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              style={period === opt.value ? {} : { border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ height: '600px', ...GLASS }}>
        <MapComponent pins={data.pins} heatPoints={heatPoints} />
      </div>
      <div className="flex items-center gap-4 mt-4 px-2">
        <span className="text-sm text-green-400">
          {data.total_with_coords} enderecos geocodificados
        </span>
        {data.total_without_coords > 0 && (
          <span className="text-sm text-yellow-400">
            {data.total_without_coords} enderecos sem coordenada
          </span>
        )}
        {loading && (
          <span className="text-sm text-white/50">Atualizando...</span>
        )}
      </div>
    </div>
  )
}
```

**Confidence:** HIGH — `useState` + `useEffect` + `useCallback` fetch pattern matches the existing patterns in `pedidos/page.js` and `hoje/page.js`; `heatPoints` derivation is a straightforward `.map()` on existing data.

---

### Pattern 4: API Route — Add ?days= Period Filter

**What:** Extend `GET /api/dashboard/mapa` to accept an optional `?days=` query parameter. When provided, filter orders by `scheduled_date >= NOW() - INTERVAL '{days} days'`. Default to 30 days if not provided.

**Security note:** The `days` parameter must be validated and cast to an integer before use in SQL. Use `parseInt()` and whitelist to `[7, 30, 90]` to prevent SQL injection through unexpected values.

```javascript
// src/app/api/dashboard/mapa/route.js (modified)
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawDays = parseInt(searchParams.get('days'), 10)
    // Whitelist valid periods; default to 30
    const days = [7, 30, 90].includes(rawDays) ? rawDays : 30

    const pinsResult = await query(`
      SELECT id, lat, lng, status, address, scheduled_date
      FROM crm_orders
      WHERE lat IS NOT NULL
        AND status IN ('concluido', 'agendado', 'confirmado', 'diarista_atribuida', 'em_andamento')
        AND scheduled_date >= NOW() - INTERVAL '${days} days'
      ORDER BY scheduled_date DESC
    `)

    const countsResult = await query(`
      SELECT
        count(*) FILTER (WHERE lat IS NOT NULL) as with_coords,
        count(*) FILTER (WHERE lat IS NULL AND address IS NOT NULL) as without_coords
      FROM crm_orders
    `)

    const counts = countsResult.rows[0]

    return NextResponse.json({
      pins: pinsResult.rows,
      total_with_coords: parseInt(counts.with_coords, 10),
      total_without_coords: parseInt(counts.without_coords, 10),
    })
  } catch (error) {
    console.error('Error fetching mapa data:', error.message, error.stack)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do mapa', detail: error.message },
      { status: 500 }
    )
  }
}
```

**Note on SQL injection:** The `days` variable is used via string interpolation in the INTERVAL clause, but it is safe because it has been whitelisted to the set `[7, 30, 90]` — only integer values from that set can reach the SQL string. Parameterized queries cannot be used for the INTERVAL keyword directly, so the whitelist is the correct protection.

**Confidence:** HIGH — PostgreSQL `INTERVAL '30 days'` syntax confirmed standard; whitelist pattern is the established defense for this SQL pattern; existing route structure followed exactly.

---

### Anti-Patterns to Avoid

- **`key={period}` on MapComponent or MapContainer:** Using the period as a React key forces a full unmount/remount of the map every time the filter changes. This resets zoom, pan, and causes a blank map flash. The `<MapContainer>` must have a stable identity — only its children (HeatmapLayer points, Markers) change.
- **`import * as L from 'leaflet'`:** Named import does not receive the `heatLayer` mutation from leaflet.heat. Use `import L from 'leaflet'` (default import) — exactly as MapComponent.js already does.
- **Creating a new `L.heatLayer` on every render:** Calling `L.heatLayer().addTo(map)` inside a render body or without a ref causes duplicate layers to pile up on every re-render. Always store the layer instance in `useRef` and call `setLatLngs()` to update data.
- **Calling `useMap()` outside a MapContainer descendant:** `useMap()` throws if called outside the MapContainer context. `HeatmapLayer` must always be rendered as a child of `<MapContainer>`, not at the page level.
- **Passing `heatPoints` inside `data` state:** The `heatPoints` prop to `MapComponent` should be derived from `data.pins` via a `.map()` in the page component's render, not stored separately in state. Storing a derived value in state creates sync bugs.
- **Interpolating `days` in SQL without whitelisting:** If `days` were interpolated without validation, a malicious `?days=0; DROP TABLE crm_orders` would be possible. The whitelist `[7, 30, 90].includes(rawDays)` prevents this entirely.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Heatmap density visualization | Custom canvas renderer | `leaflet.heat` | Handles simpleheat clustering, canvas rendering, blur, gradient — ~1200 lines of optimized code |
| Layer add/remove lifecycle | Custom map event listeners | `useEffect` return cleanup | React's cleanup function on unmount is the correct lifecycle hook; no custom event wiring needed |
| Period state management | Complex state machine | `useState` + `useEffect` refetch | The filter is simple — one value, one effect; React Query or SWR are unnecessary overhead |
| SQL date filtering | JavaScript-side date filtering | PostgreSQL `INTERVAL` | Database-side filtering is always more efficient than fetching all data and filtering in JS |

**Key insight:** leaflet.heat is the only right tool here — it is literally the official Leaflet heatmap plugin by the same author as Leaflet. There is no better-maintained alternative for this use case.

---

## Common Pitfalls

### Pitfall 1: leaflet.heat Import Order / L.heatLayer is not a function (CRITICAL)

**What goes wrong:** `L.heatLayer is not a function` at runtime. The heatmap layer never appears.

**Why it happens:** leaflet.heat 0.2.0 is a UMD plugin that attaches `heatLayer` to the global `L` object. If `import * as L from 'leaflet'` is used (named imports), the plugin's mutation of `L` is not reflected in the local `L` variable. A second cause is import order — leaflet.heat must be imported after leaflet.

**How to avoid:**
1. Use `import L from 'leaflet'` (default import) — this is already the pattern in `MapComponent.js`
2. Import leaflet.heat after: `import 'leaflet.heat/dist/leaflet-heat.js'` (side-effect import, no binding needed)
3. Both imports must be in `HeatmapLayer.js`, which is inside the `dynamic({ ssr: false })` boundary

**Warning signs:** Console error `L.heatLayer is not a function`; no heatmap visible on map even though `points` prop is non-empty.

**Confidence:** HIGH — confirmed from GitHub issue #8451 and Leaflet/Leaflet.heat issue #122.

---

### Pitfall 2: MapContainer Remount on Filter Change

**What goes wrong:** Changing the period filter causes the map to go blank for a moment and reset to the default center/zoom (Foz do Iguacu, zoom 13). User loses their zoom/pan position.

**Why it happens:** If the period value is used as a `key` on any ancestor of `<MapContainer>`, React unmounts and remounts the entire map. Even if `key` is not used directly, wrapping `MapComponent` in a component that changes `key` has the same effect.

**How to avoid:** Period state lives only in `mapa/page.js`. The `MapComponent` receives `pins` and `heatPoints` as props. When these props change, React re-renders `MapComponent` and its children (`HeatmapLayer`, markers) — but does NOT remount `<MapContainer>` because its `key` is stable (it has no `key` prop). The `HeatmapLayer` calls `heatLayerRef.current.setLatLngs(newPoints)` which updates the layer in-place without remounting.

**Warning signs:** Map flashes blank/white when switching filter periods; map position resets to `FOZ_CENTER` after each filter change.

---

### Pitfall 3: Duplicate Heatmap Layers Stacking

**What goes wrong:** Multiple heatmap layers appear on the map, progressively darkening the canvas with each data update, making the heatmap look increasingly intense even when data doesn't change.

**Why it happens:** Creating a new `L.heatLayer().addTo(map)` on every render (without `useRef`) adds a new layer on top of the previous one without removing the old one.

**How to avoid:** Use `useRef` to store the single layer instance. On first render (`!heatLayerRef.current`), create and add the layer. On subsequent renders, call `setLatLngs(points)` on the existing layer. The `useEffect` cleanup removes the layer only when the component unmounts.

**Warning signs:** Heatmap colors become increasingly intense with each filter switch; DevTools shows multiple canvas elements overlapping.

---

### Pitfall 4: useMap() Called Outside MapContainer Context

**What goes wrong:** `Uncaught Error: No MapContext.Provider found` — the `useMap()` hook throws because it cannot find a MapContainer ancestor.

**Why it happens:** `HeatmapLayer` is imported and used in a place that is not a descendant of `<MapContainer>`. For example, if it is imported at the page level rather than inside `MapComponent`.

**How to avoid:** `HeatmapLayer` must only ever be rendered as a child inside `<MapContainer>`. In this architecture, it is rendered inside `MapComponent.js` which itself is always rendered inside a `<MapContainer>`. Do not extract it to the page level.

**Warning signs:** `useMap` error on page load; HeatmapLayer component never renders.

---

### Pitfall 5: Empty Map When period Changes (Loading Flash)

**What goes wrong:** While new data loads after a filter change, the map shows zero markers and an empty heatmap — a jarring visual where all pins disappear momentarily.

**Why it happens:** If `setData({ pins: [], ... })` is called before the new fetch completes, the map is briefly empty.

**How to avoid:** Do NOT reset `data` to an empty state before the new fetch completes. Keep the previous data visible while loading, only replacing it once the new fetch succeeds. The `loading` flag shows a text indicator ("Atualizando...") without clearing the map data.

**Warning signs:** Pins and heatmap disappear for 200-500ms on each filter change.

---

## Code Examples

### HeatmapLayer: Full Working Component

```javascript
// src/app/dashboard/_components/HeatmapLayer.js
// Source: react-leaflet v4 useMap API + leaflet.heat 0.2.0 README
'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat/dist/leaflet-heat.js'

export default function HeatmapLayer({ points = [] }) {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (!heatLayerRef.current) {
      heatLayerRef.current = L.heatLayer([], {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: { 0.4: '#1B5FA8', 0.65: '#3b82f6', 1: '#60a5fa' },
      }).addTo(map)
    }
    heatLayerRef.current.setLatLngs(points)
    return () => {
      if (heatLayerRef.current) {
        heatLayerRef.current.remove()
        heatLayerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points])

  return null
}
```

### leaflet.heat Layer Options Reference (verified from README)

```javascript
L.heatLayer(points, {
  minOpacity: 0.05,      // minimum opacity of the heatmap (default: 0.05)
  maxZoom: 17,           // zoom level where points reach maximum intensity (default: 18)
  max: 1.0,              // maximum point intensity (default: 1.0)
  radius: 25,            // point radius (default: 25)
  blur: 15,              // blur amount (default: 15)
  gradient: {            // color gradient config (default: blue-cyan-red)
    0.4: 'blue',
    0.65: 'lime',
    1: 'red'
  }
})

// Methods:
layer.addTo(map)           // add to map
layer.remove()             // remove from map
layer.setLatLngs(points)  // update data; triggers re-render
layer.addLatLng([lat, lng, intensity])  // add single point
```

### PostgreSQL Date Filter with INTERVAL

```sql
-- Filter orders from last N days (N already validated to 7/30/90)
WHERE scheduled_date >= NOW() - INTERVAL '30 days'
-- Source: PostgreSQL docs on date/time functions
-- Note: scheduled_date is DATE type in crm_orders schema
```

### Layer Toggle — Optional Enhancement Pattern

The user preference confirmed in the additional context says "both layers visible simultaneously, with toggle buttons to show/hide each layer independently." If toggle buttons are needed, the pattern is:

```javascript
// In page.js — layer visibility state
const [showHeatmap, setShowHeatmap] = useState(true)
const [showPins, setShowPins] = useState(true)

// Pass down to MapComponent:
<MapComponent
  pins={showPins ? data.pins : []}
  heatPoints={showHeatmap ? heatPoints : []}
/>
```

This avoids unmounting/remounting layers — passing an empty array to `setLatLngs([])` hides the heatmap cleanly; passing `[]` to the pins `.map()` renders no markers.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-leaflet v3 class components for plugins | react-leaflet v4 `useMap()` hook in functional components | 2022 | Simpler, no lifecycle methods, works with React 18 hooks |
| `import * as L from 'leaflet'` | `import L from 'leaflet'` (default import) | Leaflet 1.9 | Default import preserves plugin mutation; named imports do not |
| Polling/auto-refresh for filter | Event-driven refetch on filter change | Ongoing best practice | No polling needed; refetch only when user changes filter |

**Deprecated/outdated:**
- `react-leaflet-heatmap-layer` (OpenGov): Targets react-leaflet v2/v3 class API. Not compatible with v4 hooks API. Do not use.
- `react-leaflet-heatmap-layer-v3`: Targets react-leaflet v3. Compatibility with v4 is not confirmed. Do not use — the custom `HeatmapLayer` component is 25 lines and has no external dependency risk.

---

## Open Questions

1. **leaflet.heat performance with small datasets**
   - What we know: leaflet.heat uses simpleheat internally, which clusters points into a grid. For small datasets (< 500 points), no performance concerns exist.
   - What's unclear: The actual number of geocoded orders in production after Phase 2 backfill. If > 5000, consider `max` and `blur` tuning.
   - Recommendation: Start with `radius: 25, blur: 15` (defaults). If the heatmap looks too diffuse with few points, increase `minOpacity` to `0.3` and reduce `radius` to `20`.

2. **scheduled_date filtering: DATE vs TIMESTAMPTZ**
   - What we know: `crm_orders.scheduled_date` is `DATE` type (from schema in CLAUDE.md). `NOW() - INTERVAL '30 days'` returns a TIMESTAMPTZ. PostgreSQL will cast the DATE column for comparison automatically.
   - What's unclear: Whether all orders have a `scheduled_date` (nullable). Orders with `NULL` scheduled_date will be excluded by the WHERE clause.
   - Recommendation: The WHERE clause is correct — `scheduled_date >= NOW() - INTERVAL '${days} days'` implicitly excludes NULL rows (NULL comparisons always return false in SQL). This is the desired behavior: orders without a scheduled date should not appear on the time-filtered map.

3. **Heatmap gradient colors for dark map theme**
   - What we know: The project uses CartoDB Dark Matter tiles (very dark background). The default leaflet.heat gradient (blue-lime-red) may not be ideal visually.
   - What's unclear: The ideal gradient for maximum readability on dark tiles.
   - Recommendation: Use brand colors `{ 0.4: '#1B5FA8', 0.65: '#3b82f6', 1: '#60a5fa' }` as a starting point. This creates a blue-density visualization consistent with the dashboard theme. Can be adjusted visually after first render.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected in project |
| Config file | None — no test runner installed |
| Quick run command | `npm run build` |
| Full suite command | `npm run build && npm run dev` (manual smoke test in browser) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAPA-04 | Heatmap layer visible on map with color density | smoke (visual) | manual-only — canvas rendering is not assertable in unit tests | ❌ Wave 0 (no gap — manual only) |
| MAPA-05 | Filter buttons update pins + heatmap without map remount | smoke (manual interaction) | manual-only — requires browser interaction, zoom/pan state verification | ❌ Wave 0 (no gap — manual only) |

**Justification for manual-only:** Both requirements are visual and interactive. MAPA-04 requires visual inspection of a canvas heatmap element. MAPA-05 requires setting zoom/pan, switching filters, and verifying zoom/pan is preserved — not automatable without a full E2E test framework. `npm run build` verifies there are no SSR/import errors. Manual smoke testing is the correct gate.

### Sampling Rate

- **Per task commit:** `npm run build` — verifies no SSR/window errors, no import failures
- **Per wave merge:** `npm run build` + manual browser verification at `/dashboard/mapa`
- **Phase gate (success criteria check):**
  1. Heatmap visible on map with color density over pins
  2. Switch from 30 days to 7 days — verify pins and heatmap update, zoom/pan NOT reset
  3. Switch from 7 days to 90 days — verify same stability

### Wave 0 Gaps

None — no new test files needed. The existing pattern of `npm run build` + manual smoke test covers this phase. No automated test framework is present in the project (same as Phases 1 and 2).

---

## Sources

### Primary (HIGH confidence)

- `npm view leaflet.heat` (2026-03-20) — confirmed version 0.2.0 (only version), no peer dependencies listed
- `https://github.com/Leaflet/Leaflet.heat` — API: `L.heatLayer(points, options)`, `setLatLngs()`, option names verified
- `https://react-leaflet.js.org/docs/api-map/` — `useMap()` returns `L.Map` instance, must be called inside MapContainer descendant
- `https://github.com/Leaflet/Leaflet/issues/8451` — confirmed: Leaflet 1.9 + `import * as L` breaks leaflet.heat; fix is `import L from 'leaflet'` (default import)
- `package.json` (project) — confirmed leaflet 1.9.4, react-leaflet 4.2.1, React 18 installed; leaflet.heat not yet installed
- `src/app/dashboard/_components/MapComponent.js` — confirmed uses `import L from 'leaflet'` (default import) — compatible import pattern already in place
- `src/app/dashboard/(app)/mapa/page.js` — confirmed current page structure, state pattern, dynamic import boundary
- `src/app/api/dashboard/mapa/route.js` — confirmed route structure, query pattern, response shape

### Secondary (MEDIUM confidence)

- `https://github.com/Leaflet/Leaflet.heat/issues/122` — community-verified: script load order and import default vs named cause L.heatLayer undefined
- `https://leaflet.nuxtjs.org/guide/heat` — confirms global Leaflet requirement for leaflet.heat; `import L from 'leaflet'` + side-effect import pattern
- Community patterns for `useMap() + useEffect + useRef` for external Leaflet plugin integration — multiple consistent sources (react-leaflet GitHub issues, Medium articles)

### Tertiary (LOW confidence)

- leaflet.heat gradient color recommendations — training knowledge; visual result must be verified in browser
- Performance characteristics of leaflet.heat with large datasets — general knowledge; specific threshold untested against production data

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry verified; one package to install (leaflet.heat 0.2.0)
- Architecture: HIGH — derived directly from reading live source files + official react-leaflet docs
- leaflet.heat import fix: HIGH — confirmed from Leaflet GitHub issue #8451; existing MapComponent already uses compatible import
- Pitfalls: HIGH — Pitfall 1 (import order) and Pitfall 2 (MapContainer key) verified from official sources; Pitfall 3-5 are logical consequences of the architecture
- Heatmap gradient colors: LOW — visual preference, needs adjustment after first render

**Research date:** 2026-03-20
**Valid until:** 2026-09-20 (leaflet.heat 0.2.0 has not been updated since 2015; react-leaflet v4 is stable; no movement expected)

**Key constraint to communicate to planner:**
1. `import 'leaflet.heat/dist/leaflet-heat.js'` must appear AFTER `import L from 'leaflet'` in `HeatmapLayer.js`
2. Never use filter `period` as a `key` prop on `MapComponent` or any ancestor — this remounts the map
3. `HeatmapLayer` must be rendered inside `<MapContainer>`, not at the page level
4. `heatPoints` should be derived from `data.pins` in the page render, not stored separately in state
