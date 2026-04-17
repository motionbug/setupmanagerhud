# Phase 2: Dead Code Removal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 02-dead-code-removal
**Areas discussed:** Removal aggression, Analysis approach, Scaffolding directories, UI component library

---

## Removal Aggression

| Option | Description | Selected |
|--------|-------------|----------|
| Moderate (Recommended) | Remove empty dirs, unused exports, clear duplicates. Safe balance — tests catch breakage. | ✓ |
| Conservative | Only obviously dead code with zero references. Safer but may leave clutter. | |
| Aggressive | Restructure files, consolidate modules, remove anything questionable. Higher risk. | |

**User's choice:** Moderate (Recommended)
**Notes:** Phase 1 tests provide safety net for detecting breakage.

---

## Analysis Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Manual audit only (Recommended) | Grep/search through codebase systematically. No new tool dependencies. Phase 1 tests catch regressions. | ✓ |
| Static analysis tools | Use ts-prune, depcheck, etc. Catches more but adds dev dependencies and may have false positives. | |
| You decide | Claude picks the appropriate approach based on codebase size and complexity. | |

**User's choice:** Manual audit only (Recommended)
**Notes:** Avoids adding new dev dependencies; codebase is small enough for manual review.

---

## Scaffolding Directories

| Option | Description | Selected |
|--------|-------------|----------|
| Remove them (Recommended) | Delete src/components/providers/ and src/components/layouts/. Easy to recreate if ever needed. | ✓ |
| Keep them | Leave as placeholders for future use. No harm but adds clutter. | |
| Add .gitkeep only | Keep dirs with .gitkeep file to signal intentional placeholder. | |

**User's choice:** Remove them (Recommended)
**Notes:** Empty directories add clutter; easily recreated if needed.

---

## UI Component Library

| Option | Description | Selected |
|--------|-------------|----------|
| Remove unused (Recommended) | Delete primitives with zero imports. They can be re-added via `npx shadcn@latest add <component>` anytime. | ✓ |
| Keep all | Keep the full set as a component library. More consistent but adds dead code. | |
| You decide | Claude audits and removes only clearly unused primitives. | |

**User's choice:** Remove unused (Recommended)
**Notes:** shadcn/ui components are easy to re-add via CLI.

---

## Claude's Discretion

- Specific order of removal operations
- Commit granularity (single vs. atomic commits)
- Edge case handling for ambiguous usage

## Deferred Ideas

- Duplicated KV fetch logic consolidation — scoped to Phase 3 per REQUIREMENTS.md
