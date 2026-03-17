---
phase: 1
slug: map-scaffold
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework in project |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Build must succeed + manual smoke test
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | MAPA-01 | build + manual | `npm run build` | N/A | ⬜ pending |
| 1-01-02 | 01 | 1 | MAPA-02 | manual | Browser zoom/pan | N/A | ⬜ pending |
| 1-01-03 | 01 | 1 | MAPA-06 | build + manual | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. No test framework needed — Phase 1 is entirely visual. `npm run build` validates SSR correctness.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark map tiles visible at Foz do Iguaçu | MAPA-01 | Visual rendering | Open /dashboard/mapa, verify CartoDB Dark Matter tiles centered on Foz |
| Zoom and pan work | MAPA-02 | Interactive behavior | Scroll to zoom, drag to pan, verify no page refresh or crash |
| Sidebar "Mapa" link works | MAPA-06 | Navigation behavior | Click "Mapa" in sidebar, verify it navigates to /dashboard/mapa |
| No SSR errors in build | MAPA-01 | Build validation | Run `npm run build`, verify no "window is not defined" errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
