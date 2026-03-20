---
phase: 03-heatmap-and-filters
plan: 01
subsystem: ui
tags: [leaflet, react-leaflet, heatmap, leaflet.heat, next.js, postgresql]

# Dependency graph
requires:
  - phase: 02-geocoding-infrastructure
    provides: lat/lng columns on crm_orders, geocoded order data for heatmap points
provides:
  - Heatmap layer (leaflet.heat) overlaid on map with brand-blue density gradient
  - Period filter buttons (7/30/90 days) that update pins + heatmap without map remount
  - Independent layer toggle buttons for Camada de Calor and Pins
  - API route /api/dashboard/mapa with ?days= query param and SQL INTERVAL filter
affects: []

# Tech tracking
tech-stack:
  added:
    - leaflet.heat 0.2.0 (only version — UMD plugin for L.heatLayer)
  patterns:
    - HeatmapLayer child component pattern: useMap() + useRef + useEffect for external Leaflet plugin lifecycle
    - Layer toggle via empty array props (setLatLngs([]) / empty .map()) — avoids unmount/remount
    - heatPoints derived from data.pins in render, not stored in separate state
    - export const dynamic = 'force-dynamic' required for API routes that read request.url

key-files:
  created:
    - src/app/dashboard/_components/HeatmapLayer.js
  modified:
    - src/app/dashboard/_components/MapComponent.js
    - src/app/dashboard/(app)/mapa/page.js
    - src/app/api/dashboard/mapa/route.js

key-decisions:
  - "leaflet.heat import order: import L from 'leaflet' MUST precede import 'leaflet.heat/dist/leaflet-heat.js' — side-effect import attaches L.heatLayer to global L; using import * as L breaks this"
  - "HeatmapLayer uses useRef to store layer instance; calls setLatLngs() to update data instead of recreating layer — prevents duplicate layer stacking"
  - "No key prop on MapComponent or any ancestor — MapContainer stays mounted across period filter changes, preserving zoom/pan state"
  - "export const dynamic = 'force-dynamic' added to mapa route — Next.js 14 requires this when route reads request.url (searchParams)"
  - "days whitelist [7,30,90] before SQL interpolation — prevents SQL injection in INTERVAL clause"

patterns-established:
  - "Pattern: useMap() + useRef + useEffect for integrating external Leaflet plugins in react-leaflet v4"
  - "Pattern: layer visibility via empty array props — pass [] to hide, full array to show; avoids component unmount"

requirements-completed: [MAPA-04, MAPA-05]

# Metrics
duration: 15min
completed: 2026-03-20
---

# Phase 3 Plan 01: Heatmap and Filters Summary

**Heatmap overlay (leaflet.heat brand-blue gradient) + 7/30/90-day period filter + independent layer toggles on the map page, all without MapContainer remount**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-20T18:03:43Z
- **Completed:** 2026-03-20T18:18:00Z
- **Tasks:** 2 auto tasks completed + 1 checkpoint (human-verify pending)
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Created HeatmapLayer.js using react-leaflet v4 useMap() + useRef + useEffect pattern — renders brand-blue density overlay on CartoDB dark tiles
- Extended /api/dashboard/mapa with ?days= query param (whitelist [7,30,90], default 30) and PostgreSQL INTERVAL filter
- Updated MapComponent to accept heatPoints prop and render HeatmapLayer as MapContainer child
- Rewrote mapa/page.js with period filter buttons, layer toggle buttons, and refetch-on-period-change without map remount

## Task Commits

Each task was committed atomically:

1. **Task 1: Install leaflet.heat + create HeatmapLayer + extend API route** - `a1b8b90` (feat)
2. **Task 2: Wire MapComponent + page with heatmap, period filter, layer toggles** - `518b918` (feat)

## Files Created/Modified
- `src/app/dashboard/_components/HeatmapLayer.js` - New: useMap() + useRef + useEffect heatmap layer component
- `src/app/dashboard/_components/MapComponent.js` - Modified: added HeatmapLayer import + heatPoints prop
- `src/app/dashboard/(app)/mapa/page.js` - Modified: period filter state + toggle buttons + refetch logic
- `src/app/api/dashboard/mapa/route.js` - Modified: added ?days= param with whitelist + INTERVAL SQL filter + force-dynamic

## Decisions Made
- Used default `import L from 'leaflet'` (not named import) — critical for leaflet.heat UMD plugin to attach L.heatLayer correctly
- heatPoints derived from data.pins via `.map()` in render, not stored in separate state — avoids sync bugs between pins and heatPoints
- Layer toggles pass empty arrays `[]` instead of mounting/unmounting HeatmapLayer — setLatLngs([]) clears heatmap cleanly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added export const dynamic = 'force-dynamic' to mapa API route**
- **Found during:** Task 2 verification (build check)
- **Issue:** Extending GET() to accept request parameter and reading `request.url` via `new URL(request.url)` caused Next.js 14 to throw "Dynamic server usage" during static page generation — the route was previously static (no params)
- **Fix:** Added `export const dynamic = 'force-dynamic'` to route.js to opt out of static rendering for this route
- **Files modified:** src/app/api/dashboard/mapa/route.js
- **Verification:** `npm run build` — mapa route no longer appears in "Dynamic server usage" errors
- **Committed in:** 518b918 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for the route to work correctly with query params in Next.js 14. No scope creep.

## Issues Encountered
- Pre-existing build errors (useContext null / prerender errors for all dashboard pages) existed before this plan and are unrelated to these changes. Verified by stashing changes and confirming same error list on baseline. Out of scope per deviation rules.

## Next Phase Readiness
- Heatmap and period filter implementation complete — awaiting human browser verification (Task 3 checkpoint)
- After checkpoint approval, Phase 3 is complete
- No blockers for verification

---
*Phase: 03-heatmap-and-filters*
*Completed: 2026-03-20*
