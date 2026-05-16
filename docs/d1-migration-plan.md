# D1 Event Store Migration Plan

## Goal

Move Setup Manager HUD's canonical webhook event storage from Cloudflare Workers KV to Cloudflare D1.

KV is acceptable for a small MVP event buffer, but it is not the right long-term store for high-frequency structured event logs. D1 gives the dashboard a transactional SQL store, stronger query semantics, indexed filtering, and a better free-tier write profile for enrollment bursts.

## Target Architecture

```text
Setup Manager device
  -> POST /webhook
  -> Worker validates token, content type, size, and payload shape
  -> Worker inserts normalized event row into D1
  -> Worker broadcasts the stored event through DashboardRoom
  -> Connected dashboard clients update over WebSocket

Dashboard load/reconnect
  -> WebSocket connects to DashboardRoom
  -> DashboardRoom reads recent history from D1
  -> DashboardRoom sends history to client

Dashboard APIs
  -> /api/events reads paged/filterable events from D1
  -> /api/stats computes aggregate metrics from D1
  -> /api/health checks D1 and Durable Object bindings
```

## Storage Responsibilities

- **D1**: canonical event history, normalized query columns, full raw webhook payload JSON, stats queries, server-side filtering, pagination, and retention cleanup.
- **Durable Object**: WebSocket connection coordination, live broadcast fanout, connection counts, recent-history delivery on WebSocket connect.
- **KV**: no longer required for event persistence. It may be reintroduced later only for cache/config data if needed.

## Initial D1 Schema

Store one row per webhook event. Keep the full raw payload in `payload_json`, while also extracting dashboard-critical fields into indexed columns:

- event id
- event type/name
- received timestamp
- serial number
- model name and identifier
- macOS version/build
- Setup Manager version
- started/finished times
- duration
- computer/user/department fields
- upload/download throughput
- failed-action flag

Indexes should support the dashboard's common access paths:

- newest events
- event type
- serial number
- macOS version
- model
- failed events

## Implementation Steps

1. Add D1 binding to `wrangler.toml` with placeholder database ID.
2. Add SQL migration under `migrations/`.
3. Replace `src/kv.ts` with a D1-backed event storage module.
4. Update `src/index.ts` to insert webhook events into D1 and query D1 for APIs.
5. Update `src/DashboardRoom.ts` to load history from D1.
6. Update tests from KV mocks to D1 mocks or Cloudflare D1 test bindings.
7. Update `/api/health` to report D1 status instead of KV status.
8. Update README setup, architecture, troubleshooting, and cleanup language from KV to D1.
9. Run `npm run typecheck` and `npm test`.

## Future Enhancements

- Cursor pagination for large histories.
- Optional Queue or Durable Object ingestion buffer if real production bursts require batching.

## Rollout Notes

This is a deployment-affecting change. Customers will need to create and bind a D1 database before deploying the new Worker. This is a new project, so no KV-to-D1 data migration path is planned.
