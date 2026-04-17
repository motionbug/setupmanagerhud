# Roadmap: Setup Manager HUD Cleanup

## Overview

This brownfield cleanup transforms a functional but debt-laden codebase into a maintainable, tested, and standards-compliant foundation. The journey progresses from establishing test safety nets, through security hardening, dead code removal, TypeScript tightening, and finally CSS consolidation. Each phase is reviewable, reversible, and verified via local dev and preview deploys. No user-visible UI changes throughout.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned cleanup work
- Decimal phases (2.1, 2.2): Urgent insertions if needed (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Test Foundation and Security Hardening** - Establish test safety net and apply documented security fixes
- [x] **Phase 2: Dead Code Removal** - Remove unused exports, dependencies, comments, and duplicate logic
- [ ] **Phase 3: TypeScript and Consolidation** - Eliminate unsafe casts, add type guards, extract shared helpers
- [ ] **Phase 4: CSS Cleanup** - Remove dead selectors, consolidate rules, normalize tokens

## Phase Details

### Phase 1: Test Foundation and Security Hardening
**Goal**: Security-critical code paths are tested and documented security gaps are closed
**Depends on**: Nothing (first phase)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. Vitest runs with `npm test` and passes in CI-compatible mode
  2. `validateWebhookPayload()` has tests covering valid payloads, invalid payloads, and prototype pollution
  3. `timingSafeEqual()` has tests proving correct comparison behavior
  4. `validateAccessJwt()` has tests covering valid tokens, expired tokens, and invalid signatures
  5. All HTTP responses include CSP, HSTS, Referrer-Policy, and Permissions-Policy headers
  6. Event IDs include `crypto.randomUUID()` component (verified by test)
**Plans:** 3 plans in 2 waves

Plans:
- [x] 01-01-PLAN.md — Vitest setup and validateWebhookPayload tests (Wave 1)
- [x] 01-02-PLAN.md — timingSafeEqual and validateAccessJwt tests (Wave 2)
- [x] 01-03-PLAN.md — Security headers and event ID randomness (Wave 2)

### Phase 2: Dead Code Removal
**Goal**: Codebase contains only referenced, actively-used code
**Depends on**: Phase 1 (tests catch accidental breakage)
**Requirements**: DEAD-01, DEAD-02, DEAD-03, DEAD-04
**Success Criteria** (what must be TRUE):
  1. No unused exports remain (verified by static analysis or manual audit)
  2. All package.json dependencies are imported somewhere in the codebase
  3. No commented-out code blocks or stale TODO comments remain
  4. No duplicate logic patterns exist across components and hooks
**Plans:** 2 plans in 1 wave

Plans:
- [x] 02-01-PLAN.md — Remove empty directories and unused types.ts exports (Wave 1)
- [x] 02-02-PLAN.md — Remove unused shadcn/ui component exports (Wave 1)

### Phase 3: TypeScript and Consolidation
**Goal**: Type system provides actual safety guarantees; shared patterns are extracted
**Depends on**: Phase 2 (dead code removal simplifies scope)
**Requirements**: TS-01, TS-02, TS-03, TS-04, CONS-01, CONS-02
**Success Criteria** (what must be TRUE):
  1. Zero `as WebhookPayload` or similar unsafe type casts remain
  2. Type guards exist for all discriminated unions and runtime type narrowing
  3. Null/undefined handling uses proper guards (no `!` assertions without justification)
  4. No duplicate type definitions exist
  5. Single KV fetch helper is used by Worker, DashboardRoom, and API handlers
  6. Stats computation uses `useMemo` instead of `useEffect`
**Plans:** 4 plans in 3 waves

Plans:
- [ ] 03-01-PLAN.md — Type guards, union variant exports, and KV helper foundation (Wave 1)
- [ ] 03-02-PLAN.md — Consolidate KV fetch in DashboardRoom and Worker (Wave 2)
- [ ] 03-03-PLAN.md — Replace useEffect stats with useMemo (Wave 2)
- [ ] 03-04-PLAN.md — Eliminate type casts in all dashboard components (Wave 3)

### Phase 4: CSS Cleanup
**Goal**: Styles are consolidated, dead selectors removed, design tokens normalized
**Depends on**: Phase 3 (TypeScript work complete)
**Requirements**: CSS-01, CSS-02, CSS-03, CSS-04
**Success Criteria** (what must be TRUE):
  1. No CSS selectors exist without matching DOM elements
  2. Repeated CSS rules are consolidated into shared utility classes
  3. Spacing, colors, and typography use consistent design tokens
  4. No scattered one-off inline styles remain (or documented exceptions)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 (with decimals inserted if needed)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Test Foundation and Security | 3/3 | Complete | 2026-04-17 |
| 2. Dead Code Removal | 2/2 | Complete | 2026-04-17 |
| 3. TypeScript and Consolidation | 0/4 | Planned | - |
| 4. CSS Cleanup | 0/TBD | Not started | - |
