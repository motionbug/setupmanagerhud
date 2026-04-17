# Phase 3: TypeScript and Consolidation - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 9 (1 new, 8 modified)
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/kv.ts` (NEW) | utility | CRUD | `src/DashboardRoom.ts` (sendHistory) | exact |
| `src/types.ts` | types | N/A | self (existing patterns) | exact |
| `src/DashboardRoom.ts` | service | request-response | self | exact |
| `src/index.ts` | controller | request-response | self | exact |
| `src/hooks/useWebSocket.ts` | hook | event-driven | self | exact |
| `src/components/dashboard/ActionsChart.tsx` | component | transform | `src/components/dashboard/EventsChart.tsx` | exact |
| `src/components/dashboard/App.tsx` | component | transform | self | exact |
| `src/components/dashboard/EventsTable.tsx` | component | transform | self | exact |
| `src/components/dashboard/Filters.tsx` | component | transform | self | exact |
| `src/components/dashboard/EventsChart.tsx` | component | transform | self | exact |

## Pattern Assignments

### `src/kv.ts` (NEW) (utility, CRUD)

**Analog:** `src/DashboardRoom.ts` lines 117-137

This new file extracts the KV fetch pattern that is duplicated in DashboardRoom.ts and index.ts.

**Imports pattern** (from analog + types.ts):
```typescript
import type { StoredEvent } from "./types";
```

**Env interface pattern** (from DashboardRoom.ts lines 3-5):
```typescript
interface KVEnv {
  WEBHOOKS: KVNamespace;
}
```

**Core KV fetch pattern** (DashboardRoom.ts lines 118-134):
```typescript
const list = await this.env.WEBHOOKS.list({ limit });

const events = await Promise.all(
  list.keys.map(async (key) => {
    const data = await this.env.WEBHOOKS.get(key.name);
    if (!data) return null;
    try {
      return JSON.parse(data) as StoredEvent;
    } catch {
      return null;
    }
  })
);

const validEvents = events
  .filter((e): e is StoredEvent => e !== null)
  .sort((a, b) => b.timestamp - a.timestamp);
```

**Error handling pattern** (DashboardRoom.ts lines 124-127):
```typescript
try {
  return JSON.parse(data) as StoredEvent;
} catch {
  return null;
}
```

**Type guard filter pattern** (DashboardRoom.ts line 133):
```typescript
.filter((e): e is StoredEvent => e !== null)
```

---

### `src/types.ts` (types, N/A)

**Analog:** Self (existing patterns)

Add new type guard function and export union variants for discriminated union narrowing.

**Existing discriminated union** (lines 6-45):
```typescript
interface SetupManagerStartedWebhook {
  name: "Started";
  event: "com.jamf.setupmanager.started";
  // ... fields
}

interface SetupManagerFinishedWebhook extends Omit<SetupManagerStartedWebhook, 'name' | 'event'> {
  name: "Finished";
  event: "com.jamf.setupmanager.finished";
  duration: number;
  finished: string;
  // ... additional fields
}

export type SetupManagerWebhook = SetupManagerStartedWebhook | SetupManagerFinishedWebhook;
```

**Type guard pattern** (follow existing isNonEmptyString at lines 90-92):
```typescript
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
```

**New type guard to add** (pattern from TypeScript docs):
```typescript
export function isFinishedWebhook(
  payload: SetupManagerWebhook
): payload is SetupManagerFinishedWebhook {
  return payload.event === "com.jamf.setupmanager.finished";
}
```

**Export pattern for interfaces** (new exports needed):
```typescript
export type { SetupManagerStartedWebhook, SetupManagerFinishedWebhook };
```

---

### `src/DashboardRoom.ts` (service, request-response)

**Analog:** Self

Replace inline KV fetch with imported helper. Remove `as StoredEvent` cast.

**Current cast to eliminate** (line 125):
```typescript
return JSON.parse(data) as StoredEvent;
```

**Import pattern to add** (based on existing line 1):
```typescript
import type { StoredEvent } from "./types";
import { fetchEvents } from "./kv";
```

**Current sendHistory method** (lines 117-137) to simplify:
```typescript
private async sendHistory(ws: WebSocket, limit = 200): Promise<void> {
  const list = await this.env.WEBHOOKS.list({ limit });

  const events = await Promise.all(
    list.keys.map(async (key) => {
      const data = await this.env.WEBHOOKS.get(key.name);
      if (!data) return null;
      try {
        return JSON.parse(data) as StoredEvent;
      } catch {
        return null;
      }
    })
  );

  const validEvents = events
    .filter((e): e is StoredEvent => e !== null)
    .sort((a, b) => b.timestamp - a.timestamp);

  ws.send(JSON.stringify({ type: "history", data: validEvents }));
}
```

---

### `src/index.ts` (controller, request-response)

**Analog:** Self

Three areas to update:
1. Replace post-validation cast with proper typing
2. Replace handleEvents KV fetch with helper
3. Replace handleStats KV fetch with helper

**Cast to eliminate at line 277**:
```typescript
const webhookPayload = payload as SetupManagerWebhook;
```

**Better pattern** (validation returns narrowed type):
```typescript
// After validateWebhookPayload returns valid: true, payload is SetupManagerWebhook
// TypeScript can be told this via assertion function or returning typed result
```

**Duplicate KV pattern in handleEvents** (lines 304-319):
```typescript
const list = await env.WEBHOOKS.list({ limit });
const events = await Promise.all(
  list.keys.map(async (key) => {
    const data = await env.WEBHOOKS.get(key.name);
    if (!data) return null;
    try {
      return JSON.parse(data) as StoredEvent;
    } catch {
      return null;
    }
  })
);

