# Phase 3: TypeScript and Consolidation - Research

**Researched:** 2026-04-17
**Domain:** TypeScript type safety, code consolidation, React hooks optimization
**Confidence:** HIGH

## Summary

This phase eliminates unsafe type assertions (`as` casts) by leveraging TypeScript's discriminated union narrowing, extracts duplicated KV fetch logic into a shared helper module, and converts derived state computation from `useEffect` to `useMemo`.

The codebase already has a well-defined discriminated union (`SetupManagerWebhook`) with the `event` field as discriminant. TypeScript narrows automatically when code checks `payload.event === 'com.jamf.setupmanager.finished'`. The current problem is that components cast `event.payload` to the flat `WebhookPayload` type (which has all fields optional) instead of properly narrowing through the discriminant.

KV fetch logic is duplicated in three places with identical patterns. A shared helper in `src/kv.ts` will centralize this code and handle JSON parsing internally.

The `useWebSocket` hook computes stats in a `useEffect` that calls `setState`, causing an extra render cycle. Stats are derived data and should use `useMemo` instead.

**Primary recommendation:** Leverage the existing discriminated union (`SetupManagerWebhook`) for type narrowing instead of casting to the flat `WebhookPayload` type. Export the union variants (`SetupManagerStartedWebhook`, `SetupManagerFinishedWebhook`) from types.ts for use as type guards.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use discriminated unions for type narrowing -- the existing `SetupManagerWebhook` union has `event` field discriminant. TypeScript narrows automatically when checking `payload.event === 'com.jamf.setupmanager.finished'`.
- **D-02:** Eliminate all 13 `as WebhookPayload` and `as StoredEvent` casts across 7 files by leveraging discriminated union narrowing.
- **D-03:** Create standalone functions in new `src/kv.ts` module -- `fetchEvents(env, limit)` and `fetchEventsByType(env, type, limit)`. No classes; aligns with existing codebase style.
- **D-04:** Single KV helper replaces duplicate patterns in DashboardRoom.ts (lines 118-125) and index.ts (lines 304-335).
- **D-05:** Replace `useEffect` + `setState` with `useMemo` in `useWebSocket.ts` (lines 97-139). Stats are derived data -- compute directly from events array without intermediate state updates.
- **D-06:** Add explicit guards at data boundaries (WebSocket message handling, KV reads). Trust types after validation -- no defensive optional chaining throughout internal code.

### Claude's Discretion
- Specific type guard implementations per file
- KV helper error handling approach
- Whether to extract stats computation to a separate hook or keep inline

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TS-01 | Eliminate unsafe `as` type casts (especially `as WebhookPayload`) | Discriminated union narrowing via `event` field; see Architecture Patterns |
| TS-02 | Add proper type guards where type narrowing is needed | User-defined type predicates for `isFinishedWebhook`; see Code Examples |
| TS-03 | Fix weak null/undefined handling patterns | Explicit guards at boundaries (KV reads, WebSocket messages); trust types internally |
| TS-04 | Remove duplicated type definitions | Export union variants from types.ts; consolidate `Env` interface |
| CONS-01 | Extract shared KV fetch helper (duplicated in Worker, DashboardRoom, API handlers) | New `src/kv.ts` module with `fetchEvents()` function; see Don't Hand-Roll |
| CONS-02 | Change stats computation from useEffect to useMemo | Stats are derived data; `useMemo` avoids extra render cycle; see Code Examples |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Type definitions | Shared (`src/types.ts`) | -- | Types shared across Worker and React client |
| KV fetch logic | Worker (`src/kv.ts`) | -- | Server-side only; Worker and Durable Object |
| Stats computation | Client (`useWebSocket.ts`) | -- | Client-side derived state from events array |
| Type narrowing | All layers | -- | TypeScript compile-time checking throughout |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.3.3 (project) / 6.0.3 (current) | Static typing | Already configured with strict mode |
| React | ^19.0.0 | Frontend UI | Project already uses React 19 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | ^4.1.4 | Testing | Test type guards and KV helper |
| @cloudflare/workers-types | ^4.20241127.0 | Worker type definitions | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| User-defined type predicates | `in` operator checks | Type predicates more explicit and reusable |
| Flat `WebhookPayload` type | Discriminated union narrowing | Union narrowing provides compile-time safety |
| Inline stats computation | Separate `useStats` hook | Separate hook adds indirection; Claude's discretion |

**Installation:**
No new packages required. All dependencies already present.

