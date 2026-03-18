# Requirements: SOS Diaristas — Mapa de Atendimentos

**Defined:** 2026-03-17
**Core Value:** Visualizar geograficamente onde estamos atendendo em Foz do Iguaçu para entender a demanda por região

## v1 Requirements

### Mapa

- [x] **MAPA-01**: Usuário pode ver mapa real de Foz do Iguaçu com tiles escuros (CartoDB Dark Matter) no dashboard
- [x] **MAPA-02**: Usuário pode navegar pelo mapa com zoom e pan interativo
- [ ] **MAPA-03**: Usuário pode ver pins nos endereços dos pedidos geocodificados
- [ ] **MAPA-04**: Usuário pode ver camada de calor mostrando concentração de atendimentos
- [ ] **MAPA-05**: Usuário pode filtrar dados do mapa por período (últimos 7, 30 ou 90 dias)
- [x] **MAPA-06**: Nova página "Mapa" acessível na sidebar do dashboard

### Infraestrutura de Geocoding

- [x] **INFRA-01**: Endereços dos pedidos são geocodificados via Nominatim (OpenStreetMap) e coordenadas lat/lng salvas no banco (cache)
- [x] **INFRA-02**: Pedidos existentes são geocodificados via script de backfill (respeitando rate limit de 1 req/s)
- [ ] **INFRA-03**: Endereços não encontrados pelo geocoding são tratados graciosamente (contagem exibida, mapa não quebra)

## v2 Requirements

### Mapa — Enhancements

- **MAPA-07**: Loading state com spinner enquanto dados carregam
- **MAPA-08**: KPI de contagem de pedidos visível no mapa ("X atendimentos neste período")
- **MAPA-09**: Toggle entre visualização de pins e heatmap
- **MAPA-10**: Popup ao clicar num pin mostrando detalhes do pedido (contato, data, serviço, diarista)
- **MAPA-11**: Painel de resumo por bairro (ranking de bairros por número de atendimentos)

### Filtros Avançados

- **FILT-01**: Filtro por diarista (ver onde cada diarista atende)
- **FILT-02**: Filtro por status do pedido (concluído, agendado, etc)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rastreamento GPS em tempo real | Requer app mobile, complexidade desproporcional |
| Google Maps API | Custo desnecessário, OpenStreetMap atende |
| Mapa público (landing page) | Ferramenta interna de operações apenas |
| Geocoding no momento do pedido (WhatsApp bot) | Requer mudanças no fluxo n8n, futuro |
| Choropleth (polígonos coloridos por bairro) | Requer dados GeoJSON de Foz não disponíveis |
| Reverse geocoding (lat/lng → endereço) | Já temos endereços em texto nos pedidos |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAPA-01 | Phase 1 | Complete |
| MAPA-02 | Phase 1 | Complete |
| MAPA-06 | Phase 1 | Complete |
| MAPA-03 | Phase 2 | Pending |
| INFRA-01 | Phase 2 | Complete |
| INFRA-02 | Phase 2 | Complete |
| INFRA-03 | Phase 2 | Pending |
| MAPA-04 | Phase 3 | Pending |
| MAPA-05 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-18 after Phase 2 Plan 01 completion (INFRA-01, INFRA-02 complete)*
