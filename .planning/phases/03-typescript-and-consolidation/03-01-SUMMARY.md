---
phase: 03-typescript-and-consolidation
plan: 01
subsystem: types, kv
tags: [typescript, type-guards, kv, testing]

dependency_graph:
  requires: []
  provides:
    - "isFinishedWebhook type guard"
    - "isStartedWebhook type guard"
    - "SetupManagerStartedWebhook export"
    - "SetupManagerFinishedWebhook export"
    - "fetchEvents KV helper"
  affects:
    - "src/DashboardRoom.ts (can now use fetchEvents)"
    - "src/index.ts (can now use fetchEvents and type guards)"
    - "src/components/* (can now use type guards)"

tech_stack:
  added: []
  patterns:
    - "Type guards for discriminated union narrowing"
    - "Centralized KV fetch with shape validation"

key_files:
  created:
    - src/kv.ts
    - src/kv.test.ts
  modified:
    - src/types.ts

decisions:
  - "Export union variants to enable external type narrowing"
  - "Add both isFinishedWebhook and isStartedWebhook for completeness"
  - "Shape validation in fetchEvents checks payload.event, timestamp, eventId"
  - "Narrow KVEnv interface for fetchEvents (only requires WEBHOOKS binding)"

metrics:
  duration: "2m 25s"
  completed: "2026-04-17T15:04:14Z"
---

# Phase 03 Plan 01: Type Guards and KV Helper Summary

Type infrastructure for discriminated union narrowing and centralized KV fetch helper with shape validation and unit tests.

## Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Add type guards and export union variants | ad37c27 | Export `SetupManagerStartedWebhook`, `SetupManagerFinishedWebhook`; add `isFinishedWebhook()`, `isStartedWebhook()` |
| 2 | Create KV fetch helper module | 80b7f92 | New `src/kv.ts` with `fetchEvents()` function |
| 3 | Add unit tests for KV helper | 4642825 | New `src/kv.test.ts` with 9 tests covering all edge cases |

## Implementation Details

### Type Guards (src/types.ts)

Added two type guards for safe discriminated union narrowing:

```typescript
export function isFinishedWebhook(
  payload: SetupManagerWebhook
): payload is SetupManagerFinishedWebhook {
  return payload.event === "com.jamf.setupmanager.finished";
}

export function isStartedWebhook(
  payload: SetupManagerWebhook
): payload is SetupManagerStartedWebhook {
  return payload.event === "com.jamf.setupmanager.started";
}
```

These replace unsafe `as WebhookPayload` casts with proper type narrowing.

### KV Helper (src/kv.ts)

Centralized KV fetch logic with:
- Narrow `KVEnv` interface (only requires `WEBHOOKS` binding)
- Graceful handling of null KV entries
- Graceful handling of malformed JSON
- Shape validation before casting (checks `payload.event`, `timestamp`, `eventId`)
- Sorted results (newest first)
- Configurable limit parameter (default: 200)

### Test Coverage (src/kv.test.ts)

9 unit tests covering:
- Empty KV returns empty array
- Valid events returned correctly
- Events sorted by timestamp descending
- Null entries filtered out
- Invalid JSON filtered out
- Missing payload.event filtered out
- Missing timestamp filtered out
- Custom limit parameter
- Default limit of 200

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `npm run typecheck`: Pre-existing errors in `security-headers.test.ts` (unrelated to this plan)
- `npm test -- src/kv.test.ts`: 9/9 tests passing
- `npm test`: 107/107 tests passing (full suite)

## Dependencies for Next Plans

Plan 02 can now:
1. Import `fetchEvents` from `src/kv.ts` to replace duplicate KV logic in DashboardRoom.ts and index.ts
2. Use `isFinishedWebhook()` and `isStartedWebhook()` instead of unsafe casts
3. Import `SetupManagerStartedWebhook` and `SetupManagerFinishedWebhook` for explicit type annotations

## Self-Check: PASSED

- [x] src/kv.ts exists
- [x] src/kv.test.ts exists
- [x] Commit ad37c27 exists (Task 1)
- [x] Commit 80b7f92 exists (Task 2)
- [x] Commit 4642825 exists (Task 3)
