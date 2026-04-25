# Project: Setup Manager HUD — Documentation Update

## What This Is

Update user documentation to cover v1.0 security hardening and reorganize into GitHub Wiki format for better maintainability.

**Core Value:** Make webhook token security impossible to miss — users must update their Setup Manager configuration with the token key.

## Context

- **Existing:** Working real-time webhook dashboard for Jamf Setup Manager
- **Completed:** v1.0 Cleanup & Modernization milestone (4 phases)
- **Current state:** README is ~510 lines, covers everything but getting long
- **Problem:** New security features (especially webhook token) aren't documented for end users

## What We're Building

### README Slimming
- Keep: Quick Start, Deploy Button, basic KV setup
- Move to wiki: Detailed configuration, security setup, troubleshooting
- Add: Prominent links to wiki pages

### GitHub Wiki Pages

| Page | Content |
|------|---------|
| **Home** | Quick links to all wiki pages |
| **Security** | Webhook token setup (PROMINENT), rate limiting, Cloudflare Access |
| **Configuration** | KV namespace, env vars, wrangler.toml details |
| **Troubleshooting** | Common issues, debugging tips |

### Webhook Token Documentation (Critical)

Users must configure BOTH sides:
1. **Worker side:** `wrangler secret put WEBHOOK_SECRET`
2. **Setup Manager side:** Add `token` key to webhook plist

```xml
<key>webhooks</key>
<dict>
  <key>started</key>
  <dict>
    <key>url</key>
    <string>https://your-worker.workers.dev/webhook</string>
    <key>token</key>
    <string>your-secret-here</string>
  </dict>
  <key>finished</key>
  <dict>
    <key>url</key>
    <string>https://your-worker.workers.dev/webhook</string>
    <key>token</key>
    <string>your-secret-here</string>
  </dict>
</dict>
```

Without both matching, webhooks return 401.

## Requirements

### Validated

- ✓ Slim README to essentials with wiki links — v1.0
- ✓ Create wiki Home page with navigation — v1.0
- ✓ Create wiki Security page (webhook token prominent) — v1.0
- ✓ Create wiki Configuration page — v1.0
- ✓ Create wiki Troubleshooting page — v1.0
- ✓ Webhook token setup is impossible to miss — v1.0

### Active

(None — milestone complete)

### Out of Scope

- Code changes — documentation only
- API documentation — not needed for this tool
- Automated doc generation — manual wiki is fine

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GitHub Wiki over docs/ folder | Wiki is editable without PRs, better for community contributions | ✓ Shipped v1.0 |
| Webhook token security prominent | Critical user action required, easy to miss | ✓ Shipped v1.0 |
| Slim README | 510 lines too long, wiki handles depth | ✓ Shipped v1.0 (322 lines) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-25 after v1.0 milestone*