**Version verification:** [VERIFIED: npm registry]
- TypeScript current: 6.0.3 (project uses ^5.3.3 -- compatible)

## Architecture Patterns

### System Architecture Diagram

```
                         +-----------------+
                         |  Webhook POST   |
                         +--------+--------+
                                  |
                                  v
+---------------------------+    +---------------------------+
|  validateWebhookPayload() |--->|  payload as               |
|  (src/types.ts)           |    |  SetupManagerWebhook      |
|  Returns ValidationResult |    |  (discriminated union)    |
+---------------------------+    +-------------+-------------+
                                               |
                        narrowing via event field check
                                               |
                    +-------------+------------+-------------+
                    |                          |             |
                    v                          v             v
          +----------------+         +----------------+   +---------+
          | Started event  |         | Finished event |   | KV.put  |
          | (no duration)  |         | (has duration) |   +---------+
          +----------------+         +----------------+
                    |                          |
                    +-----------+--------------+
                                |
                                v
                    +------------------------+
                    |  DashboardRoom.broadcast|
                    |  (WebSocket)           |
                    +------------------------+
                                |
                                v
                    +------------------------+
                    |  useWebSocket hook     |
                    |  events: StoredEvent[] |
                    +------------------------+
                                |
                      useMemo (not useEffect)
                                |
                                v
                    +------------------------+
                    |  stats: Stats          |
                    |  (derived data)        |
                    +------------------------+
```

### Recommended Project Structure
```
src/
+-- kv.ts            # NEW: Shared KV fetch helper
+-- types.ts         # Export union variants for narrowing
+-- index.ts         # Worker entry (uses kv.ts)
+-- DashboardRoom.ts # Durable Object (uses kv.ts)
+-- hooks/
|   +-- useWebSocket.ts # useMemo for stats
+-- components/
    +-- dashboard/   # Component type narrowing
```

### Pattern 1: Discriminated Union Narrowing
**What:** TypeScript automatically narrows union types when checking the discriminant property.
**When to use:** When accessing properties that exist on only one variant of a union type.
**Example:**
```typescript
// Source: https://www.typescriptlang.org/docs/handbook/2/narrowing.html [CITED]
type Shape = 
  | { kind: "circle"; radius: number }
  | { kind: "square"; sideLength: number };

function area(shape: Shape): number {
  if (shape.kind === "circle") {
    // TypeScript knows shape is { kind: "circle"; radius: number }
    return Math.PI * shape.radius ** 2;
  } else {
    // TypeScript knows shape is { kind: "square"; sideLength: number }
    return shape.sideLength ** 2;
  }
}
```

### Pattern 2: User-Defined Type Predicates
**What:** Functions with return type `paramName is Type` that narrow types when called in conditionals.
**When to use:** When the discriminant check is complex or needs to be reused.
**Example:**
```typescript
// Source: https://www.typescriptlang.org/docs/handbook/2/narrowing.html [CITED]
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

if (isFish(pet)) {
  pet.swim(); // TypeScript knows pet is Fish
}
```

### Pattern 3: useMemo for Derived State
**What:** Compute derived values directly from state without intermediate state updates.
**When to use:** When a value can be computed from existing state without side effects.
**Example:**
```typescript
// Source: https://react.dev/reference/react/useMemo [CITED]
function TodoList({ todos, tab }) {
  const visibleTodos = useMemo(
    () => filterTodos(todos, tab),
    [todos, tab]
  );
  // visibleTodos updates when todos or tab change
}
```

### Anti-Patterns to Avoid
- **Casting to flat types:** Using `as WebhookPayload` bypasses TypeScript safety. Use discriminant checks instead.
- **useEffect for derived state:** Causes extra render cycle and unnecessary complexity. Use `useMemo`.
- **Defensive optional chaining everywhere:** After validation, trust the types. Don't scatter `?.` throughout internal code.
- **Duplicate KV fetch patterns:** Bugs must be fixed in multiple places. Centralize in a helper.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type narrowing | Manual type assertions | Discriminated unions | TypeScript provides compile-time safety |
| Derived state | useEffect + setState | useMemo | Avoids extra render, cleaner code |
| KV fetch + parse | Inline JSON.parse everywhere | Shared helper function | Single point of maintenance |

**Key insight:** TypeScript's discriminated unions provide the safety guarantees that manual `as` casts bypass. The existing `SetupManagerWebhook` union is already properly defined; code just needs to use narrowing instead of casting.

## Common Pitfalls

