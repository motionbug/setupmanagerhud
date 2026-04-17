# Setup Manager HUD — Cleanup & Modernization

## What This Is

A real-time webhook dashboard for Jamf Setup Manager, deployed on Cloudflare Workers. It receives enrollment events from macOS devices during provisioning and displays them via WebSocket-connected React dashboard. This is a brownfield cleanup project focused on maintainability, code quality, and standards enforcement.

## Core Value

**Keep the dashboard working reliably** — devices push events, users see them in real-time. No regressions to existing user-visible behavior.

## Requirements

### Validated

(Inferred from existing codebase — already working)

- ✓ Webhook ingestion with payload validation — existing
- ✓ Real-time WebSocket broadcast via Durable Objects — existing
- ✓ Event persistence in KV with 90-day TTL — existing
- ✓ Dashboard with KPI cards, charts, and filterable events table — existing
- ✓ Optional webhook Bearer token authentication — existing
- ✓ Optional Cloudflare Access JWT validation — existing
- ✓ CSV/JSON export — existing
- ✓ Theme toggle (light/dark) — existing

### Active

- [ ] Remove dead, unreferenced, and duplicate code
- [ ] Consolidate duplicate KV fetch logic across Worker and Durable Object
- [ ] Tighten TypeScript (eliminate unsafe casts, weak null handling)
- [ ] CSS cleanup and consolidation (remove dead selectors, normalize tokens)
- [ ] Add security headers (CSP, HSTS, Referrer-Policy, Permissions-Policy)
- [ ] Fix predictable event IDs (append crypto.randomUUID())
- [ ] Verify Cloudflare runtime behavior in preview deploys
- [ ] Establish Vitest test foundation for critical paths

### Out of Scope

- UI redesign or new features — focus is cleanup, not visual changes
- Full security overhaul (T1, T2 high-priority fixes) — only low-hanging fruit
- Performance optimization beyond obvious inefficiencies — not the driver
- Adding pagination, event deletion, or new API endpoints — future work

## Context

**Brownfield state:** Codebase is functional but has accumulated debt:
- No test suite (critical security code untested)
- Duplicated KV fetch patterns across 3 locations
- Frequent `as WebhookPayload` type assertions bypass safety
- Missing security headers documented in threat model
- Predictable event IDs enable KV key collisions

**Codebase audit completed:** `.planning/codebase/` contains 7 analysis docs (1,229 lines total) covering stack, architecture, structure, conventions, testing, integrations, and concerns.

**Security findings acknowledged:** CLAUDE.md documents T1-T4 and Finding 5, 9. This project addresses low-hanging fruit only (headers, predictable IDs). High-priority items (T1, T2) deferred.

## Constraints

- **No UI changes**: Internal cleanup only; visual appearance must remain identical
- **Cloudflare runtime**: Must respect Workers runtime constraints (no Node APIs, edge compatibility)
- **Incremental**: Each phase must be reviewable and reversible
- **Verification required**: Local dev + preview deploy before marking phases complete

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Moderate aggression on dead code | Balance thoroughness with safety | — Pending |
| Low-hanging security fixes only | Scope control; T1/T2 need separate effort | — Pending |
| Vitest for testing | Workers Vitest integration is first-class | — Pending |
| Avoid UI visual changes | Cleanup focus, not feature work | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-17 after initialization*
