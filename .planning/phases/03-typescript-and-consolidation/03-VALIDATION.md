---
phase: 03
slug: typescript-and-consolidation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-17
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.x with @cloudflare/vitest-pool-workers |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | TS-01 | — | N/A | type-check | `npm run typecheck` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | TS-02 | — | N/A | type-check | `npm run typecheck` | ✅ | ⬜ pending |
| 03-02-01 | 02 | 1 | CONS-01 | — | N/A | unit | `npm test` | ✅ | ⬜ pending |
| 03-03-01 | 03 | 2 | CONS-02 | — | N/A | type-check | `npm run typecheck` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements:
- Vitest installed and configured (Phase 1)
- TypeScript strict mode enabled
- `npm run typecheck` command available

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| useMemo renders correctly | CONS-02 | No render test infra | Dev server visual check: stats update on new events |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