### Pitfall 1: Casting to Flat Type Instead of Narrowing
**What goes wrong:** Code casts `payload` to `WebhookPayload` (a flat type with all fields optional) instead of checking the discriminant to narrow to the correct variant.
**Why it happens:** `WebhookPayload` was created as a convenience type for UI components that don't need variant-specific safety.
**How to avoid:** Check `payload.event` before accessing variant-specific fields. TypeScript narrows automatically.
**Warning signs:** `as WebhookPayload`, `as StoredEvent`, accessing `.duration` without checking if finished event.

### Pitfall 2: useEffect Causing Extra Renders
**What goes wrong:** Stats computation in `useEffect` calls `setState`, triggering an extra render cycle.
**Why it happens:** Treating derived data as separate state instead of computed value.
**How to avoid:** Use `useMemo` to compute stats directly from events array.
**Warning signs:** `useEffect` that only reads state and calls `setState` with derived values.

### Pitfall 3: JSON.parse Without Type Validation
**What goes wrong:** `JSON.parse(data) as StoredEvent` blindly trusts that KV data matches expected shape.
**Why it happens:** KV can store any JSON; schema can drift over time.
**How to avoid:** Parse in centralized helper; return null for invalid shapes; filter nulls downstream.
**Warning signs:** `as` cast immediately after `JSON.parse`.

### Pitfall 4: Overly Defensive Code After Validation
**What goes wrong:** Scattering `?.` and null checks throughout internal code after data has been validated.
**Why it happens:** Not trusting that validation at the boundary was sufficient.
**How to avoid:** Validate once at data entry points; trust types internally.
**Warning signs:** `payload?.duration ?? 0` deep in rendering code when payload was already validated.

## Code Examples

Verified patterns from official sources:

### Type Guard for Finished Webhook
```typescript
// Apply at: src/types.ts (new export)
// Pattern: User-defined type predicate [CITED: TypeScript docs]

export function isFinishedWebhook(
  payload: SetupManagerWebhook
): payload is SetupManagerFinishedWebhook {
  return payload.event === "com.jamf.setupmanager.finished";
}

// Usage in components:
const finished = events.filter(e => isFinishedWebhook(e.payload));
// finished[].payload.duration is now safe to access
```

### KV Fetch Helper
```typescript
// Apply at: src/kv.ts (new file)
// Pattern: Centralized data access with internal validation [ASSUMED]

import type { StoredEvent } from "./types";

interface KVEnv {
  WEBHOOKS: KVNamespace;
}

export async function fetchEvents(
  env: KVEnv,
  limit = 200
): Promise<StoredEvent[]> {
  const list = await env.WEBHOOKS.list({ limit });
  
  const events = await Promise.all(
    list.keys.map(async (key) => {
      const data = await env.WEBHOOKS.get(key.name);
      if (!data) return null;
      try {
        const parsed = JSON.parse(data);
        // Basic shape validation
        if (parsed?.payload?.event && parsed?.timestamp && parsed?.eventId) {
          return parsed as StoredEvent;
        }
        return null;
      } catch {
        return null;
      }
    })
  );

  return events
    .filter((e): e is StoredEvent => e !== null)
    .sort((a, b) => b.timestamp - a.timestamp);
}
```

### Stats Computation with useMemo
```typescript
// Apply at: src/hooks/useWebSocket.ts
// Pattern: Derived state with useMemo [CITED: React docs]

import { useMemo } from "react";
import { isFinishedWebhook } from "@/types";

// Inside useWebSocket hook:
const stats = useMemo(() => {
  const started = events.filter(
    (e) => e.payload.event === "com.jamf.setupmanager.started"
  );
  const finished = events.filter(
    (e) => isFinishedWebhook(e.payload)
  );

  const durations = finished
    .map((e) => e.payload.duration) // Safe: isFinishedWebhook guarantees duration exists
    .filter((d) => d > 0);

  const avgDuration =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  const failedActions = finished.reduce((count, e) => {
    const actions = e.payload.enrollmentActions || [];
    return count + actions.filter((a) => a.status === "failed").length;
  }, 0);

  const totalActions = finished.reduce((count, e) => {
    return count + (e.payload.enrollmentActions?.length || 0);
  }, 0);

  const successRate =
    totalActions > 0
      ? Math.round(((totalActions - failedActions) / totalActions) * 100)
      : 100;

  return {
    total: events.length,
    started: started.length,
    finished: finished.length,
    avgDuration,
    successRate,
    failedActions,
  };
}, [events]); // Only recompute when events change
```