const validEvents = events
  .filter((e): e is StoredEvent => e !== null)
  .sort((a, b) => b.timestamp - a.timestamp);
```

**Duplicate KV pattern in handleStats** (lines 326-339):
```typescript
// Same pattern as handleEvents
```

**Import pattern to add**:
```typescript
import { fetchEvents } from "./kv";
```

---

### `src/hooks/useWebSocket.ts` (hook, event-driven)

**Analog:** Self

Replace useEffect stats computation with useMemo.

**Current stats pattern with useEffect** (lines 96-139):
```typescript
// Compute stats from events
useEffect(() => {
  const started = state.events.filter(
    (e) => e.payload.event === "com.jamf.setupmanager.started"
  );
  const finished = state.events.filter(
    (e) => e.payload.event === "com.jamf.setupmanager.finished"
  );

  const durations = finished
    .map((e) => (e.payload as WebhookPayload).duration)
    .filter((d): d is number => typeof d === "number" && d > 0);

  // ... more computation ...

  setState((prev) => ({
    ...prev,
    stats: {
      total: prev.events.length,
      started: started.length,
      finished: finished.length,
      avgDuration,
      successRate,
      failedActions,
    },
  }));
}, [state.events]);
```

**Casts to eliminate** (lines 106, 115, 120):
```typescript
(e.payload as WebhookPayload).duration
(e.payload as WebhookPayload).enrollmentActions || []
(e.payload as WebhookPayload).enrollmentActions?.length || 0
```

**useMemo pattern from React docs**:
```typescript
const stats = useMemo(() => {
  // computation here
  return { total, started, finished, avgDuration, successRate, failedActions };
}, [events]);
```

**Import to add**:
```typescript
import { isFinishedWebhook } from "@/types";
```

**Cast at line 38 to address**:
```typescript
const uniqueEvents = (message.data as StoredEvent[]).filter((e) => {
```

---

### `src/components/dashboard/ActionsChart.tsx` (component, transform)

**Analog:** `src/components/dashboard/EventsChart.tsx`

**Cast to eliminate** (line 24):
```typescript
.flatMap((e) => (e.payload as WebhookPayload).enrollmentActions || [])
```

**Pattern for type narrowing** (from EventsChart.tsx line 111-112):
```typescript
const finishedEvents = events.filter(
  (e) => e.payload.event === "com.jamf.setupmanager.finished"
);
```

**Better pattern with type guard**:
```typescript
import { isFinishedWebhook } from "@/types";

const finishedEvents = events.filter((e) => isFinishedWebhook(e.payload));
// Now e.payload is SetupManagerFinishedWebhook
// e.payload.enrollmentActions is safe to access
```

---

### `src/components/dashboard/App.tsx` (component, transform)

**Analog:** Self

**Cast to eliminate** (line 27):
```typescript
const payload = event.payload as WebhookPayload;
```

**Pattern for accessing union fields safely**:
```typescript
// For fields common to both variants, access directly:
const payload = event.payload;
payload.macOSVersion  // exists on both Started and Finished
payload.modelName     // exists on both

// For Finished-only fields, check discriminant first:
if (payload.event === "com.jamf.setupmanager.finished") {
  payload.enrollmentActions  // TypeScript knows this exists
}
```

**Import to add**:
```typescript
import type { SetupManagerWebhook } from "@/types";
```

---

### `src/components/dashboard/EventsTable.tsx` (component, transform)

**Analog:** Self

**Cast to eliminate** (line 134):
```typescript
const payload = event.payload as WebhookPayload;
```

**EventDetail component pattern** (line 251):
```typescript
function EventDetail({ payload }: { payload: WebhookPayload }) {
```

**Better pattern**: Change prop type and handle fields conditionally:
```typescript
function EventDetail({ payload }: { payload: SetupManagerWebhook }) {
  // Access common fields directly
  // For finished-only fields, check or use optional chaining
}
```

---

### `src/components/dashboard/Filters.tsx` (component, transform)

**Analog:** Self

**Cast to eliminate** (line 67):
```typescript
const csv = toCsv(data as WebhookPayload[]);
```

**Pattern**: The toCsv function works with any payload shape since it accesses fields by string key. Cast can be eliminated by typing the function parameter more loosely or using the union type.

---

### `src/components/dashboard/EventsChart.tsx` (component, transform)

**Analog:** Self

**Cast to eliminate** (line 131):
```typescript
const payload = e.payload as WebhookPayload;
```

**Context**: Inside createTimeBuckets where events are already filtered to finished only:
```typescript
const finishedEvents = events.filter(
  (e) => e.payload.event === "com.jamf.setupmanager.finished"
);
// But filter doesn't narrow the type in the map callback
```

**Pattern for narrowing after filter**:
```typescript
// Option 1: Use type guard that returns type predicate
const finishedEvents = events.filter(
  (e): e is StoredEvent & { payload: SetupManagerFinishedWebhook } =>
    e.payload.event === "com.jamf.setupmanager.finished"
);

// Option 2: Use isFinishedWebhook in the map
const eventTimes = events
  .filter((e) => isFinishedWebhook(e.payload))
  .map((e) => {
    // TypeScript still needs help here
    const payload = e.payload as SetupManagerFinishedWebhook; // acceptable after guard
    // ...
  });
```

---

## Shared Patterns

### Type Guard for Finished Webhooks
**Source:** New addition to `src/types.ts`
**Apply to:** All component files, useWebSocket.ts

```typescript
export function isFinishedWebhook(
  payload: SetupManagerWebhook
): payload is SetupManagerFinishedWebhook {
  return payload.event === "com.jamf.setupmanager.finished";
}
```

### KV Fetch Helper
**Source:** New `src/kv.ts` (extracted from DashboardRoom.ts)
**Apply to:** DashboardRoom.ts, index.ts (handleEvents, handleStats)

```typescript
export async function fetchEvents(
  env: { WEBHOOKS: KVNamespace },
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

### useMemo for Derived State
**Source:** React best practices
**Apply to:** useWebSocket.ts stats computation

```typescript
const stats = useMemo(() => {
  const started = events.filter(
    (e) => e.payload.event === "com.jamf.setupmanager.started"
  );
  const finished = events.filter(
    (e) => isFinishedWebhook(e.payload)
  );
  
  // Compute derived values...
  
  return { total, started: started.length, finished: finished.length, avgDuration, successRate, failedActions };
}, [events]);
```

### Discriminated Union Narrowing Pattern
**Source:** TypeScript handbook
**Apply to:** All files that access payload fields

```typescript
// Check discriminant to narrow type
if (payload.event === "com.jamf.setupmanager.finished") {
  // TypeScript knows: payload is SetupManagerFinishedWebhook
  payload.duration;           // number (required)
  payload.enrollmentActions;  // EnrollmentAction[] | undefined
}
```

---

## Test Patterns

### Unit Test Structure
**Source:** `src/types.test.ts` lines 1-26

```typescript
import { describe, it, expect } from "vitest";
import { validateWebhookPayload } from "./types";

// Base valid payloads for reuse
const validStartedPayload = {
  name: "Started" as const,
  event: "com.jamf.setupmanager.started" as const,
  // ...
};

describe("validateWebhookPayload", () => {
  describe("valid payloads", () => {
    it("accepts valid started webhook", () => {
      const result = validateWebhookPayload(validStartedPayload);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
```

### KV Helper Tests (new file pattern)
**Source:** Follow `src/types.test.ts` structure

```typescript
import { describe, it, expect, vi } from "vitest";
import { fetchEvents } from "./kv";

const mockKV = {
  list: vi.fn(),
  get: vi.fn(),
};

describe("fetchEvents", () => {
  it("returns empty array when KV is empty", async () => {
    mockKV.list.mockResolvedValue({ keys: [] });
    const events = await fetchEvents({ WEBHOOKS: mockKV as unknown as KVNamespace });
    expect(events).toEqual([]);
  });
  
  it("filters out invalid JSON", async () => {
    // ...
  });
});
```

---

## No Analog Found

All files have analogs in the existing codebase. The patterns are well-established.

---

## Metadata

**Analog search scope:** `src/`
**Files scanned:** 13 source files
**Pattern extraction date:** 2026-04-17

### Key Insights

1. **Discriminated union already exists** - `SetupManagerWebhook` with `event` field discriminant is properly defined. Code just needs to use narrowing instead of casting.

2. **KV fetch pattern is identical in 3 places** - DashboardRoom.sendHistory, index.handleEvents, index.handleStats all use the same list-then-get-then-filter pattern.

3. **Stats computation is derived data** - Current useEffect causes extra render. Direct useMemo computation is cleaner.

4. **WebhookPayload is a flat convenience type** - It was created to make UI code easier but bypasses type safety. The discriminated union provides actual safety guarantees.

5. **Test patterns are established** - Vitest with describe/it/expect, mocking via vi.fn(), clear test organization by category.
