---
phase: 02
slug: dead-code-removal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (tsc) + manual verification |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npm run typecheck` |
| **Full suite command** | `npm run typecheck && npm run build` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run typecheck && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | DEAD-01 | — | N/A | shell | `test ! -d src/components/providers/ && test ! -d src/layouts/` | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | DEAD-01 | — | N/A | typecheck | `npm run typecheck && npm run test` | ✅ | ⬜ pending |
| 02-02-01 | 02 | 1 | DEAD-01 | — | N/A | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 02-02-02 | 02 | 1 | DEAD-01 | — | N/A | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 02-02-03 | 02 | 1 | DEAD-01 | — | N/A | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 02-02-04 | 02 | 1 | DEAD-01 | — | N/A | typecheck | `npm run typecheck` | ✅ | ⬜ pending |
| 02-02-05 | 02 | 1 | DEAD-04 | — | N/A | typecheck | `npm run typecheck` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Task ID mapping:**
- `02-01-01`: Plan 01, Task 1 — Remove empty scaffolding directories
- `02-01-02`: Plan 01, Task 2 — Remove unused type exports from src/types.ts
- `02-02-01`: Plan 02, Task 1 — Remove unused exports from card.tsx
- `02-02-02`: Plan 02, Task 2 — Remove unused exports from badge.tsx and button.tsx
- `02-02-03`: Plan 02, Task 3 — Remove unused exports from table.tsx
- `02-02-04`: Plan 02, Task 4 — Remove unused exports from select.tsx
- `02-02-05`: Plan 02, Task 5 — Remove unused exports from dropdown-menu.tsx

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

- TypeScript compiler already configured
- Build pipeline already set up
- No additional test scaffolding needed for dead code removal

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Export usage audit | DEAD-01 | grep-based verification confirms no imports | Run: `grep -rn "ExportName" src/` and verify 0 results |
| Dependency audit | DEAD-02 | Already confirmed all deps used | N/A — no action required |
| Comment audit | DEAD-03 | Already confirmed no stale comments | N/A — no action required |
| Empty dir removal | DEAD-04 | Verify directories don't exist | Run: `ls src/components/providers src/layouts 2>&1` should fail |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
