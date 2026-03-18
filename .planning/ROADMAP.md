# Roadmap: SOS Diaristas — Mapa de Atendimentos

## Overview

Tres fases constroem a feature de baixo para cima: primeiro o mapa renderiza corretamente no dashboard com dados estáticos (validando todos os problemas de SSR/Leaflet antes de tocar em dados reais), depois a infraestrutura de geocoding é instalada e os pedidos históricos são processados, e por fim o heatmap e os filtros por período completam o valor analítico da feature.

## Phases

- [x] **Phase 1: Map Scaffold** - Mapa de Foz do Iguaçu funcionando no dashboard com dados estáticos e entrada na sidebar (completed 2026-03-18)
- [ ] **Phase 2: Geocoding Infrastructure** - Coordenadas lat/lng cacheadas no banco, backfill de pedidos históricos e pins reais no mapa
- [ ] **Phase 3: Heatmap and Filters** - Camada de calor, filtro por período (7/30/90 dias) e feature completa para v1

## Phase Details

### Phase 1: Map Scaffold
**Goal**: Mapa interativo de Foz do Iguaçu integrado ao dashboard com tema dark, acessível pela sidebar
**Depends on**: Nothing (first phase)
**Requirements**: MAPA-01, MAPA-02, MAPA-06
**Success Criteria** (what must be TRUE):
  1. Usuário vê um mapa real de Foz do Iguaçu com tiles escuros (CartoDB Dark Matter) na página /dashboard/mapa
  2. Usuário consegue fazer zoom e pan no mapa sem a página quebrar ou recarregar
  3. Item "Mapa" aparece na sidebar do dashboard e navega para a página corretamente
  4. Mapa não quebra o build de produção (sem erros de `window is not defined` em SSR)
**Plans:** 1/1 plans complete

Plans:
- [ ] 01-01-PLAN.md — Install Leaflet/react-leaflet, create MapComponent + mapa page, add sidebar entry

### Phase 2: Geocoding Infrastructure
**Goal**: Endereços dos pedidos geocodificados via Nominatim, coordenadas cacheadas no banco e pins reais no mapa
**Depends on**: Phase 1
**Requirements**: INFRA-01, INFRA-02, INFRA-03, MAPA-03
**Success Criteria** (what must be TRUE):
  1. Pedidos com endereço têm lat/lng salvos no banco após o backfill rodar (coluna `geocoded_at` preenchida)
  2. Usuário vê pins no mapa nos endereços geocodificados dos pedidos concluídos e agendados
  3. Pedidos com endereço não encontrado pelo geocoding não quebram o mapa — o número de endereços sem coordenada é visível na página
  4. O mesmo endereço não é re-geocodificado em chamadas subsequentes (cache funciona)
**Plans**: TBD

Plans:
- [ ] 02-01: Migração do banco (adicionar lat, lng, geocoded_at em crm_orders), criar src/lib/geocode.js com rate limiter 1 req/s e normalização de endereço para Foz do Iguaçu
- [ ] 02-02: Criar scripts/geocode-backfill.js (rodar localmente, processar pedidos WHERE lat IS NULL), criar GET /api/dashboard/mapa retornando coordenadas cacheadas, conectar API ao MapComponent para exibir pins reais

### Phase 3: Heatmap and Filters
**Goal**: Camada de heatmap com densidade de atendimentos e filtro por período tornam o mapa analiticamente útil
**Depends on**: Phase 2
**Requirements**: MAPA-04, MAPA-05
**Success Criteria** (what must be TRUE):
  1. Usuário vê uma camada de calor sobre o mapa mostrando concentração de atendimentos por área
  2. Usuário seleciona "últimos 7 dias", "30 dias" ou "90 dias" e os pins e heatmap atualizam sem o mapa reiniciar (zoom/pan preservado)
  3. Trocar o filtro de período não causa flash de mapa em branco nem reset de posição
**Plans**: TBD

Plans:
- [ ] 03-01: Integrar leaflet.heat via useMap() hook com lifecycle correto (useRef + add/remove layer), HeatmapLayer component, botões de filtro por período com estado no page component, atualização de dados via refetch sem remount do MapContainer

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Map Scaffold | 1/1 | Complete   | 2026-03-18 |
| 2. Geocoding Infrastructure | 0/2 | Not started | - |
| 3. Heatmap and Filters | 0/1 | Not started | - |
