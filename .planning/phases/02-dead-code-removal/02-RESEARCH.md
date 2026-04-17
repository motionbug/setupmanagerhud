# Phase 2: Dead Code Removal - Research

**Researched:** 2026-04-17
**Domain:** Static analysis, code cleanup, dependency auditing
**Confidence:** HIGH

## Summary

Phase 2 removes unused code from the Setup Manager HUD codebase following the Phase 1 test foundation. The manual audit approach (D-02) requires systematic grep-based analysis without new tooling dependencies. Research found specific unused exports in `src/types.ts` and `src/components/ui/`, empty scaffolding directories, and confirmed all package.json dependencies are actively imported.

The codebase is relatively clean with minimal dead code. The main targets are: (1) two empty directories (`src/components/providers/`, `src/layouts/`), (2) unused type exports in types.ts (`ValidationResult`, `isSetupManagerWebhook`, `SetupManagerStartedWebhook`, `SetupManagerFinishedWebhook`), (3) unused exports from shadcn/ui components, and (4) one unused export from card.tsx (`CardFooter`). No significant commented-out code blocks or stale TODOs were found. The "duplicated KV fetch logic" pattern noted in CONCERNS.md is explicitly deferred to Phase 3 per D-04 in CONTEXT.md.

**Primary recommendation:** Execute removal in order of risk: directories first (zero risk), then unused exports (covered by tests), then shadcn/ui cleanup (re-addable via CLI). Verify each removal with `npm run test` and `npm run typecheck`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Moderate aggression - remove empty directories, unused exports, and clear duplicates. Safe balance since tests catch breakage.
- **D-02:** Manual audit only - systematic grep/search through codebase. No new tool dependencies (ts-prune, depcheck). Phase 1 tests catch regressions.
- **D-03:** Remove empty scaffolding directories (`src/components/providers/`, `src/components/layouts/`). Easy to recreate if ever needed.
- **D-04:** Remove unused shadcn/ui primitives - delete primitives with zero imports. They can be re-added via `npx shadcn@latest add <component>` anytime.

### Claude's Discretion
- Specific order of removal operations (exports vs. dependencies vs. directories)
- Whether to consolidate related cleanup into single commits or separate atomic commits
- How to handle edge cases where usage is ambiguous

### Deferred Ideas (OUT OF SCOPE)
- **Duplicated KV fetch logic** - explicitly scoped to Phase 3 (TypeScript and Consolidation) per CONCERNS.md and REQUIREMENTS.md (CONS-01)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEAD-01 | Remove unused file exports and unreferenced module members | Identified: `isSetupManagerWebhook`, `ValidationResult`, `SetupManagerStartedWebhook`, `SetupManagerFinishedWebhook` in types.ts; `CardFooter` in card.tsx; multiple shadcn/ui subexports |
| DEAD-02 | Remove unused dependencies from package.json | Verified: All dependencies are imported somewhere in the codebase |
| DEAD-03 | Remove stale comments and commented-out code | Verified: No commented-out code blocks found; only legitimate documentation comments |
| DEAD-04 | Remove duplicate logic across components and hooks | Deferred: KV fetch pattern to Phase 3; no other duplicates found in dashboard components |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dead code detection | Build tooling (static analysis) | - | TypeScript compiler and grep analysis identify unused exports |
| Directory cleanup | File system | Git | Empty directories tracked in git, removal is file operation |
| Export removal | Source files | Build | Removing exports requires source edit; build verifies no consumers |
| Test verification | Test framework | CI | Vitest validates changes don't break functionality |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.3.3 | Type checking catches unused import errors | [VERIFIED: package.json] Compiler errors surface missing exports |
| Vitest | ^4.1.4 | Test framework validates no regressions | [VERIFIED: package.json] Phase 1 established test foundation |
| grep/ripgrep | system | Manual audit tool per D-02 | [VERIFIED: user decision] No new dependencies allowed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn CLI | latest | Re-add removed components | `npx shadcn@latest add <component>` if needed later |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual grep | ts-prune | More thorough but adds dependency; D-02 prohibits |
| Manual grep | depcheck | Finds unused npm packages but adds dependency; D-02 prohibits |
| Manual grep | knip | Comprehensive but adds dependency; D-02 prohibits |

