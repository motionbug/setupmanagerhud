# Phase 1: Test Foundation and Security Hardening - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 01-test-foundation-and-security-hardening
**Areas discussed:** Test framework setup, Security header values, Event ID randomness

---

## Test Framework Setup

| Option | Description | Selected |
|--------|-------------|----------|
| @cloudflare/vitest-pool-workers (Recommended) | Official Cloudflare integration. Runs tests in real Workers runtime with bindings. Best for testing KV, Durable Objects, and actual Worker behavior. | ✓ |
| Standard Vitest + miniflare mocking | Generic Vitest with mocked bindings. Faster but less realistic — good for pure function tests. | |

**User's choice:** @cloudflare/vitest-pool-workers (Recommended)
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Colocated with source (e.g., src/types.test.ts) | Tests next to implementation. Easy to find related tests. Common in smaller projects. | ✓ |
| Separate test directory (e.g., test/ or tests/) | All tests in one place. Cleaner src/ tree. Common in larger projects. | |

**User's choice:** Colocated with source (e.g., src/types.test.ts)
**Notes:** None

---

## Security Header Values

| Option | Description | Selected |
|--------|-------------|----------|
| Strict CSP (Recommended) | default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' (Tailwind needs inline). Blocks external scripts. | |
| Moderate CSP | Allow 'self' plus specific CDNs if needed. More permissive but documented exceptions. | |
| Claude decides | Let Claude determine appropriate strictness based on the codebase | ✓ |

**User's choice:** Claude decides
**Notes:** Claude has discretion to determine CSP strictness based on actual dashboard dependencies

---

| Option | Description | Selected |
|--------|-------------|----------|
| 1 year (31536000 seconds) (Recommended) | Standard production value. Includes includeSubDomains. Browser remembers HTTPS requirement. | ✓ |
| 6 months (15768000 seconds) | More conservative. Easier to recover if HTTPS issues arise. | |
| Claude decides | Let Claude pick an appropriate value | |

**User's choice:** 1 year (31536000 seconds) (Recommended)
**Notes:** None

---

## Event ID Randomness

| Option | Description | Selected |
|--------|-------------|----------|
| Append UUID (Recommended) | Keep existing format, add UUID: event:serial:timestamp:uuid. Preserves sortability and readability while adding unpredictability. | ✓ |
| Replace timestamp with UUID | Use event:serial:uuid. Fully unpredictable but loses timestamp ordering in the ID itself. | |
| UUID only | Just the UUID. Maximally unpredictable but loses all context in the ID. | |

**User's choice:** Append UUID (Recommended)
**Notes:** None

---

## Claude's Discretion

- CSP policy strictness — determine based on dashboard dependencies
- Referrer-Policy and Permissions-Policy values
- Test organization beyond the three required security functions

## Deferred Ideas

None
