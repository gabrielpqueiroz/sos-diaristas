---
phase: 01-map-scaffold
plan: 01
subsystem: ui
tags: [leaflet, react-leaflet, map, cartocdn, next-dynamic, ssr]

# Dependency graph
requires: []
provides:
  - Interactive Leaflet map scaffold at /dashboard/mapa with CartoDB Dark Matter tiles
  - MapComponent.js with Foz do Iguacu center coordinates and Leaflet icon fix
  - mapa/page.js with dynamic import (ssr: false) SSR guard
  - MapIcon SVG export in icons.js
  - Mapa sidebar nav entry in layout.js (between Relatorios and Configuracoes)
affects: [02-geocoding-pins, 03-heatmap]

# Tech tracking
tech-stack:
  added:
    - leaflet@1.9.4
    - react-leaflet@4.2.1 (pinned to React 18 compatible version)
  patterns:
    - dynamic(() => import(...), { ssr: false }) for Leaflet SSR guard in Next.js App Router
    - L.Icon.Default.mergeOptions CDN icon fix applied at module load, before any Marker usage
    - MapContainer with explicit pixel height wrapper (600px) to prevent zero-height invisible map

key-files:
  created:
    - src/app/dashboard/_components/MapComponent.js
    - src/app/dashboard/(app)/mapa/page.js
  modified:
    - package.json
    - src/app/dashboard/_components/icons.js
    - src/app/dashboard/(app)/layout.js

key-decisions:
  - "react-leaflet pinned to 4.2.1 — latest (v5) requires React 19, this project uses React 18"
  - "MapComponent kept in separate file from page to enable ssr:false dynamic import boundary"
  - "CartoDB Dark Matter tiles used for dark dashboard theme alignment (no API key required)"
  - "CDN URLs for Leaflet icon fix in Phase 1 scaffold — /public copy deferred to Phase 2 if needed"
  - "Mapa entry placed between Relatorios and Configuracoes — groups analytics/reporting tools"

patterns-established:
  - "Pattern: All Leaflet code lives in 'use client' components; page imports via dynamic ssr:false"
  - "Pattern: MapContainer requires explicit pixel height on parent wrapper div to render visibly"
  - "Pattern: Leaflet icon fix (L.Icon.Default.mergeOptions) at module level in MapComponent.js"

requirements-completed: [MAPA-01, MAPA-02, MAPA-06]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 1 Plan 01: Map Scaffold Summary

**Interactive Leaflet map at /dashboard/mapa with CartoDB Dark Matter tiles centered on Foz do Iguacu, wired into the dashboard sidebar navigation**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-18T16:36:26Z
- **Completed:** 2026-03-18T16:39:31Z
- **Tasks:** 3 completed (2 auto + 1 human-verify checkpoint — approved)
- **Files modified:** 5

## Accomplishments

- Installed leaflet@1.9.4 and react-leaflet@4.2.1 (pinned for React 18 compatibility)
- Created MapComponent.js with CartoDB Dark Matter tiles, FOZ_CENTER coordinates, scrollWheel zoom, and Leaflet icon fix baked in for Phase 2 markers
- Created mapa/page.js with dynamic import (ssr: false) preventing window-is-not-defined SSR crash
- Added MapIcon SVG export to icons.js following the existing pattern (15x15, stroke, viewBox 0 0 24 24)
- Added Mapa nav entry to sidebar navItems between Relatorios and Configuracoes

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Leaflet dependencies and create MapComponent + mapa page** - `a16edbd` (feat)
2. **Task 2: Add MapIcon to icons.js and Mapa entry to sidebar navigation** - `794785f` (feat)

3. **Task 3: Verify map renders correctly in browser** - human-verify checkpoint approved by user (no code commit)

**Plan metadata:** `17d9e77` (docs: complete map-scaffold plan — awaiting human-verify checkpoint)

## Files Created/Modified

- `src/app/dashboard/_components/MapComponent.js` - Leaflet map wrapper, CartoDB Dark Matter tiles, FOZ_CENTER, icon fix
- `src/app/dashboard/(app)/mapa/page.js` - Map page with dynamic import (ssr: false), loading spinner
- `src/app/dashboard/_components/icons.js` - Added MapIcon folded-map SVG export
- `src/app/dashboard/(app)/layout.js` - Added MapIcon import and mapa navItems entry
- `package.json` - Added leaflet and react-leaflet dependencies

## Decisions Made

- Pinned react-leaflet to 4.2.1 (v5 requires React 19; this project is React 18)
- Used CDN URLs for Leaflet icon fix (unpkg) rather than copying PNGs to /public — simpler for Phase 1 scaffold; Phase 2 can switch if needed
- Placed Mapa between Relatorios and Configuracoes in sidebar to group analytical/reporting tools

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing build issue: all dashboard pages fail prerendering with `TypeError: Cannot read properties of null (reading 'useContext')`. This is NOT related to our Leaflet changes — confirmed by running `npm run build` with our changes stashed and observing the same errors. The `window is not defined` SSR error (the acceptance criterion) is NOT present. Build compiles successfully (`Compiled successfully`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- MapComponent scaffold ready for Phase 2 to add Marker components and geocoding
- Leaflet icon fix already applied — Phase 2 markers will render without broken-image issues
- FOZ_CENTER coordinates established as the map center constant
- react-leaflet 4.2.1 installed — Phase 3 can add leaflet.heat without version conflicts
- Phase 2 blocker: verify Nominatim match rate for real crm_orders addresses before writing geocoding backfill (aim for >60%)

---
*Phase: 01-map-scaffold*
*Completed: 2026-03-18*

## Self-Check: PASSED

All files exist, all commits found, all 11 acceptance criteria verified.
