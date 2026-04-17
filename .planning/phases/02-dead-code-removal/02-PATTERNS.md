# Phase 02: Dead Code Removal - Pattern Map

**Mapped:** 2026-04-17
**Files analyzed:** 8 files to modify + 2 directories to remove
**Analogs found:** 8 / 8 (all files have internal patterns to follow)

## Summary

This phase involves **removal operations only** -- no new code is created. The pattern mapping focuses on:
1. How to safely remove exports while keeping internal definitions
2. How to modify export statements at the end of files
3. Safe directory removal

All modifications follow existing patterns within the same files. No external analogs needed -- each file serves as its own pattern reference.

## File Classification

| File to Modify | Role | Data Flow | Pattern Source | Match Quality |
|----------------|------|-----------|----------------|---------------|
| `src/types.ts` | types | N/A | Self (internal usage pattern) | exact |
| `src/components/ui/card.tsx` | component | N/A | Self + `tooltip.tsx` (export-only pattern) | exact |
| `src/components/ui/badge.tsx` | component | N/A | Self (export-only pattern) | exact |
| `src/components/ui/button.tsx` | component | N/A | Self (export-only pattern) | exact |
| `src/components/ui/table.tsx` | component | N/A | Self + `tooltip.tsx` (export-only pattern) | exact |
| `src/components/ui/select.tsx` | component | N/A | Self (export-only pattern) | exact |
| `src/components/ui/dropdown-menu.tsx` | component | N/A | Self (export-only pattern) | exact |
| `src/components/providers/` | directory | N/A | N/A (removal) | N/A |
| `src/layouts/` | directory | N/A | N/A (removal) | N/A |

## Pattern Assignments

### `src/types.ts` (types, export removal)

**Operation:** Remove unused exports while preserving internal type definitions

**Current exports to audit:**
- `SetupManagerStartedWebhook` - REMOVE export keyword (used internally by union type)
- `SetupManagerFinishedWebhook` - REMOVE export keyword (used internally by union type)
- `ValidationResult` - REMOVE export keyword (used as return type of validateWebhookPayload)
- `isSetupManagerWebhook` - REMOVE entire function (not used anywhere)
- All other exports - KEEP

**Pattern for removing export from interface** (lines 6, 33):
```typescript
// Before
export interface SetupManagerStartedWebhook {
  ...
}

// After - remove 'export' keyword, keep interface for internal use
interface SetupManagerStartedWebhook {
  ...
}
```

**Pattern for keeping ValidationResult** (lines 53-56):
```typescript
// ValidationResult is used as return type of validateWebhookPayload (line 159)
// Keep the interface definition, but can remove export if no external consumers
// Current: export function validateWebhookPayload(payload: unknown): ValidationResult

// Before
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// After - remove 'export' keyword (internal use only)
interface ValidationResult {
  valid: boolean;
  error?: string;
}
```

**Pattern for removing unused function** (lines 259-261):
```typescript
// Before
export function isSetupManagerWebhook(payload: unknown): payload is SetupManagerWebhook {
  return validateWebhookPayload(payload).valid;
}

// After - DELETE entire function (not used anywhere, not even in tests)
// [deleted]
```

**Verification pattern:**
```bash
npm run typecheck  # TypeScript will error if any removed export was actually needed
npm run test       # Tests will fail if functionality is broken
```

---

### `src/components/ui/card.tsx` (component, export removal)

**Operation:** Remove `CardFooter` from export list

**Analog:** `src/components/ui/tooltip.tsx` - shows export list pattern

**Current used imports** (from KpiCards.tsx, App.tsx):
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
```

**Export pattern** (line 79):
```typescript
// Before
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

// After - remove CardFooter from export list
// Keep CardFooter definition in file (lines 67-77) for potential future use
export { Card, CardHeader, CardTitle, CardDescription, CardContent }
```

---

### `src/components/ui/badge.tsx` (component, export removal)

**Operation:** Remove `badgeVariants` from export list

**Current used imports** (from EventsTable.tsx, Filters.tsx):
```typescript
import { Badge } from "@/components/ui/badge";
```

**Export pattern** (line 36):
```typescript
// Before
export { Badge, badgeVariants }