**Installation:**
```bash
# No new installations required per D-02 (manual audit only)
```

## Architecture Patterns

### Audit Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUDIT PHASE                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Identify Exports                                        │
│   grep "export (type|interface|function|const)" src/**/*.ts     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Search for Imports                                      │
│   For each export: grep "import.*{ExportName}" src/             │
│   Count consumers (excluding definition file)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Classify                                                │
│   - Zero consumers → Candidate for removal                      │
│   - Test-only consumers → Keep (test exports like _test*)       │
│   - Active consumers → Keep                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       REMOVAL PHASE                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Remove (in order)                                       │
│   1. Empty directories                                          │
│   2. Unused type exports                                        │
│   3. Unused function exports                                    │
│   4. Unused shadcn/ui component exports                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Verify                                                  │
│   npm run typecheck && npm run test                             │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Removal Order

1. **Empty directories** - Zero risk, no code changes
2. **Unused type exports** - TypeScript compiler validates
3. **Unused function exports** - Tests validate functionality preserved
4. **Unused shadcn/ui exports** - Re-addable via CLI if needed

### Anti-Patterns to Avoid
- **Removing test-only exports:** The `_test*` exports in index.ts are intentionally for testing - keep them
- **Removing types used only in union definitions:** `SetupManagerStartedWebhook` is used in `SetupManagerFinishedWebhook extends Omit<...>` - this is internal usage, safe to consider
- **Removing without verification:** Always run typecheck + test after each removal batch

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead code detection | Custom AST parser | grep + TypeScript compiler | D-02 mandates no new tools; grep is sufficient for this codebase size |
| Dependency auditing | Custom package.json analyzer | grep for import statements | Manual verification is adequate for ~15 dependencies |

**Key insight:** This is a small codebase (~30 source files). Manual grep-based audit is appropriate and complies with D-02. Automated tools would be overkill and add unnecessary dependencies.

## Audit Results

### DEAD-01: Unused Exports Analysis

**src/types.ts exports:**
| Export | Type | Used Externally | Action |
|--------|------|-----------------|--------|
| SetupManagerStartedWebhook | interface | NO | REMOVE [VERIFIED: grep found no imports] |
| SetupManagerFinishedWebhook | interface | NO | REMOVE [VERIFIED: grep found no imports] |
| SetupManagerWebhook | type | YES (index.ts) | KEEP |
| EnrollmentAction | interface | YES (used in WebhookPayload) | KEEP |
| UserEntry | interface | YES (used in WebhookPayload) | KEEP |
| StoredEvent | interface | YES (multiple files) | KEEP |
| ValidationResult | interface | NO | REMOVE [VERIFIED: grep found no imports] |
| validateWebhookPayload | function | YES (index.ts, tests) | KEEP |
| isSetupManagerWebhook | function | NO | REMOVE [VERIFIED: grep found no imports] |
| FilterState | interface | YES (App.tsx, Filters.tsx) | KEEP |
| Stats | interface | YES (useWebSocket.ts) | KEEP |
| WebhookPayload | interface | YES (multiple files) | KEEP |

**src/index.ts exports:**
| Export | Type | Used Externally | Action |
|--------|------|-----------------|--------|
| DashboardRoom | class | YES (wrangler DO binding) | KEEP |
| _testTimingSafeEqual | function | YES (index.test.ts) | KEEP (test-only) |
| _testValidateAccessJwt | function | YES (index.test.ts) | KEEP (test-only) |
| _TestEnv | type | YES (index.test.ts) | KEEP (test-only) |

**src/components/ui/ exports:**
| File | Unused Exports | Action |
|------|----------------|--------|
| badge.tsx | badgeVariants | REMOVE (only Badge used) |
| button.tsx | buttonVariants | REMOVE (only Button used) |
| card.tsx | CardFooter | REMOVE (not imported anywhere) |
| table.tsx | TableFooter, TableCaption | REMOVE (not imported in EventsTable) |
| select.tsx | SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton | REMOVE (not imported in Filters) |
| dropdown-menu.tsx | DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup | REMOVE (not imported in Filters) |
| tooltip.tsx | (all used) | KEEP |
| skeleton.tsx | (all used) | KEEP |
| input.tsx | (all used) | KEEP |

