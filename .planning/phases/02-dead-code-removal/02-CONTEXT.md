# Phase 2: Dead Code Removal - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove unused exports, dependencies, comments, and duplicate logic so the codebase contains only actively-used code. Tests from Phase 1 provide a safety net to detect accidental breakage.

</domain>

<decisions>
## Implementation Decisions

### Removal Aggression
- **D-01:** Moderate aggression — remove empty directories, unused exports, and clear duplicates. Safe balance since tests catch breakage.

### Analysis Approach
- **D-02:** Manual audit only — systematic grep/search through codebase. No new tool dependencies (ts-prune, depcheck). Phase 1 tests catch regressions.

### Scaffolding Directories
- **D-03:** Remove empty scaffolding directories (`src/components/providers/`, `src/components/layouts/`). Easy to recreate if ever needed.

### UI Component Library
- **D-04:** Remove unused shadcn/ui primitives — delete primitives with zero imports. They can be re-added via `npx shadcn@latest add <component>` anytime.

### Claude's Discretion
- Specific order of removal operations (exports vs. dependencies vs. directories)
- Whether to consolidate related cleanup into single commits or separate atomic commits
- How to handle edge cases where usage is ambiguous

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `REQUIREMENTS.md` § Dead Code — DEAD-01, DEAD-02, DEAD-03, DEAD-04

### Codebase Analysis
- `.planning/codebase/STRUCTURE.md` — directory layout and naming conventions
- `.planning/codebase/CONCERNS.md` § "Duplicated KV Fetch Logic" — known duplicate pattern (handled in Phase 3)

### Prior Phase
- `.planning/phases/01-test-foundation-and-security-hardening/01-CONTEXT.md` — test framework decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Empty Directories to Remove
- `src/components/providers/` — empty, never used
- `src/components/layouts/` — empty, never used

### shadcn/ui Primitives
- Located in `src/components/ui/`
- Standard set: badge.tsx, button.tsx, card.tsx, dropdown-menu.tsx, input.tsx, select.tsx, table.tsx, tooltip.tsx
- Need to audit which are actually imported by dashboard components

### Exports to Audit
- `src/types.ts` exports multiple interfaces and functions — verify all are used
- `src/index.ts` exports `_TestEnv` type (appears to be test-only)

### Dependencies
- All dependencies in package.json appear to be used based on initial scan
- Will need systematic audit to confirm

### Patterns Established
- Test files colocated with source (e.g., `src/types.test.ts`)
- Named exports preferred throughout

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard dead code removal approaches apply.

</specifics>

<deferred>
## Deferred Ideas

- **Duplicated KV fetch logic** — explicitly scoped to Phase 3 (TypeScript and Consolidation) per CONCERNS.md and REQUIREMENTS.md (CONS-01)

</deferred>

---

*Phase: 02-dead-code-removal*
*Context gathered: 2026-04-17*
