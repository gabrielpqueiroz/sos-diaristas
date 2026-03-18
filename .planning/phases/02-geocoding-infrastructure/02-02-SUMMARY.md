---
phase: 02-geocoding-infrastructure
plan: 02
subsystem: api, ui, maps
tags: [react-leaflet, leaflet, nominatim, postgresql, next.js, maps]

# Dependency graph
requires:
  - phase: 02-geocoding-infrastructure/02-01
    provides: lat/lng columns on crm_orders, geocodeAddress() utility, backfill script

provides:
  - GET /api/dashboard/mapa returning geocoded pins array and with/without coordinate counts
  - MapComponent with Marker and Popup rendering for each geocoded order
  - Mapa page fetching live data and displaying geocoded/failed address counts

affects: [03-heatmap, future map features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - react-leaflet Marker+Popup inside ssr:false dynamic import boundary
    - MapContainer without dynamic key to prevent remount on data load
    - Tailwind green-400/yellow-400 for geocoding success/failure indicators

key-files:
  created:
    - src/app/api/dashboard/mapa/route.js
  modified:
    - src/app/dashboard/_components/MapComponent.js
    - src/app/dashboard/(app)/mapa/page.js

key-decisions:
  - "Popup text uses dark color #1a1a2e because Leaflet popup always has white background regardless of page theme"
  - "Pins filtered to active statuses only (concluido, agendado, confirmado, diarista_atribuida, em_andamento) — cancelled orders excluded from map"
  - "GLASS applied to map container div for visual consistency with dashboard design system"
  - "total_without_coords displayed conditionally (only when > 0) to avoid visual noise for users with full geocoding coverage"

patterns-established:
  - "Pattern: API route count with/without pattern using FILTER (WHERE...) in single query for efficiency"
  - "Pattern: Dynamic component receives data prop from parent page — stable import, changing data"

requirements-completed: [INFRA-03, MAPA-03]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 2 Plan 02: Mapa API + Marker Pins + Geocoded Count Display Summary

**GET /api/dashboard/mapa serving geocoded order pins with react-leaflet Marker+Popup rendering and graceful failed-geocode count in yellow**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-18T17:11:46Z
- **Completed:** 2026-03-18T17:14:38Z
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify, all complete)
- **Files modified:** 3

## Accomplishments
- Created GET /api/dashboard/mapa with two SQL queries: pins filtered to active statuses WHERE lat IS NOT NULL, and aggregate counts with/without coordinates
- Updated MapComponent to accept `pins` prop and render react-leaflet Marker+Popup for each pin — icon fix already in place from Phase 1
- Wired mapa page with useState/useEffect to fetch the API on mount, pass pins to MapComponent, and show green count (geocoded) + conditional yellow count (failed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GET /api/dashboard/mapa route and update MapComponent with Marker rendering** - `e12a787` (feat)
2. **Task 2: Wire mapa page to fetch API data, pass pins to MapComponent, and show failed-geocode count** - `d638668` (feat)

3. **Task 3: Verify pins appear on map and failed-geocode count is visible** - checkpoint approved (human-verify)

**Plan metadata:** `e51f77c` (docs: complete mapa API + Marker pins plan)

## Files Created/Modified
- `src/app/api/dashboard/mapa/route.js` - New GET endpoint returning pins array plus with/without coordinate counts
- `src/app/dashboard/_components/MapComponent.js` - Added Marker+Popup imports and pins prop iteration
- `src/app/dashboard/(app)/mapa/page.js` - Added data fetching, pins prop passing, geocoded/failed counts display

## Decisions Made
- Popup text color hardcoded to `#1a1a2e` (dark navy) since Leaflet popup background is always white regardless of page theme
- GLASS spread into map container style for visual consistency with the rest of the dashboard
- `total_without_coords` displayed only when `> 0` to reduce noise for users where all addresses geocoded successfully
- Pins filtered to active/meaningful statuses — `pendente` excluded since those orders have no scheduled_date context yet

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — build compiled successfully. Pre-existing static export errors (DB connection at build time) are expected for all dashboard pages and were present before this plan.

## User Setup Required
None - no external service configuration required.

## Checkpoint Verification Result

Task 3 checkpoint approved. Backfill ran successfully: 80/101 orders geocoded (79% match rate). Pins confirmed visible on map at Foz do Iguacu locations, popup working on click, failed-geocode count badge visible in yellow.

## Next Phase Readiness
- Map API and frontend wiring complete — ready for Phase 3 (heatmap layer)
- 80 pins geocoded and visible on map; 21 addresses failed geocoding (visible as yellow count badge)
- Phase 2 success criteria fully met: pins visible, failed count graceful, no map remount, build passing

---
*Phase: 02-geocoding-infrastructure*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: src/app/api/dashboard/mapa/route.js
- FOUND: src/app/dashboard/_components/MapComponent.js
- FOUND: src/app/dashboard/(app)/mapa/page.js
- FOUND: .planning/phases/02-geocoding-infrastructure/02-02-SUMMARY.md
- FOUND commit: e12a787 (Task 1)
- FOUND commit: d638668 (Task 2)
- FOUND commit: e51f77c (metadata)
