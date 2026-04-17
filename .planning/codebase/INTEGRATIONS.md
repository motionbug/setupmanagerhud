# External Integrations

**Analysis Date:** 2026-04-17

## APIs & External Services

**Jamf Setup Manager:**
- Webhook events from macOS devices during enrollment
- Events: `com.jamf.setupmanager.started`, `com.jamf.setupmanager.finished`
- Endpoint: `POST /webhook`
- Auth: Optional Bearer token (`Authorization: Bearer <WEBHOOK_SECRET>`)
- Payload validation: `src/types.ts` (`validateWebhookPayload`)

**Cloudflare Access (Optional):**
- JWT validation for dashboard and API routes
- Certs endpoint: `https://{team}.cloudflareaccess.com/cdn-cgi/access/certs`
- JWT header: `Cf-Access-Jwt-Assertion`
- Implementation: `validateAccessJwt()` in `src/index.ts`

## Data Storage

**Cloudflare KV:**
- Namespace binding: `WEBHOOKS`
- Purpose: Event persistence
- TTL: 90 days (`expirationTtl: 7776000` seconds)
- Key format: `{event}:{serialNumber}:{timestamp}`
- Value: JSON `StoredEvent` object
- Access: `env.WEBHOOKS.put()`, `env.WEBHOOKS.get()`, `env.WEBHOOKS.list()`

**Cloudflare Durable Objects:**
- Class: `DashboardRoom` (`src/DashboardRoom.ts`)
- Binding: `DASHBOARD_ROOM`
- Purpose: WebSocket hub for real-time event broadcasting
- Features: Hibernation API, connection tracking
- SQLite migration: `new_sqlite_classes = ["DashboardRoom"]`

**File Storage:**
- None (static assets served from Worker via `ASSETS` binding)

**Caching:**
- None explicitly configured (KV provides edge caching)

## Authentication & Identity

**Cloudflare Access (Optional):**
- Edge authentication for dashboard routes
- Protects: `/api/*`, `/ws`, static assets
- Open endpoint: `/webhook` (devices must POST without Access)
- Configuration:
  - `CF_ACCESS_AUD` - Audience tag from Access application
  - `CF_ACCESS_TEAM_DOMAIN` - e.g., `your-team.cloudflareaccess.com`
- Validation: RSA signature verification against JWKs endpoint

**Webhook Token (Optional):**
- Secret: `WEBHOOK_SECRET` (managed via `wrangler secret put`)
- Mechanism: Bearer token in `Authorization` header
- Validation: Timing-safe HMAC comparison (`src/index.ts` `timingSafeEqual()`)

## Monitoring & Observability

**Health Check:**
- Endpoint: `GET /api/health`
- Checks: KV connectivity, Durable Object availability
- Response: `{ status, timestamp, kv, durable_objects, connections }`

**Error Tracking:**
- Console logging only (`console.error`)
- No external error tracking service

**Logs:**
- Cloudflare Workers logs (via Wrangler or dashboard)
- Server-side validation errors logged, generic messages to client

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers (edge deployment)
- Static assets bundled with Worker

**Deployment:**
- `npm run deploy` - Builds frontend, deploys via Wrangler
- CLI: `npx wrangler deploy`

**CI Pipeline:**
- None configured in repository

## Environment Configuration

**Required for Production:**
- KV namespace ID in `wrangler.toml` (create via `npm run setup`)

**Recommended for Production:**
- `CF_ACCESS_AUD` and `CF_ACCESS_TEAM_DOMAIN` for authentication
- `WEBHOOK_SECRET` for webhook validation
- Cloudflare WAF rate limiting (configured in dashboard, not code)

**Local Development:**
- `.dev.vars` file for secrets (not committed)
- Example: `.dev.vars.example` (empty, auth not required locally)

## Webhooks & Callbacks

**Incoming:**
- `POST /webhook` - Receives Jamf Setup Manager events
  - Source: macOS devices during enrollment
  - Validation: JSON schema, content-type, optional token
  - Size limit: 8 KB (`MAX_WEBHOOK_PAYLOAD_SIZE`)
  - Response: `{ success: true, eventId }` on success

**Outgoing:**
- None

## WebSocket Communication

**Client Connection:**
- Endpoint: `GET /ws` (upgrade to WebSocket)
- Protocol: `wss://` (production) or `ws://` (local dev)
- Implementation: `src/hooks/useWebSocket.ts`

**Messages from Server:**
- `{ type: "connected" }` - Initial connection acknowledgment
- `{ type: "history", data: StoredEvent[] }` - Historical events (max 200)
- `{ type: "setup-manager-event", data: StoredEvent }` - Real-time event broadcast
- `{ type: "pong" }` - Heartbeat response

**Messages from Client:**
- `{ type: "ping" }` - Heartbeat (every 30 seconds)
- `{ type: "request-history", limit: number }` - Request historical events

**Connection Management:**
- Reconnect: Exponential backoff (1s to 30s), max 10 attempts
- Message size limit: 4 KB (`MAX_WS_MESSAGE_SIZE`)

## API Endpoints

**Public (No Auth):**
- `POST /webhook` - Receive device events

**Protected (Cloudflare Access if configured):**
- `GET /api/events?limit=N` - List events (default 100, max 1000)
- `GET /api/stats` - Aggregated statistics
- `GET /api/health` - Health check
- `GET /ws` - WebSocket upgrade

## Third-Party SDKs

**None** - All integrations use:
- Native `fetch()` for HTTP
- Web Crypto API for HMAC/JWT validation
- Cloudflare Workers runtime bindings

---

*Integration audit: 2026-04-17*
