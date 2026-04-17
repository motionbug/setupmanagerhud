# Architecture

**Analysis Date:** 2026-04-17

## Pattern Overview

**Overall:** Edge-First Real-Time Dashboard (Cloudflare Workers + React SPA)

**Key Characteristics:**
- Serverless edge compute via Cloudflare Workers for API and static asset serving
- Durable Objects for WebSocket connection management and real-time broadcast
- KV storage for event persistence with automatic TTL expiration
- Single-page React application with client-side state management
- Same-origin deployment (Worker serves both API and frontend)

## Layers

**Edge Layer (Cloudflare Workers):**
- Purpose: HTTP routing, authentication, webhook ingestion, WebSocket upgrade
- Location: `src/index.ts`
- Contains: Request handlers, CORS logic, JWT validation, response helpers
- Depends on: Types (`src/types.ts`), DashboardRoom Durable Object
- Used by: External devices (webhook), dashboard frontend (API, WebSocket)

**Real-Time Layer (Durable Objects):**
- Purpose: WebSocket connection hub, event broadcast, connection state
- Location: `src/DashboardRoom.ts`
- Contains: WebSocket lifecycle handlers, history retrieval, broadcast logic
- Depends on: KV namespace (WEBHOOKS), Types (`src/types.ts`)
- Used by: Worker entry point for WebSocket upgrades and broadcasts

**Persistence Layer (Cloudflare KV):**
- Purpose: Event storage with 90-day TTL
- Location: Configured in `wrangler.toml` (binding: `WEBHOOKS`)
- Contains: Serialized `StoredEvent` objects keyed by `eventId`
- Depends on: Nothing
- Used by: Worker (write), DashboardRoom (read), API handlers (read)

**Shared Types Layer:**
- Purpose: TypeScript interfaces, validation functions, type guards
- Location: `src/types.ts`
- Contains: Webhook payload types, validation logic, UI state types
- Depends on: Nothing
- Used by: All other layers

**Frontend Layer (React SPA):**
- Purpose: Real-time dashboard UI, event visualization, filtering
- Location: `src/components/`, `src/hooks/`, `src/main.tsx`
- Contains: React components, custom hooks, styles
- Depends on: WebSocket connection, shared types
- Used by: End users via browser

## Data Flow

**Webhook Ingestion:**

1. Device POSTs to `/webhook` with JSON payload
2. Worker validates Content-Type, payload size, optional Bearer token
3. `validateWebhookPayload()` validates structure and required fields
4. Event stored in KV with key `{event}:{serialNumber}:{timestamp}`
5. Worker fetches DashboardRoom Durable Object via internal `/broadcast`
6. DashboardRoom broadcasts `setup-manager-event` to all connected WebSockets
7. Worker returns `{ success: true, eventId }` to device

**Dashboard Connection:**

1. Browser loads SPA from Worker (served via `env.ASSETS`)
2. `useWebSocket` hook initiates WebSocket connection to `/ws`
3. Worker validates Cloudflare Access JWT (if configured)
4. Worker upgrades connection, forwards to DashboardRoom
5. DashboardRoom sends `connected` message and fetches history from KV
6. DashboardRoom sends `history` message with up to 200 events
7. Client receives events, computes stats, renders UI

**Real-Time Updates:**

1. New webhook arrives (see Webhook Ingestion flow)
2. DashboardRoom broadcasts to all WebSocket connections
3. Client `useWebSocket` receives `setup-manager-event` message
4. State updated via React setState, deduplication by eventId
5. Stats recomputed in useEffect based on events array

**State Management:**
- Server: Stateless Workers, stateful DashboardRoom (WebSocket connections only)
- Client: React useState for UI state, events array managed by useWebSocket hook
- Persistence: KV stores events, DashboardRoom reads on-demand (no in-memory cache)

## Key Abstractions

**StoredEvent:**
- Purpose: Normalized event wrapper stored in KV and sent to clients
- Examples: `src/types.ts` (line 47-51)
- Pattern: Envelope pattern with payload, timestamp, eventId

**SetupManagerWebhook:**
- Purpose: Union type for Started/Finished webhook payloads
- Examples: `src/types.ts` (line 6-45)
- Pattern: Discriminated union on `event` field

**DashboardRoom Durable Object:**
- Purpose: Single instance per "room" managing all WebSocket connections
- Examples: `src/DashboardRoom.ts`
- Pattern: Hibernation API for efficient WebSocket management

**FilterState:**
- Purpose: Client-side filter configuration
- Examples: `src/types.ts` (line 265-271)
- Pattern: Plain object passed through React state

## Entry Points

**Worker Entry (`src/index.ts`):**
- Location: `src/index.ts` (default export, line 409-445)
- Triggers: Every HTTP request to the Worker
- Responsibilities: Route matching, authentication, handler dispatch, CORS

**React Entry (`src/main.tsx`):**
- Location: `src/main.tsx`
- Triggers: Browser loading `index.html`
- Responsibilities: Mount React app to DOM, import global styles

**WebSocket Entry (`DashboardRoom.fetch`):**
- Location: `src/DashboardRoom.ts` (line 16-73)
- Triggers: WebSocket upgrade requests forwarded from Worker
- Responsibilities: Accept connection, send history, handle messages

## Error Handling

**Strategy:** Fail-safe with generic client responses, detailed server-side logging

**Patterns:**
- Validation errors: Log details server-side, return generic "Invalid webhook payload" to client
- WebSocket errors: Try-catch in message handlers, log and continue
- KV failures: Return null for missing data, filter out invalid JSON
- Auth failures: Return 403 with specific error (Access) or 401 (webhook token)
- Payload size: Check Content-Length header, return 413 if exceeded

## Cross-Cutting Concerns

**Logging:** `console.error()` for errors, no structured logging framework. Cloudflare Workers logs visible in dashboard/wrangler tail.

**Validation:** Centralized in `src/types.ts` via `validateWebhookPayload()`. Checks required fields, types, prototype pollution keys, timestamp formats.

**Authentication:**
- Dashboard routes: Cloudflare Access JWT validation when `CF_ACCESS_AUD` and `CF_ACCESS_TEAM_DOMAIN` are configured
- Webhook route: Optional Bearer token validation against `WEBHOOK_SECRET` env var
- Access skipped if env vars not set (fail-open, documented security concern)

**Security Headers:** Applied to all JSON responses via `SECURITY_HEADERS` constant (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).

**CORS:** Same-origin only. `getCorsHeaders()` compares request Origin to Worker's own origin, returns empty headers for cross-origin requests.

---

*Architecture analysis: 2026-04-17*
