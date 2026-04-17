---
phase: 01-test-foundation-and-security-hardening
reviewed: 2026-04-17T14:30:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - package.json
  - src/index.test.ts
  - src/index.ts
  - src/security-headers.test.ts
  - src/types.test.ts
  - tsconfig.json
  - vitest.config.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-04-17T14:30:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

This review covers the test foundation and security hardening phase for Setup Manager HUD. The reviewed files include the core Worker entry point (`src/index.ts`), validation logic tests (`src/types.test.ts`), security function tests (`src/index.test.ts`), security header tests (`src/security-headers.test.ts`), and configuration files (`package.json`, `tsconfig.json`, `vitest.config.ts`).

Overall, the code demonstrates solid security practices including timing-safe token comparison, prototype pollution guards, comprehensive JWT validation, and security headers. The test coverage is thorough with good edge case handling. However, there are two warnings related to documented security concerns (fail-open authentication and Content-Length trust) and some minor info-level items.

## Warnings

### WR-01: Fail-Open Authentication Pattern (Documented T2)

**File:** `src/index.ts:142`
**Issue:** The `validateAccessJwt` function returns `null` (allowing access) when `CF_ACCESS_AUD` or `CF_ACCESS_TEAM_DOMAIN` are not configured. This "fail-open" pattern means the dashboard serves data without authentication if these environment variables are accidentally unset in production. While documented in CLAUDE.md as T2, this is a deployment risk.

**Fix:** Add a fail-closed guard with explicit override for development:
```typescript
// Early in validateAccessJwt or at route level:
const localDev = env.LOCAL_DEV === "true";
if (!aud || !teamDomain) {
  if (!localDev) {
    return new Response("Access not configured", { status: 500 });
  }
  return null; // Allow in local dev mode
}
```

### WR-02: Content-Length Header Trust (Documented T3)

**File:** `src/index.ts:239-241`
**Issue:** The payload size limit check trusts the `Content-Length` header, which can be spoofed by an attacker:
```typescript
const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
if (contentLength > MAX_WEBHOOK_PAYLOAD_SIZE) {
```
An attacker could set `Content-Length: 100` but send an 8MB body, potentially causing memory pressure.

**Fix:** Read and measure the actual body stream before parsing:
```typescript
const body = await request.text();
if (body.length > MAX_WEBHOOK_PAYLOAD_SIZE) {
  return json({ error: "Payload too large" }, 413, request);
}
let payload: unknown;
try {
  payload = JSON.parse(body);
} catch {
  return json({ error: "Invalid JSON payload" }, 400, request);
}
```

## Info

### IN-01: Unused Import in Test File

**File:** `src/security-headers.test.ts:2`
**Issue:** The `env` import from `"cloudflare:workers"` is imported but never used:
```typescript
import { exports, env } from "cloudflare:workers";
```
Only `exports` is used in the tests.

**Fix:** Remove the unused import:
```typescript
import { exports } from "cloudflare:workers";
```

### IN-02: Test Coverage Gap for OPTIONS Preflight

**File:** `src/index.ts:449-451`
**Issue:** The OPTIONS preflight handler is not covered by the test files reviewed. While not a bug, this is a coverage gap for the CORS preflight functionality.

**Fix:** Add test coverage for OPTIONS requests:
```typescript
it("returns CORS headers for same-origin OPTIONS request", async () => {
  const response = await exports.default.fetch("http://localhost/api/events", {
    method: "OPTIONS",
    headers: { Origin: "http://localhost" },
  });
  expect(response.status).toBe(200);
  expect(response.headers.has("Access-Control-Allow-Origin")).toBe(true);
});
```

### IN-03: Magic Number for KV Expiration TTL

**File:** `src/index.ts:285`
**Issue:** The KV expiration TTL uses a magic number calculation inline:
```typescript
expirationTtl: 60 * 60 * 24 * 90,
```
While the constant `MAX_WEBHOOK_PAYLOAD_SIZE` is defined at the top of the file, this TTL value is embedded inline, making it harder to find and update.

**Fix:** Extract to a named constant at the top of the file (consistent with CLAUDE.md documentation):
```typescript
/** KV expiration TTL in seconds (90 days) */
const KV_EXPIRATION_TTL = 60 * 60 * 24 * 90; // 7776000 seconds

// Later, in handleWebhook:
await env.WEBHOOKS.put(eventId, JSON.stringify(storedEvent), {
  expirationTtl: KV_EXPIRATION_TTL,
});
```

## Observations (No Action Required)

The following items were reviewed and found to be correctly implemented:

1. **Timing-safe token comparison** (`src/index.ts:101-126`): The `timingSafeEqual` function correctly uses HMAC-SHA256 digests for constant-time comparison, preventing timing attacks on the webhook secret.

2. **Prototype pollution guards** (`src/types.ts:144-153`): The `hasDangerousKeys` function and its integration into `validateWebhookPayload` correctly rejects `__proto__`, `constructor`, and `prototype` keys.

3. **Security headers** (`src/index.ts:19-57`): All recommended security headers are present and correctly configured:
   - Content-Security-Policy with restrictive directives
   - Strict-Transport-Security (HSTS) with 1-year max-age and includeSubDomains
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy disabling unused browser features

4. **Event ID unpredictability** (`src/index.ts:279-280`): The eventId now includes `crypto.randomUUID()` preventing collision attacks (per documented Finding 5 fix).

5. **Test coverage for validation** (`src/types.test.ts`): Comprehensive test coverage including prototype pollution, required fields, type validation, event type matching, timestamp validation, and optional field handling.

6. **Vitest configuration** (`vitest.config.ts`): Correctly configured for Cloudflare Workers pool with wrangler integration.

7. **TypeScript configuration** (`tsconfig.json`): Strict mode enabled with appropriate module resolution and type definitions.

---

_Reviewed: 2026-04-17T14:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
