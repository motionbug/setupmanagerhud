---
phase: "02"
plan: "02"
subsystem: ui-components
tags: [dead-code, exports, shadcn-ui, cleanup]
dependency_graph:
  requires: []
  provides: [reduced-export-surface]
  affects: [src/components/ui/card.tsx, src/components/ui/badge.tsx, src/components/ui/button.tsx, src/components/ui/table.tsx, src/components/ui/select.tsx, src/components/ui/dropdown-menu.tsx]
tech_stack:
  added: []
  patterns: [export-list-reduction]
key_files:
  created: []
  modified:
    - src/components/ui/card.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/button.tsx
    - src/components/ui/table.tsx
    - src/components/ui/select.tsx
    - src/components/ui/dropdown-menu.tsx
decisions: []
metrics:
  duration: ~2min
  completed: "2026-04-17T12:57:38Z"
  tasks: 5
  files: 6
---

# Phase 02 Plan 02: Remove Unused UI Component Exports Summary

Reduced shadcn/ui export surface by removing 21 unused exports while preserving all component definitions for future re-export via `npx shadcn@latest add`.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove unused exports from card.tsx | d468c67 | src/components/ui/card.tsx |
| 2 | Remove unused exports from badge.tsx and button.tsx | 274f029 | src/components/ui/badge.tsx, src/components/ui/button.tsx |
| 3 | Remove unused exports from table.tsx | fed157c | src/components/ui/table.tsx |
| 4 | Remove unused exports from select.tsx | e257a7c | src/components/ui/select.tsx |
| 5 | Remove unused exports from dropdown-menu.tsx | fab39cc | src/components/ui/dropdown-menu.tsx |

## Summary of Changes

### Exports Removed (21 total)

| File | Removed Exports | Remaining Exports |
|------|-----------------|-------------------|
| card.tsx | CardFooter | Card, CardHeader, CardTitle, CardDescription, CardContent (5) |
| badge.tsx | badgeVariants | Badge (1) |
| button.tsx | buttonVariants | Button (1) |
| table.tsx | TableFooter, TableCaption | Table, TableHeader, TableBody, TableHead, TableRow, TableCell (6) |
| select.tsx | SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton | Select, SelectValue, SelectTrigger, SelectContent, SelectItem (5) |
| dropdown-menu.tsx | 11 items: CheckboxItem, RadioItem, Label, Separator, Shortcut, Group, Portal, Sub, SubContent, SubTrigger, RadioGroup | DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem (4) |

### Key Points

- **All component definitions preserved**: Only export statements modified; components can be re-exported without code changes
- **Internal dependencies respected**: SelectScrollUpButton/SelectScrollDownButton kept as definitions since they are used internally by SelectContent
- **Variant functions kept for internal use**: badgeVariants and buttonVariants remain defined for component styling

## Verification Results

- Build: PASSED (`npm run build` completed successfully)
- Typecheck: Pre-existing errors in src/security-headers.test.ts (unrelated to this plan)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- [x] All 6 modified files exist on disk
- [x] All 5 task commits verified in git log
- [x] Build succeeds
- [x] Export counts match plan expectations
