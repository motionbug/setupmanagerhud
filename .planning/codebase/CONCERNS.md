# Codebase Concerns

**Analysis Date:** 2026-04-17

## Tech Debt

**Content-Length Header Trust:**
- Issue: Payload size limit checks `Content-Length` header rather than measuring actual streamed body size
- Files: `src/index.ts:204-206`
- Impact: Attacker can spoof `Content-Length` header to bypass 8KB limit and send larger payloads
- Fix approach: Read and measure request body stream before JSON parsing; reject if actual size exceeds limit

**Predictable Event IDs:**
- Issue: `eventId` constructed from user-controlled fields + `Date.now()`, enabling KV key collisions
- Files: `src/index.ts:244`
- Impact: Malicious actor could craft payloads to overwrite existing events in KV storage
- Fix approach: Append `crypto.randomUUID()` to eventId for guaranteed uniqueness

**No Test Suite:**
- Issue: Zero test files exist in project; no unit, integration, or e2e tests
- Files: `package.json` (no test framework dependencies), no `*.test.ts` or `*.spec.ts` files in `src/`
- Impact: Regressions undetected; refactoring is risky; no automated validation of security-critical code paths
- Fix approach: Add vitest or jest; prioritize testing `validateWebhookPayload()`, `timingSafeEqual()`, and `validateAccessJwt()`

**Duplicated KV Fetch Logic:**
- Issue: Same KV list/parse pattern repeated in `handleEvents()`, `handleStats()`, and `DashboardRoom.sendHistory()`
- Files: `src/index.ts:269-284`, `src/index.ts:291-303`, `src/DashboardRoom.ts:118-134`
- Impact: Bug fixes or improvements must be applied in multiple places; inconsistency risk
- Fix approach: Extract shared helper function for fetching and parsing events from KV

**Stats Computation on Every Request:**
- Issue: `/api/stats` fetches up to 1000 events and recomputes statistics on each request
- Files: `src/index.ts:289-344`
- Impact: Expensive operation repeated unnecessarily; potential latency spike under load
- Fix approach: Consider caching computed stats in Durable Object state with TTL, or compute incrementally on event ingestion

## Known Bugs

**No explicit bugs identified in code review.** The codebase is relatively straightforward and the threat model document confirms the functional paths work as designed.

## Security Considerations

**Webhook Token Compromise Risk (HIGH):**
- Risk: Single shared `WEBHOOK_SECRET` with no rotation mechanism, replay protection, or source binding
- Files: `src/index.ts:216-226`
- Current mitigation: Timing-safe token comparison; fails closed with 401 on mismatch
- Recommendations: Document token rotation procedure; consider multi-token support or signed payloads if Setup Manager adds support; treat token as credential (never screenshot/share in chat)

**Fail-Open Dashboard Exposure (HIGH):**
- Risk: Dashboard/API routes serve data without authentication if `CF_ACCESS_AUD` and `CF_ACCESS_TEAM_DOMAIN` are not configured
- Files: `src/index.ts:103-107`, `wrangler.toml:27-33`
- Current mitigation: README documents Access as recommended; vars are commented out by default
- Recommendations: Add fail-closed guard that refuses to serve protected routes unless Access vars are set (with explicit `--demo` or `LOCAL_DEV` override); surface `accessConfigured: boolean` in `/api/health` response

**Over-Broad Authenticated Data Exposure (MEDIUM):**
- Risk: All authenticated users see all 200 events including `userEntry` fields (userID, department, assetTag)
- Files: `src/DashboardRoom.ts:65`, `src/DashboardRoom.ts:117`, `src/types.ts:26-31`
- Current mitigation: Route-level Access control when configured
- Recommendations: Evaluate if `userEntry` fields are operationally necessary; redact before storage or response if not; add role-based filtering if scope grows beyond single trusted team

**Missing Security Headers (MEDIUM):**
- Risk: No `Content-Security-Policy`, `Strict-Transport-Security`, `Referrer-Policy`, or `Permissions-Policy` headers
- Files: `src/index.ts:19-22` (only has `X-Content-Type-Options` and `X-Frame-Options`)
- Current mitigation: Partial headers in place
- Recommendations: Add full security header set to all responses

**WAF Rate Limiting is Optional (MEDIUM):**
- Risk: README recommends Cloudflare WAF rate limiting but it's not enforced or verified
- Files: `README.md:365-391` (documentation only)
- Current mitigation: Documentation guidance
- Recommendations: Promote to deployment requirement in docs/checklists; consider application-level rate limiting as fallback

## Performance Bottlenecks

