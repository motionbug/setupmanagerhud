# Phase 3: TypeScript and Consolidation - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate unsafe type casts, add proper type guards, extract shared KV fetch logic, and fix the stats computation pattern. Type system should provide actual safety guarantees after this phase.

</domain>

<decisions>
## Implementation Decisions

### Type Guard Strategy
- **D-01:** Use discriminated unions for type narrowing — the existing `SetupManagerWebhook` union has `event` field discriminant. TypeScript narrows automatically when checking `payload.event === 'com.jamf.setupmanager.finished'`.
- **D-02:** Eliminate all 13 `as WebhookPayload` and `as StoredEvent` casts across 7 files by leveraging discriminated union narrowing.

### KV Helper Design
- **D-03:** Create standalone functions in new `src/kv.ts` module — `fetchEvents(env, limit)` and `fetchEventsByType(env, type, limit)`. No classes; aligns with existing codebase style.
- **D-04:** Single KV helper replaces duplicate patterns in DashboardRoom.ts (lines 118-125) and index.ts (lines 304-335).

### Stats Computation
- **D-05:** Replace `useEffect` + `setState` with `useMemo` in `useWebSocket.ts` (lines 97-139). Stats are derived data — compute directly from events array without intermediate state updates.

### Null Handling
- **D-06:** Add explicit guards at data boundaries (WebSocket message handling, KV reads). Trust types after validation — no defensive optional chaining throughout internal code.

### Claude's Discretion
- Specific type guard implementations per file
- KV helper error handling approach
- Whether to extract stats computation to a separate hook or keep inline

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `REQUIREMENTS.md` § TypeScript — TS-01, TS-02, TS-03, TS-04
- `REQUIREMENTS.md` § Consolidation — CONS-01, CONS-02

### Codebase Analysis
- `.planning/codebase/CONCERNS.md` § "Duplicated KV Fetch Logic" — the duplicate pattern to consolidate

### Prior Phase
- `.planning/phases/02-dead-code-removal/02-CONTEXT.md` — moderate aggression, manual audit approach

</canonical_refs>

<code_context>
## Existing Code Insights

### Unsafe Casts to Eliminate (13 total)
- `src/DashboardRoom.ts:125` — `as StoredEvent` in KV fetch
- `src/index.ts:277` — `as SetupManagerWebhook` after validation
- `src/index.ts:310,332` — `as StoredEvent` in API handlers
- `src/hooks/useWebSocket.ts:38,106,115,120` — `as StoredEvent[]`, `as WebhookPayload` (4 casts)
- `src/components/dashboard/ActionsChart.tsx:24` — `as WebhookPayload`
- `src/components/dashboard/App.tsx:27` — `as WebhookPayload`
- `src/components/dashboard/EventsTable.tsx:134` — `as WebhookPayload`
- `src/components/dashboard/Filters.tsx:67` — `as WebhookPayload[]`
- `src/components/dashboard/EventsChart.tsx:131` — `as WebhookPayload`

### Duplicate KV Patterns to Consolidate
- `src/DashboardRoom.ts` lines 118-125: `WEBHOOKS.list` + `WEBHOOKS.get` loop
- `src/index.ts` lines 304-311: Same pattern in `/api/events` handler
- `src/index.ts` lines 326-333: Same pattern in `/api/export` handler

### Stats Computation to Fix
- `src/hooks/useWebSocket.ts` lines 97-139: useEffect computes stats from events, calls setState
- Should be useMemo that derives stats directly from state.events

### Discriminated Union Already Exists
- `src/types.ts` line 45: `type SetupManagerWebhook = SetupManagerStartedWebhook | SetupManagerFinishedWebhook`
- Discriminant: `event` field (`com.jamf.setupmanager.started` vs `com.jamf.setupmanager.finished`)

</code_context>

<specifics>
## Specific Ideas

- Type narrowing should happen once at the boundary (e.g., after validation), then types flow cleanly downstream
- KV helper should handle JSON parsing internally, returning typed `StoredEvent[]`
- Stats useMemo should replace the entire useEffect block, not just parts of it

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-typescript-and-consolidation*
*Context gathered: 2026-04-17*
