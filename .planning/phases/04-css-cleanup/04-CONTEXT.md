# Phase 4: CSS Cleanup - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove dead CSS selectors and tokens, consolidate repeated rules, and ensure design tokens are consistently used. No visual changes — internal cleanup only.

</domain>

<decisions>
## Implementation Decisions

### Dead Token Removal
- **D-01:** Remove all 16 sidebar-related CSS variables (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.) from both light and dark themes. They are never referenced and can be re-added if needed.

### Token Organization
- **D-02:** Keep current token naming as-is. Semantic tokens (`--background`, `--primary`) for core UI and numbered tokens (`--chart-1` through `--chart-5`) for domain-specific features work well together. No refactoring.

### Component Class Audit
- **D-03:** Remove any custom component classes in `@layer components` that have zero references. Aligns with Phase 2 moderate aggression approach — tests catch breakage.

### Claude's Discretion
- Specific order of cleanup operations
- Whether to consolidate duplicate or similar Tailwind class patterns in components
- How to handle edge cases where class usage is ambiguous

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `REQUIREMENTS.md` § CSS — CSS-01, CSS-02, CSS-03, CSS-04

### Prior Phase
- `.planning/phases/02-dead-code-removal/02-CONTEXT.md` — moderate aggression, manual audit approach
- `.planning/phases/03-typescript-and-consolidation/03-CONTEXT.md` — consolidation patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### CSS File
- Single CSS file: `src/styles/globals.css` (175 lines)
- Uses Tailwind CSS v4 with `@theme inline` design tokens
- Imports: `tw-animate-css`, `tailwindcss`
- Custom dark mode variant: `@custom-variant dark (&:is(.dark *))`

### Dead Tokens to Remove (16 variables)
In `@theme inline` block (lines 31-38):
- `--color-sidebar`, `--color-sidebar-foreground`, `--color-sidebar-primary`
- `--color-sidebar-primary-foreground`, `--color-sidebar-accent`, `--color-sidebar-accent-foreground`
- `--color-sidebar-border`, `--color-sidebar-ring`

In `:root` (lines 72-79) and `.dark` (lines 107-114):
- Same 8 sidebar variables in both light and dark themes

### Custom Component Classes to Audit
In `@layer components` (lines 140-174):
- `stat-value`, `stat-label` — used in KpiCards.tsx
- `dashboard-table`, `dashboard-table th`, `dashboard-table td` — used in EventsTable.tsx
- `chart-title` — need to verify usage
- `dashboard-header` — used in App.tsx
- `dashboard-badge` — used in Filters.tsx

### No Inline Styles
Components use only Tailwind classes via `className=` — no `style={}` inline styles found. This is clean.

### Integration Points
- Components in `src/components/dashboard/` use the custom classes
- shadcn/ui components in `src/components/ui/` use Tailwind utilities directly

</code_context>

<specifics>
## Specific Ideas

- Sidebar variables are from shadcn/ui's default theme scaffold but were never implemented in this dashboard
- The 6 custom classes establish a typography scale for dashboard-specific elements
- Removing dead CSS should be straightforward since there's only one CSS file to audit

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-css-cleanup*
*Context gathered: 2026-04-18*