**KV List Operation Limits:**
- Problem: `/api/events` and `/api/stats` use `list({ limit: N })` which returns keys in arbitrary order
- Files: `src/index.ts:266`, `src/index.ts:291`
- Cause: KV list is eventually consistent and not guaranteed to return most recent keys first
- Improvement path: Events are sorted after fetch; for very high volume, consider pagination or prefix-based key schemes

**Client-Side Stats Recomputation:**
- Problem: Stats are recomputed on every event list change via useEffect
- Files: `src/hooks/useWebSocket.ts:97-139`
- Cause: Derived state pattern recalculates on each event array mutation
- Improvement path: Use useMemo for stats computation instead of separate useEffect; avoids extra render cycle

## Fragile Areas

**Cloudflare Access JWT Validation:**
- Files: `src/index.ts:99-196`
- Why fragile: Manual JWT parsing, signature verification, and JWKs fetching; subtle bugs could bypass auth
- Safe modification: Any changes require careful testing; consider using a well-tested JWT library if one becomes available for Workers
- Test coverage: Zero - critical security code has no automated tests

**WebSocket Message Protocol:**
- Files: `src/DashboardRoom.ts:78-107`, `src/hooks/useWebSocket.ts:32-63`
- Why fragile: Client and server must agree on message types; no schema validation on client side
- Safe modification: Changes to message format require coordinated updates to both files
- Test coverage: None

**Type Casting in Components:**
- Files: `src/components/dashboard/App.tsx:27`, `src/components/dashboard/EventsTable.tsx:134`, `src/hooks/useWebSocket.ts:106`
- Why fragile: Frequent `as WebhookPayload` type assertions bypass TypeScript safety
- Safe modification: Ensure payload shapes match expected types; consider type guards
- Test coverage: None

## Scaling Limits

**WebSocket Connections:**
- Current capacity: Single Durable Object handles all connections
- Limit: Durable Objects have connection limits (approximately 32K concurrent connections per DO)
- Scaling path: For multi-region or very high connection counts, implement DO sharding by region or tenant

**KV Storage:**
- Current capacity: 90-day TTL on events; 200-event history limit
- Limit: KV namespace has 1 billion key limit; 25MB value size limit (not an issue for this use case)
- Scaling path: Current design is adequate for typical device fleet sizes

**Event Broadcast:**
- Current capacity: All events broadcast to all connected clients
- Limit: High event volume + many clients = amplified bandwidth
- Scaling path: Consider filtering at Durable Object level or implementing subscription topics

## Dependencies at Risk

**No Critical Dependency Risks Identified:**
- All dependencies are well-maintained major libraries (React 19, Tailwind CSS 4, Vite 6, etc.)
- `@cloudflare/workers-types` tied to Workers platform, updated regularly
- `wrangler` CLI is actively maintained by Cloudflare

**Minor Concern - HugeIcons:**
- Package: `@hugeicons/core-free-icons`, `@hugeicons/react`
- Risk: Less commonly used icon library; verify continued maintenance
- Impact: Minor - only affects UI icons
- Migration plan: Could switch to lucide-react or heroicons if needed

## Missing Critical Features

**No Test Framework:**
- Problem: Cannot verify code correctness automatically
- Blocks: Confident refactoring; CI/CD quality gates; security validation

**No Health Check for Auth Configuration:**
- Problem: `/api/health` doesn't indicate whether Cloudflare Access is properly configured
- Blocks: Automated monitoring for accidental public exposure

**No Event Deletion Capability:**
- Problem: No API or UI to delete individual events or clear all events
- Blocks: GDPR compliance; data cleanup without Cloudflare dashboard access

**No Pagination:**
- Problem: Events table shows max 50 events; no way to view older events
- Blocks: Historical analysis; audit trails

## Test Coverage Gaps

**Zero Automated Tests:**
- What's not tested: Everything
- Files: All `src/*.ts` and `src/**/*.tsx` files
- Risk: Security-critical code (`validateWebhookPayload`, `timingSafeEqual`, `validateAccessJwt`) could regress without detection
- Priority: High

**Priority Testing Targets:**
1. `src/types.ts:validateWebhookPayload()` - Input validation is security boundary
2. `src/index.ts:timingSafeEqual()` - Timing-safe comparison must actually be timing-safe
3. `src/index.ts:validateAccessJwt()` - Auth bypass would be critical vulnerability
4. `src/DashboardRoom.ts:webSocketMessage()` - Message handling and size limits
5. `src/hooks/useWebSocket.ts` - Reconnection logic, event deduplication

---

*Concerns audit: 2026-04-17*
