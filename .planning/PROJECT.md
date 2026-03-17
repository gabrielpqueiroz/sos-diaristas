# SOS Diaristas — Mapa de Atendimentos

## What This Is

Evolução do sistema SOS Diaristas para incluir um mapa de calor geolocalizado dos atendimentos em Foz do Iguaçu. Uma nova página no dashboard mostrará onde os serviços estão sendo realizados, usando pins nos endereços e áreas de calor para visualizar concentração de demanda. O sistema já funciona como CRM + landing page + automação via n8n/WhatsApp.

## Core Value

Visualizar geograficamente onde estamos atendendo em Foz do Iguaçu para entender a demanda por região e tomar decisões operacionais melhores (alocação de diaristas, marketing direcionado).

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Landing page com formulário de lead + Meta CAPI — existing
- ✓ Dashboard CRM: contatos, pedidos (Kanban), calendário, diaristas, relatórios — existing
- ✓ Página "Hoje" como tela principal do dia a dia — existing
- ✓ Webhooks n8n: criar pedido, consultar/atualizar contato via WhatsApp — existing
- ✓ Auth simples com localStorage — existing
- ✓ Design system dark com glassmorphism — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Página "Mapa" no dashboard com mapa real de Foz do Iguaçu
- [ ] Geocoding de endereços dos pedidos (endereço → lat/lng) via OpenStreetMap/Nominatim
- [ ] Pins nos endereços dos pedidos concluídos/agendados no mapa
- [ ] Camada de mapa de calor mostrando concentração de atendimentos
- [ ] Filtro por período (últimos 7/30/90 dias)
- [ ] Cache das coordenadas geocodificadas no banco (não re-geocodificar o mesmo endereço)
- [ ] Item "Mapa" na sidebar de navegação do dashboard

### Out of Scope

- Filtro por diarista — futuro
- Filtro por status do pedido — futuro
- Rastreamento GPS em tempo real — complexidade desnecessária
- Pedir localização via WhatsApp — mudança no fluxo n8n, futuro
- Google Maps API — custo desnecessário, OpenStreetMap atende

## Context

- O sistema já coleta endereços dos pedidos em `crm_orders.address` e `crm_contacts.address`/`neighborhood`/`city`
- Os endereços vêm da conversa no WhatsApp via n8n e são salvos como texto livre
- Foz do Iguaçu é a cidade de atuação — o mapa deve ser centrado nela
- A usuária principal é uma senhora — UX precisa ser intuitivo e visual
- Biblioteca de mapas recomendada: Leaflet (open source) com tiles do OpenStreetMap
- Geocoding via Nominatim (API gratuita do OpenStreetMap, rate limit de 1 req/s)
- Endereços podem estar incompletos ou mal formatados — precisa de tratamento

## Constraints

- **API**: Nominatim (OpenStreetMap) — gratuito, rate limit 1 req/s, sem chave de API
- **Biblioteca de mapa**: Leaflet.js — open source, funciona bem com React via react-leaflet
- **Mapa de calor**: leaflet.heat plugin para a camada de heatmap
- **Stack**: JavaScript only (sem TypeScript), Next.js 14 App Router, Tailwind CSS
- **Design**: Seguir o tema dark/glass existente (BG_GRADIENT, GLASS de styles.js)
- **Banco**: PostgreSQL — precisa de colunas lat/lng para cache de geocoding

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| OpenStreetMap + Nominatim ao invés de Google Maps | Gratuito, sem billing, bom o suficiente pra endereços brasileiros | — Pending |
| Leaflet ao invés de Mapbox/Google Maps JS | Open source, leve, ecossistema maduro de plugins (heatmap) | — Pending |
| Cache de geocoding no banco | Evita re-geocodificar o mesmo endereço, respeita rate limit do Nominatim | — Pending |
| Página própria ao invés de embutir em Relatórios | Mapa é uma feature de alto impacto visual, merece destaque | — Pending |

---
*Last updated: 2026-03-17 after initialization*
