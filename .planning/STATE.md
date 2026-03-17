# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-17)

**Core value:** Visualizar geograficamente onde estamos atendendo em Foz do Iguaçu para entender a demanda por região
**Current focus:** Phase 1 — Map Scaffold

## Current Position

Phase: 1 of 3 (Map Scaffold)
Plan: 0 of 1 in current phase
Status: Ready to plan
Last activity: 2026-03-17 — Roadmap criado com 3 fases, 9/9 requisitos mapeados

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: OpenStreetMap + Nominatim ao invés de Google Maps (gratuito, sem billing)
- Roadmap: Leaflet ao invés de Mapbox/Google Maps JS (open source, plugin heatmap maduro)
- Roadmap: Cache de geocoding no banco (evita re-geocodificar, respeita rate limit)
- Roadmap: Página própria /dashboard/mapa ao invés de embutir em Relatórios

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: Verificar taxa de match do Nominatim para endereços reais de crm_orders antes de escrever o backfill (testar 5-10 endereços reais). Se abaixo de ~60%, ajustar normalização.
- Phase 3: Verificar compatibilidade de versão do leaflet.heat (0.2.0) com a versão do Leaflet instalada antes de começar a implementação do HeatmapLayer.

## Session Continuity

Last session: 2026-03-17
Stopped at: Roadmap criado, STATE.md e REQUIREMENTS.md atualizados — pronto para plan-phase 1
Resume file: None
