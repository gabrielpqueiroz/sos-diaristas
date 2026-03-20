---
phase: 3
slug: heatmap-and-filters
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — bash/node assertions only (JS project, no test runner) |
| **Config file** | none |
| **Quick run command** | `npm run build 2>&1 \| tail -5` |
| **Full suite command** | `npm run build 2>&1 \| tail -5` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build 2>&1 | tail -5`
- **After every plan wave:** Run `npm run build 2>&1 | tail -5`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 3-01-01 | 03-01 | 1 | MAPA-04 | file + build | `grep -c "useMap" src/app/dashboard/_components/HeatmapLayer.js && npm run build 2>&1 \| tail -3` | ⬜ pending |
| 3-01-02 | 03-01 | 1 | MAPA-04 + MAPA-05 | file + build | `grep "days" src/app/api/dashboard/mapa/route.js && npm run build 2>&1 \| tail -3` | ⬜ pending |
| 3-01-03 | 03-01 | 1 | MAPA-05 | file + build | `grep "useState" src/app/dashboard/(app)/mapa/page.js && npm run build 2>&1 \| tail -3` | ⬜ pending |
| 3-01-04 | 03-01 | 1 | MAPA-04 + MAPA-05 | checkpoint | human-verify | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework to install. Existing infrastructure covers validation needs:
- HeatmapLayer verified via grep + node require
- API route verified via grep
- Page wiring verified via grep + npm run build

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Heatmap camada de calor visível sobre o mapa | MAPA-04 | Requer browser com dados reais | Abrir /dashboard/mapa → confirmar gradient de cores sobre as regiões com mais pedidos |
| Toggle de camadas funciona | MAPA-04 | Requer browser | Clicar botão "Calor" → heatmap some/aparece sem remount do mapa |
| Filtro de período atualiza sem reset de zoom | MAPA-05 | Requer browser com interação | Fazer zoom → trocar filtro 7/30/90 → confirmar zoom preservado, pins e heatmap atualizados |
| Sem flash de mapa branco ao trocar filtro | MAPA-05 | Requer browser | Trocar período rapidamente → confirmar sem flash/piscar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
