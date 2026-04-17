---
phase: 01-test-foundation-and-security-hardening
plan: 03
subsystem: security
tags:
  - security-headers
  - csp
  - hsts
  - event-id
  - uuid
dependency_graph:
  requires:
    - 01-01 (Vitest test framework)
  provides:
    - Content-Security-Policy header on all responses
    - Strict-Transport-Security header with 1-year max-age
    - Referrer-Policy header
    - Permissions-Policy header
    - Cryptographically random event IDs
  affects:
    - src/index.ts
    - All HTTP responses
tech_stack:
  added: []
  patterns:
    - Security headers constant with CSP, HSTS, Referrer-Policy, Permissions-Policy
    - crypto.randomUUID() for unpredictable event IDs
key_files:
  created:
    - src/security-headers.test.ts
  modified:
    - src/index.ts
    - tsconfig.json
decisions:
  - CSP allows 'unsafe-inline' for scripts and styles (required for Tailwind v4 runtime)
  - HSTS set to 1 year with includeSubDomains per D-03
  - Event ID format: event:serial:timestamp:uuid preserves sortability while adding unpredictability
metrics:
  duration_minutes: 4
  completed: 2026-04-17T11:56:57Z
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
  tests_added: 9
---

# Phase 01 Plan 03: Security Headers and Event ID Hardening Summary

Security headers added to all HTTP responses (CSP, HSTS, Referrer-Policy, Permissions-Policy) and event IDs now include crypto.randomUUID() to prevent collision attacks.

## Tasks Completed

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Add security headers | b6fc1c7 | SECURITY_HEADERS constant with 6 headers; asset responses also include headers |
| 2 | Fix predictable event IDs | a64e37b | crypto.randomUUID() appended to event ID format |
| 3 | Create security tests | 0bfa15a | 9 new tests for headers and UUID; tsconfig updated for vitest-pool-workers types |

## Changes Made

### src/index.ts

**Security Headers Added:**
- `Content-Security-Policy`: default-src 'self', script-src 'self' 'unsafe-inline', style-src 'self' 'unsafe-inline', font-src 'self', img-src 'self' data:, connect-src 'self' wss:, frame-ancestors 'none', base-uri 'self', form-action 'self'
- `Strict-Transport-Security`: max-age=31536000; includeSubDomains
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()

**Event ID Format Change:**
- Old: `${event}:${serial}:${timestamp}`
- New: `${event}:${serial}:${timestamp}:${uuid}`

**Asset Response Handler:**
- Updated to clone asset response and add security headers

### src/security-headers.test.ts (New)

9 integration tests using Cloudflare Workers Vitest pool:
- Tests for all 6 security headers on /api/health, /api/events, /webhook
- HSTS max-age and includeSubDomains verification
- CSP default-src and frame-ancestors verification
- UUID pattern matching in event IDs
- Uniqueness test for event IDs with same payload

### tsconfig.json

- Added `@cloudflare/vitest-pool-workers` to types array for cloudflare:workers imports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] cloudflare:test import not resolving**
- **Found during:** Task 3
- **Issue:** The deprecated `cloudflare:test` module import was not resolving at runtime
- **Fix:** Updated to use `cloudflare:workers` import with `exports.default.fetch()` pattern
- **Files modified:** src/security-headers.test.ts
- **Commit:** 0bfa15a

**2. [Rule 3 - Blocking] Missing vitest-pool-workers types**
- **Found during:** Task 3
- **Issue:** TypeScript types for cloudflare:workers module not found
- **Fix:** Added `@cloudflare/vitest-pool-workers` to tsconfig.json types array
- **Files modified:** tsconfig.json
- **Commit:** 0bfa15a

**3. [Rule 3 - Blocking] dist directory missing for tests**
- **Found during:** Task 3
- **Issue:** Cloudflare Workers test pool requires dist directory to exist (assets binding)
- **Fix:** Ran `npm run build` to generate dist directory before tests
- **Files modified:** None (dist/ is gitignored)
- **Commit:** N/A (not committed, runtime dependency)

## Verification Results

```
npm test -- --reporter=verbose
 Test Files  2 passed (2)
      Tests  60 passed (60)
```

Security-specific tests all pass:
- Security Headers > on API responses > includes all security headers on /api/health
- Security Headers > on API responses > includes all security headers on /api/events
- Security Headers > on API responses > includes all security headers on /webhook
- Strict-Transport-Security (SEC-02, D-03) > has max-age of 31536000 (1 year)
- Strict-Transport-Security (SEC-02, D-03) > includes includeSubDomains directive
- Content-Security-Policy (SEC-01) > includes default-src directive
- Content-Security-Policy (SEC-01) > includes frame-ancestors 'none'
- Event ID randomness (SEC-05, D-04) > includes UUID in event ID
- Event ID randomness (SEC-05, D-04) > generates unique event IDs for same payload

## Security Requirements Addressed

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| SEC-01 | Complete | Content-Security-Policy header with safe defaults |
| SEC-02 | Complete | Strict-Transport-Security: max-age=31536000; includeSubDomains |
| SEC-03 | Complete | Referrer-Policy: strict-origin-when-cross-origin |
| SEC-04 | Complete | Permissions-Policy disables unused browser features |
| SEC-05 | Complete | crypto.randomUUID() appended to event IDs |

## Self-Check: PASSED

- [x] src/security-headers.test.ts exists (158 lines)
- [x] Commit b6fc1c7 exists (security headers)
- [x] Commit a64e37b exists (UUID in event IDs)
- [x] Commit 0bfa15a exists (tests)
- [x] All tests pass (60/60)
