# Phase 3: TypeScript and Consolidation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 03-typescript-and-consolidation
**Areas discussed:** Type guard strategy, KV helper design, Stats computation, Null handling patterns

---

## Type Guard Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Discriminated unions (Recommended) | Add type guards based on event field — 'started' vs 'finished' events have different shapes. TypeScript narrows automatically. | ✓ |
| Runtime validation guards | Create isWebhookPayload() functions that validate shape at runtime. More defensive but adds overhead. | |
| You decide | Claude picks the appropriate approach per location based on context | |

**User's choice:** Discriminated unions (Recommended)
**Notes:** The SetupManagerWebhook union already has an event field discriminant.

---

## KV Helper Design

| Option | Description | Selected |
|--------|-------------|----------|
| Standalone functions (Recommended) | Create fetchEvents(env, limit) and fetchEventsByType(env, type, limit) functions in a new src/kv.ts module | ✓ |
| KVHelper class | Create a KVHelper class that wraps the WEBHOOKS binding with methods for common operations | |
| You decide | Claude picks based on usage patterns and Cloudflare Workers conventions | |

**User's choice:** Standalone functions (Recommended)
**Notes:** Aligns with existing codebase style — no classes in Worker code.

---

## Stats Computation

| Option | Description | Selected |
|--------|-------------|----------|
| useMemo (Recommended) | Replace useEffect+setState with useMemo — stats derive directly from events, no separate state update needed | ✓ |
| Keep useEffect | Keep current pattern but optimize — add deps array refinement, memoize intermediate calculations | |
| Extract to separate hook | Create useStats(events) hook that returns memoized stats — more reusable but adds a file | |

**User's choice:** useMemo (Recommended)
**Notes:** Stats are derived data — no reason to go through setState.

---

## Null Handling Patterns

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit guards at boundaries (Recommended) | Add guards where data enters the system (WebSocket messages, KV reads). Trust types after validation. | ✓ |
| Optional chaining everywhere | Use ?. liberally throughout — defensive but can mask bugs by silently returning undefined | |
| You decide | Claude applies judgment per location — guards at untrusted boundaries, optional chaining for convenience elsewhere | |

**User's choice:** Explicit guards at boundaries (Recommended)
**Notes:** Validate data where it enters, then trust the types downstream.

---

## Claude's Discretion

- Specific type guard implementations per file
- KV helper error handling approach
- Whether to extract stats computation to a separate hook or keep inline

## Deferred Ideas

None — discussion stayed within phase scope