// After - remove badgeVariants from export list
// Keep badgeVariants definition (lines 6-24) for internal component use
export { Badge }
```

---

### `src/components/ui/button.tsx` (component, export removal)

**Operation:** Remove `buttonVariants` from export list

**Current used imports** (from EventsTable.tsx, Filters.tsx):
```typescript
import { Button } from "@/components/ui/button";
```

**Export pattern** (line 56):
```typescript
// Before
export { Button, buttonVariants }

// After - remove buttonVariants from export list
// Keep buttonVariants definition (lines 7-34) for internal component use
export { Button }
```

---

### `src/components/ui/table.tsx` (component, export removal)

**Operation:** Remove `TableFooter` and `TableCaption` from export list

**Current used imports** (from EventsTable.tsx):
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
```

**Export pattern** (lines 108-117):
```typescript
// Before
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

// After - remove TableFooter, TableCaption
// Keep definitions in file for potential future use
export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
}
```

---

### `src/components/ui/select.tsx` (component, export removal)

**Operation:** Remove unused exports from export list

**Current used imports** (from Filters.tsx):
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

**Exports to remove:** SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton

**Note:** SelectScrollUpButton and SelectScrollDownButton are used **internally** by SelectContent (lines 85, 95). They must remain defined but can be removed from exports.

**Export pattern** (lines 148-159):
```typescript
// Before
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

// After - keep only externally used exports
export {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
}
```

---

### `src/components/ui/dropdown-menu.tsx` (component, export removal)

**Operation:** Remove unused exports from export list

**Current used imports** (from Filters.tsx):
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
```

**Exports to remove:** DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup

**Export pattern** (lines 188-204):
```typescript
// Before
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}

// After - keep only externally used exports
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}
```

---

## Shared Patterns

### Export Removal Pattern (shadcn/ui Components)
**Apply to:** All shadcn/ui files (card, badge, button, table, select, dropdown-menu)

The project follows a consistent pattern for shadcn/ui components:
1. Component definitions remain in file (for future re-export via `npx shadcn@latest add`)
2. Only the `export { ... }` statement at the end of file is modified
3. Remove names from export list; keep definitions intact

**Example from `tooltip.tsx`** (lines 30):
```typescript
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

This is the pattern all UI files follow -- a single export statement listing all public components.

### Type Export Removal Pattern
**Apply to:** `src/types.ts`

For types that are only used internally:
1. Remove `export` keyword from interface/type declaration
2. Keep the definition for internal type usage
3. Delete entire function if function is unused anywhere (including internally)

**Pattern from `src/types.ts`** (internal constants):
```typescript
// These constants are NOT exported - internal use only
const REQUIRED_BASE_FIELDS = [...] as const;
const REQUIRED_FINISHED_FIELDS = [...] as const;
const VALID_EVENTS = [...] as const;
const DANGEROUS_KEYS = [...] as const;
```

The same pattern should be applied to interfaces that are only used internally.

### Directory Removal Pattern
**Apply to:** `src/components/providers/`, `src/layouts/`

```bash
# Verify directory is empty (contains only . and ..)
ls -la src/components/providers/
ls -la src/layouts/

# Remove empty directory
rm -rf src/components/providers/
rm -rf src/layouts/

# Verify removal
ls src/components/  # Should not show providers/
ls src/             # Should not show layouts/
```

---

## Verification Pattern

**After each removal batch, run:**
```bash
npm run typecheck && npm run test
```

This verification pattern is mandated by the Phase 1 test foundation. TypeScript will catch any accidentally removed exports that are actually used, and tests will catch any functional regressions.

---

## No Analog Found

All files have self-contained patterns or follow shadcn/ui conventions. No external analogs needed.

---

## Metadata

**Analog search scope:** `src/`, `src/components/ui/`
**Files scanned:** 15 TypeScript files
**Pattern extraction date:** 2026-04-17

### Summary of Removals

| Category | Count | Items |
|----------|-------|-------|
| Directories | 2 | `src/components/providers/`, `src/layouts/` |
| Type exports (demote to internal) | 3 | SetupManagerStartedWebhook, SetupManagerFinishedWebhook, ValidationResult |
| Function exports (delete) | 1 | isSetupManagerWebhook |
| UI component exports | 21 | CardFooter, badgeVariants, buttonVariants, TableFooter, TableCaption, SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup |

**Total removal operations:** 27 items across 8 files + 2 directories
