---
phase: 2
slug: geocoding-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — bash/node assertions only (JS project, no test runner) |
| **Config file** | none |
| **Quick run command** | `node -e "require('./src/lib/geocode.js')"` |
| **Full suite command** | `npm run build 2>&1 | tail -5` |
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
| 2-01-01 | 02-01 | 1 | INFRA-01 | db + file | `psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='crm_orders' AND column_name IN ('lat','lng','geocoded_at')"` | ⬜ pending |
| 2-01-02 | 02-01 | 1 | INFRA-01 | file | `grep -c "geocode" src/lib/geocode.js && grep "parseFloat" src/lib/geocode.js` | ⬜ pending |
| 2-02-01 | 02-02 | 1 | INFRA-02 | file + run | `node scripts/geocode-backfill.js --dry-run 2>&1 | head -5` | ⬜ pending |
| 2-02-02 | 02-02 | 1 | INFRA-03 + MAPA-03 | api + build | `npm run build 2>&1 | tail -5` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No test framework to install. Existing infrastructure covers validation needs:
- DB migrations verified via psql column inspection
- geocode.js verified via grep + node require
- API route verified via npm run build (catches import errors)
- Backfill verified via --dry-run flag

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pins visíveis no mapa após backfill | MAPA-03 | Requer dados reais geocodificados no banco + browser | Rodar backfill → abrir /dashboard/mapa → confirmar pins aparecem no mapa |
| Contador de endereços sem coordenada visível | INFRA-03 | Requer UI + dados reais | Abrir /dashboard/mapa → confirmar badge/texto "X endereços sem coordenada" |
| Taxa de match Nominatim ≥ 60% | INFRA-02 | Depende de dados de produção | Após backfill, verificar no banco: `SELECT COUNT(*) WHERE lat IS NOT NULL` vs total |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
