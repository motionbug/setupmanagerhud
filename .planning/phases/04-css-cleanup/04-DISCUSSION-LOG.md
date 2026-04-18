# Phase 4: CSS Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 04-css-cleanup
**Areas discussed:** Dead token removal, Token organization, Component class audit

---

## Dead Token Removal

| Option | Description | Selected |
|--------|-------------|----------|
| Remove them (Recommended) | Delete all 16 sidebar variables. They're dead code and can be re-added if a sidebar is ever needed. | ✓ |
| Keep them | Leave the sidebar tokens in place — you may add a sidebar in the future. | |

**User's choice:** Remove them (Recommended)
**Notes:** None

---

## Token Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Leave as-is (Recommended) | Current mix works. Semantic for core UI, numbered for domain-specific (charts). No refactoring needed. | ✓ |
| Standardize to semantic | Rename chart-1 through chart-5 to semantic names (e.g., --chart-success, --chart-failure). More descriptive but requires updating components. | |

**User's choice:** Leave as-is (Recommended)
**Notes:** None

---

## Component Class Audit

| Option | Description | Selected |
|--------|-------------|----------|
| Remove unused classes (Recommended) | Delete any custom component classes with zero references. Aligns with Phase 2 dead code removal approach. | ✓ |
| Keep all classes | Preserve all 6 classes even if some aren't used. They document intended styling patterns. | |

**User's choice:** Remove unused classes (Recommended)
**Notes:** None

---

## Claude's Discretion

- Specific order of cleanup operations
- Whether to consolidate duplicate or similar Tailwind class patterns in components
- How to handle edge cases where class usage is ambiguous

## Deferred Ideas

None — discussion stayed within phase scope