### DEAD-02: Unused Dependencies Analysis

**All package.json dependencies verified as used:**
| Dependency | Import Location |
|------------|-----------------|
| @fontsource-variable/figtree | src/main.tsx |
| @hugeicons/core-free-icons | src/components/ui/select.tsx, dropdown-menu.tsx |
| @hugeicons/react | src/components/ui/select.tsx, dropdown-menu.tsx |
| @radix-ui/react-dropdown-menu | src/components/ui/dropdown-menu.tsx |
| @radix-ui/react-select | src/components/ui/select.tsx |
| @radix-ui/react-slot | src/components/ui/button.tsx |
| @radix-ui/react-tooltip | src/components/ui/tooltip.tsx |
| class-variance-authority | src/components/ui/badge.tsx, button.tsx |
| clsx | src/lib/utils.ts |
| react | Multiple files |
| react-dom | src/main.tsx |
| recharts | src/components/dashboard/EventsChart.tsx, ActionsChart.tsx |
| tailwind-merge | src/lib/utils.ts |

**Result:** No unused dependencies found. DEAD-02 requires no action. [VERIFIED: manual grep audit]

### DEAD-03: Stale Comments Analysis

**Commented-out code search:**
- Searched pattern: `^[\t ]*//[^/].*[;{}()=]`
- Found: Only legitimate single-line comments explaining code purpose
- No commented-out code blocks
- No stale TODOs (only one in test file as UUID format documentation)

**Result:** No stale comments or commented-out code found. DEAD-03 requires no action. [VERIFIED: grep audit]

### DEAD-04: Duplicate Logic Analysis

**Known duplicate (DEFERRED to Phase 3):**
- KV fetch pattern in handleEvents(), handleStats(), DashboardRoom.sendHistory()
- Per CONTEXT.md D-04 and REQUIREMENTS.md CONS-01, this is Phase 3 scope

**Other patterns checked:**
- Filter logic: Unique in Filters.tsx (no duplication)
- Stats computation: Unique in useWebSocket.ts (no duplication)
- Event processing: Different purposes in each location

**Result:** No actionable duplicates for Phase 2. The KV pattern is deferred. [VERIFIED: code review]

### Empty Directories (D-03)

| Directory | Status | Action |
|-----------|--------|--------|
| src/components/providers/ | Empty (only . and ..) | REMOVE |
| src/layouts/ | Empty (only . and ..) | REMOVE |
| src/components/layouts/ | Does not exist | N/A |

## Common Pitfalls

### Pitfall 1: Removing Types Used in Extends/Omit
**What goes wrong:** Removing `SetupManagerStartedWebhook` would break `SetupManagerFinishedWebhook extends Omit<SetupManagerStartedWebhook, ...>`
**Why it happens:** Internal type usage isn't captured by import searches
**How to avoid:** Check `extends`, `Omit`, `Pick`, `Partial` usage before removing types
**Warning signs:** TypeScript compiler errors about missing types in extends clauses

**Specific finding:** `SetupManagerStartedWebhook` IS used internally by `SetupManagerFinishedWebhook`. However, since `SetupManagerFinishedWebhook` is also unused externally, both can be removed together. The removal must be atomic.

### Pitfall 2: Breaking Test-Only Exports
**What goes wrong:** Removing `_test*` exports breaks test files
**Why it happens:** These exports look unused in production code
**How to avoid:** Always search test files (*.test.ts) for usage
**Warning signs:** Test failures after removal

### Pitfall 3: shadcn/ui Variants Pattern
**What goes wrong:** Removing `buttonVariants` or `badgeVariants` when they're needed for consistency
**Why it happens:** shadcn/ui pattern exports both component and variants
**How to avoid:** If removing variants, ensure no external file imports them
**Warning signs:** Import errors in component consumers

**Specific finding:** Neither `buttonVariants` nor `badgeVariants` are imported outside their definition files. Safe to remove from exports.

## Code Examples

### Removing Empty Directories
```bash
# Source: Standard git/shell operations
rm -rf src/components/providers/
rm -rf src/layouts/
git add -A
git status  # Verify only expected changes
```

