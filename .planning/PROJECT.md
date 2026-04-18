# Setup Manager HUD — Cleanup & Modernization

## What This Is

A real-time webhook dashboard for Jamf Setup Manager, deployed on Cloudflare Workers. It receives enrollment events from macOS devices during provisioning and displays them via WebSocket-connected React dashboard. Now with a solid test foundation, proper TypeScript safety, and clean CSS.

## Core Value

**Keep the dashboard working reliably** — devices push events, users see them in real-time. No regressions to existing user-visible behavior.

## Requirements

### Validated

- ✓ Webhook ingestion with payload validation — existing
- ✓ Real-time WebSocket broadcast via Durable Objects — existing
- ✓ Event persistence in KV with 90-day TTL — existing
- ✓ Dashboard with KPI cards, charts, and filterable events table — existing
- ✓ Optional webhook Bearer token authentication — existing
- ✓ Optional Cloudflare Access JWT validation — existing
- ✓ CSV/JSON export — existing
- ✓ Theme toggle (light/dark) — existing
- ✓ Vitest test foundation for critical paths — v1.0
- ✓ Security headers (CSP, HSTS, Referrer-Policy, Permissions-Policy) — v1.0
- ✓ Unpredictable event IDs (crypto.randomUUID()) — v1.0
- ✓ Dead code removal (unused exports, shadcn/ui cleanup) — v1.0
- ✓ Type guards for discriminated unions — v1.0
- ✓ Centralized KV fetch helper — v1.0
- ✓ Stats computation via useMemo — v1.0
- ✓ CSS cleanup (dead selectors removed, tokens normalized) — v1.0

### Active

(None — ready for next milestone planning)

### Out of Scope

- UI redesign or new features — focus was cleanup, not visual changes
- Full security overhaul (T1 token rotation, T2 fail-closed) — needs separate effort
- Performance optimization beyond obvious inefficiencies — not the driver
- Adding pagination, event deletion, or new API endpoints — future work

## Context

**Current state (v1.0 shipped):**
- Test suite: 89+ tests covering security-critical code paths
- TypeScript: Proper type guards, no unsafe casts in dashboard components
- CSS: Clean globals.css with only actively-used tokens (145 lines)
- Security: Headers on all responses, unpredictable event IDs

**Tech stack:** Cloudflare Workers, Durable Objects, KV, React 19, TypeScript, Vite, Tailwind CSS v4

**Known deferred items:**
- Pre-existing TypeScript error in `src/security-headers.test.ts` (Property 'default' does not exist)
- T1/T2 high-priority security findings (documented in CLAUDE.md)

## Constraints

- **No UI changes**: Internal cleanup only; visual appearance remained identical
- **Cloudflare runtime**: Respects Workers runtime constraints
- **Incremental**: Each phase was reviewable and reversible
- **Verification required**: Local dev + preview deploy verified

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Moderate aggression on dead code | Balance thoroughness with safety | ✓ Good — 21 exports removed safely |
| Low-hanging security fixes only | Scope control; T1/T2 need separate effort | ✓ Good — headers and IDs fixed |
| Vitest for testing | Workers Vitest integration is first-class | ✓ Good — 89+ tests running |
| Avoid UI visual changes | Cleanup focus, not feature work | ✓ Good — UI unchanged |
| useMemo over useEffect for stats | React best practice, prevents re-renders | ✓ Good — cleaner implementation |

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
*Last updated: 2026-04-18 after v1.0 milestone*
