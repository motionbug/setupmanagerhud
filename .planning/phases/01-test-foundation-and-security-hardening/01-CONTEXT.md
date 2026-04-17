# Phase 1: Test Foundation and Security Hardening - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish a test safety net for security-critical code paths and close documented security gaps from the security audit. Tests cover the three security boundary functions (validateWebhookPayload, timingSafeEqual, validateAccessJwt). Security hardening adds the four required HTTP headers and fixes predictable event IDs.

</domain>

<decisions>
## Implementation Decisions

### Test Framework Setup
- **D-01:** Use `@cloudflare/vitest-pool-workers` for testing — official Cloudflare integration that runs tests in the real Workers runtime with actual bindings (KV, Durable Objects)
- **D-02:** Colocate test files with source (e.g., `src/types.test.ts`, `src/index.test.ts`) — tests next to implementation for discoverability

### Security Headers
- **D-03:** HSTS max-age set to 1 year (31536000 seconds) with includeSubDomains — standard production value

### Event ID Randomness
- **D-04:** Append UUID to existing event ID format: `event:serial:timestamp:uuid` — preserves sortability and context while adding unpredictability

### Claude's Discretion
- CSP policy strictness — Claude determines appropriate strictness based on what the dashboard actually loads (Tailwind, fonts, etc.)
- Referrer-Policy and Permissions-Policy values — standard secure defaults
- Test organization beyond the three required security functions

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Security Audit
- `CLAUDE.md` § "Security Hardening Applied" — documents existing security measures
- `CLAUDE.md` § "Outstanding Security Findings" — T1-T4 findings, Finding 5 (event IDs), Finding 9 (headers)

### Cloudflare Workers Testing
- `@cloudflare/vitest-pool-workers` npm package docs — official integration for Workers testing

</canonical_refs>

<code_context>
## Existing Code Insights

### Security Functions to Test
- `validateWebhookPayload()` in `src/types.ts` (lines 159-254) — validates webhook payloads, checks for prototype pollution
- `timingSafeEqual()` in `src/index.ts` (lines 66-91) — HMAC-based constant-time comparison
- `validateAccessJwt()` in `src/index.ts` (lines 99-196) — Cloudflare Access JWT validation

### Security Headers Location
- `SECURITY_HEADERS` constant in `src/index.ts` (lines 19-22) — currently only has X-Content-Type-Options and X-Frame-Options
- Headers applied via `json()` helper and need to be added to other response paths

### Event ID Generation
- Line 244 in `src/index.ts`: `const eventId = \`\${webhookPayload.event}:\${webhookPayload.serialNumber}:\${timestamp}\``
- Needs `crypto.randomUUID()` appended

### Integration Points
- Tests will need to mock or use actual KV bindings via `@cloudflare/vitest-pool-workers`
- Durable Objects testing may require additional configuration

</code_context>

<specifics>
## Specific Ideas

- Test coverage must verify prototype pollution rejection (DANGEROUS_KEYS check)
- timingSafeEqual tests should prove timing behavior doesn't leak information
- validateAccessJwt tests need coverage for: valid tokens, expired tokens, invalid signatures, missing keys

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-test-foundation-and-security-hardening*
*Context gathered: 2026-04-17*