### Removing Unused Type Exports
```typescript
// Before (src/types.ts)
export interface SetupManagerStartedWebhook { ... }
export interface SetupManagerFinishedWebhook { ... }
export type SetupManagerWebhook = ...;
export interface ValidationResult { ... }
export function isSetupManagerWebhook(...) { ... }

// After (src/types.ts) - keep internal interfaces, remove exports
interface SetupManagerStartedWebhook { ... }  // No export keyword
interface SetupManagerFinishedWebhook { ... } // No export keyword  
export type SetupManagerWebhook = ...;        // Keep - used by index.ts
// ValidationResult removed entirely (not used anywhere)
// isSetupManagerWebhook removed entirely (not used anywhere)
```

### Removing Unused shadcn/ui Exports
```typescript
// Before (src/components/ui/card.tsx)
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

// After
export { Card, CardHeader, CardTitle, CardDescription, CardContent }
// CardFooter definition can remain for potential future use, just remove export
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ts-prune for dead code | Tree-shaking handles most cases | ~2020 | Manual audit sufficient for small codebases |
| ESLint no-unused-vars | TypeScript strict mode | ~2019 | Compiler catches unused locals automatically |

**Deprecated/outdated:**
- ts-prune: Still works but often unnecessary with modern bundlers
- depcheck: Useful for large projects but overkill for ~15 dependencies

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | All grep searches were comprehensive | Audit Results | May miss usage in dynamic imports or template strings |
| A2 | Wrangler config references DashboardRoom by export name | DEAD-01 Analysis | Removing export would break Worker deployment |

**Note:** A1 risk is mitigated by typecheck + test verification after each removal.

## Open Questions

1. **shadcn/ui internal component usage**
   - What we know: Exports like `buttonVariants` are part of the standard shadcn/ui pattern
   - What's unclear: Whether future shadcn/ui updates expect these exports to exist
   - Recommendation: Remove from export but keep definitions in file; easy to re-export if needed

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 with @cloudflare/vitest-pool-workers 0.14.7 |
| Config file | vitest.config.ts |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEAD-01 | No unused exports remain | static analysis | `npm run typecheck` | N/A - compiler |
| DEAD-02 | All dependencies imported | manual audit | grep verification | N/A |
| DEAD-03 | No commented-out code | manual audit | grep verification | N/A |
| DEAD-04 | No duplicate logic | code review | N/A | N/A |

### Sampling Rate
- **Per task commit:** `npm run typecheck && npm run test`
- **Per wave merge:** Full suite
- **Phase gate:** All tests pass, typecheck clean

### Wave 0 Gaps
None - existing test infrastructure from Phase 1 covers verification needs.

## Security Domain

> This phase involves code removal only. No new security boundaries are created or modified.

### Applicable ASVS Categories

| ASVS Category | Applies | Rationale |
|---------------|---------|-----------|
| V2 Authentication | no | No auth code changes |
| V3 Session Management | no | No session code changes |
| V4 Access Control | no | No access control changes |
| V5 Input Validation | no | Removing unused code, not modifying validation |
| V6 Cryptography | no | No crypto code changes |

### Known Threat Patterns

| Pattern | Applies | Rationale |
|---------|---------|-----------|
| Accidental export exposure | no | Removing exports, not adding |
| Test export leakage | no | Keeping _test* exports intentionally |

## Sources

### Primary (HIGH confidence)
- Codebase grep analysis - Direct search of source files
- package.json - Dependency verification
- TypeScript compiler - Export usage validation

### Secondary (MEDIUM confidence)
- CONTEXT.md - User decisions D-01 through D-04
- REQUIREMENTS.md - DEAD-01 through DEAD-04 specifications
- CONCERNS.md - Deferred items identification

## Metadata

**Confidence breakdown:**
- Unused exports identification: HIGH - grep verified, typecheck will confirm
- Dependency audit: HIGH - systematic grep of all imports
- Commented code audit: HIGH - pattern-based search
- Duplicate logic audit: HIGH - manual code review confirmed

**Research date:** 2026-04-17
**Valid until:** 2026-05-17 (stable codebase, 30-day validity)
