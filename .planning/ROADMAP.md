# Roadmap: Setup Manager HUD Documentation Update

## Overview

Transform user documentation to highlight v1.0 security features (especially webhook tokens) by migrating detailed content to a GitHub Wiki while slimming the README to essentials. The wiki structure must exist before content pages, security documentation comes first (core value), and README slimming happens last once wiki pages exist to link to.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Wiki Foundation** - Create wiki structure with navigation (Home + Sidebar) *(completed 2026-04-19)*
- [x] **Phase 2: Wiki Content** - Create security-first content pages with webhook token prominent *(completed 2026-04-20)*
- [ ] **Phase 3: README Integration** - Slim README and add wiki links

## Phase Details

### Phase 1: Wiki Foundation
**Goal**: Wiki structure exists with navigation that content pages will link to
**Depends on**: Nothing (first phase)
**Requirements**: WIKI-01, WIKI-02
**Success Criteria** (what must be TRUE):
  1. Home.md exists with quick links table structure for all planned wiki pages
  2. _Sidebar.md exists with persistent navigation to all wiki pages
  3. Wiki pages can be viewed at the repository wiki URL
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md — Create wiki structure with Home.md and _Sidebar.md *(completed 2026-04-19)*

### Phase 2: Wiki Content
**Goal**: Security-first wiki content exists with webhook token setup impossible to miss
**Depends on**: Phase 1
**Requirements**: WIKI-03, WIKI-04, WIKI-05, SEC-01, SEC-02
**Success Criteria** (what must be TRUE):
  1. Security.md has webhook token setup at the TOP (not buried)
  2. Security.md shows BOTH sides: Worker secret AND Setup Manager plist configuration
  3. Webhook token is labeled as "Required for Production" (not "Optional")
  4. Configuration.md documents KV namespace, env vars, and wrangler.toml settings
  5. Troubleshooting.md covers common errors including 401 webhook failures
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Create Security.md with prominent webhook token setup *(completed 2026-04-20)*
- [x] 02-02-PLAN.md — Create Configuration.md and Troubleshooting.md *(completed 2026-04-20)*

### Phase 3: README Integration
**Goal**: README slimmed to essentials with prominent wiki links
**Depends on**: Phase 2
**Requirements**: README-01, README-02, README-03
**Success Criteria** (what must be TRUE):
  1. README has prominent "Security Setup" section that links to wiki Security page
  2. Detailed configuration content moved to wiki, replaced with links
  3. Quick Start section remains self-sufficient for basic deployment
  4. README is noticeably shorter than current 510 lines
**Plans**: 1 plan

Plans:
- [ ] 03-01-PLAN.md — Slim README with Security Setup section and wiki links

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Wiki Foundation | 1/1 | Complete | 2026-04-19 |
| 2. Wiki Content | 2/2 | Complete | 2026-04-20 |
| 3. README Integration | 0/1 | Ready | - |