### Component Type Narrowing
```typescript
// Apply at: src/components/dashboard/EventsTable.tsx, App.tsx, etc.
// Pattern: Check discriminant before accessing variant fields [CITED: TypeScript docs]

// Instead of:
const payload = event.payload as WebhookPayload;
const duration = payload.duration; // Unsafe

// Do this:
const payload = event.payload;
if (payload.event === "com.jamf.setupmanager.finished") {
  const duration = payload.duration; // Safe: TypeScript knows duration exists
}

// Or with type guard:
if (isFinishedWebhook(event.payload)) {
  const duration = event.payload.duration; // Safe
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `as` type assertions | Discriminated unions + narrowing | TypeScript 2.0+ (2016) | Compile-time safety |
| Flat union types | Tagged/discriminated unions | TypeScript 2.0+ | Automatic narrowing |
| useEffect for derived state | useMemo | React hooks (2018) | Cleaner code, no extra renders |
| Inline JSON.parse | Centralized data access layer | Best practice | Single point of validation |

**Deprecated/outdated:**
- **Flat `WebhookPayload` type:** Should be replaced with direct use of discriminated union. The flat type exists for legacy code that predates proper narrowing.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | KV helper shape validation (`parsed?.payload?.event`) is sufficient | Code Examples | Invalid events could slip through if shape changes |
| A2 | Inline stats computation (vs separate `useStats` hook) is acceptable | Claude's Discretion | Code may need extraction later if complexity grows |

## Open Questions

1. **Env interface consolidation**
   - What we know: `DashboardRoom.ts` and `index.ts` both define `Env` interfaces
   - What's unclear: DashboardRoom's `Env` is intentionally narrower (only needs WEBHOOKS). Should this be a separate type or derive from a base?
   - Recommendation: Keep separate -- DashboardRoom doesn't need full Worker env bindings

2. **Type guard export location**
   - What we know: `isFinishedWebhook` type guard needs to be available to multiple files
   - What's unclear: Should it go in `types.ts` or a new `type-guards.ts` module?
   - Recommendation: Add to `types.ts` to keep type definitions together (Claude's discretion)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 with @cloudflare/vitest-pool-workers 0.14.7 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TS-01 | Type casts eliminated | Static (typecheck) | `npm run typecheck` | N/A (compile-time) |
| TS-02 | Type guards narrow correctly | Unit | `npm run test -- src/types.test.ts` | Yes (extend existing) |
| TS-03 | Null handling at boundaries | Unit | `npm run test -- src/kv.test.ts` | No (Wave 0) |
| TS-04 | No duplicate type definitions | Static (typecheck) | `npm run typecheck` | N/A |
| CONS-01 | KV helper used everywhere | Unit | `npm run test -- src/kv.test.ts` | No (Wave 0) |
| CONS-02 | Stats use useMemo | Manual inspection | Review diff | N/A |

### Sampling Rate
- **Per task commit:** `npm run typecheck && npm run test`
- **Per wave merge:** Full suite + manual verification
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/kv.test.ts` -- covers CONS-01, TS-03 (KV helper tests)
- [ ] Extend `src/types.test.ts` -- covers TS-02 (type guard tests)

*(Note: Most verification is via `npm run typecheck` -- compile-time safety)*

## Security Domain

> This phase focuses on type safety and code consolidation. No new security surfaces introduced.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | Indirectly | Existing `validateWebhookPayload` unchanged |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for TypeScript/React

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Type confusion attacks | Tampering | Discriminated unions with compile-time narrowing |
| Prototype pollution | Tampering | Existing `hasDangerousKeys` check (unchanged) |

## Sources

### Primary (HIGH confidence)
- TypeScript Handbook - Narrowing [CITED: https://www.typescriptlang.org/docs/handbook/2/narrowing.html]
- React Reference - useMemo [CITED: https://react.dev/reference/react/useMemo]
- TypeScript 2.0 Release Notes - Discriminated Unions [CITED: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html]
- TypeScript 4.4/4.6 Release Notes - Control Flow Analysis [CITED: TypeScript docs]

### Secondary (MEDIUM confidence)
- Codebase analysis: `src/types.ts`, `src/index.ts`, `src/DashboardRoom.ts`, `src/hooks/useWebSocket.ts`
- Codebase analysis: Component files for type cast inventory

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing TypeScript/React patterns, no new dependencies
- Architecture: HIGH - Discriminated unions are TypeScript's blessed approach
- Pitfalls: HIGH - Documented TypeScript patterns with official documentation

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (TypeScript patterns are stable)
