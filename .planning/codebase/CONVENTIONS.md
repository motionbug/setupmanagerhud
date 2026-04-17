# Coding Conventions

**Analysis Date:** 2026-04-17

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `EventsTable.tsx`, `KpiCards.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useWebSocket.ts`)
- Worker/server files: camelCase (e.g., `index.ts`, `types.ts`)
- Utility files: camelCase (e.g., `utils.ts`)
- Config files: kebab-case or lowercase (e.g., `vite.config.ts`, `tsconfig.json`)

**Functions:**
- camelCase for all functions
- Handlers prefixed with `handle` (e.g., `handleWebhook`, `handleEvents`, `handleExport`)
- Validation functions prefixed with `is` or `validate` (e.g., `isNonEmptyString`, `validateWebhookPayload`)
- React components: PascalCase (e.g., `EventsTable`, `Header`, `DashboardSkeleton`)

**Variables:**
- camelCase for local variables and state
- SCREAMING_SNAKE_CASE for constants (e.g., `MAX_WEBHOOK_PAYLOAD_SIZE`, `REQUIRED_BASE_FIELDS`, `DANGEROUS_KEYS`)
- Refs suffixed with `Ref` (e.g., `wsRef`, `reconnectAttempts`)

**Types:**
- PascalCase for interfaces and type aliases
- Interfaces prefixed appropriately for context (e.g., `WebhookPayload`, `FilterState`, `StoredEvent`)
- Props interfaces suffixed with `Props` (e.g., `EventsTableProps`, `FiltersProps`, `KpiCardsProps`)

## Code Style

**Formatting:**
- No explicit Prettier or ESLint configuration detected
- Consistent 2-space indentation
- Double quotes for strings in TypeScript/TSX
- Semicolons used consistently
- Line length generally under 100 characters

**Linting:**
- No ESLint configuration present
- TypeScript strict mode enabled (`tsconfig.json`)
- Type checking via `npm run typecheck` (runs `tsc --noEmit`)

## Import Organization

**Order:**
1. React imports first (`import * as React from "react"`, `import { useState, useEffect } from "react"`)
2. Third-party library imports (Radix UI, recharts, clsx, etc.)
3. Path-aliased internal imports (`@/components/...`, `@/hooks/...`, `@/lib/...`, `@/types`)
4. Relative imports (used sparingly, mainly for sibling components)

**Path Aliases:**
- `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`)

**Examples:**
```typescript
// From src/components/dashboard/App.tsx
import * as React from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { KpiCards } from "./KpiCards";
import type { FilterState, WebhookPayload } from "@/types";
```

## Error Handling

**Patterns:**
- Worker: try/catch blocks with generic error messages to client, detailed logging server-side
- WebSocket: Silent error logging via `console.error`, graceful degradation
- JSON parsing: try/catch with fallback to `null` for invalid data

**Worker error responses:**
```typescript
// Generic message to client, detailed log server-side
console.error(`Webhook validation failed: ${validation.error}`);
return json({ error: "Invalid webhook payload" }, 400, request);
```

**Validation approach:**
- Use `ValidationResult` type with `valid: boolean` and optional `error?: string`
- Return early on validation failures
- Type guards for runtime type safety (e.g., `isSetupManagerWebhook`)

## Logging

**Framework:** `console` (no external logging framework)

**Patterns:**
- `console.error` for errors and failures
- No `console.log` for routine operations (production-ready code)
- Error messages include context: `"WebSocket error:"`, `"Error sending to WebSocket:"`

## Comments

**When to Comment:**
- JSDoc-style comments for exported functions and complex logic
- Block comments above constant definitions explaining purpose
- Inline comments for non-obvious calculations or security considerations

**JSDoc/TSDoc:**
```typescript
/**
 * Constant-time string comparison using HMAC digests.
 * Both inputs are hashed to fixed-length 256-bit digests before comparison,
 * so no timing information about string length or content is leaked.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> { ... }
```

## Function Design

**Size:** Functions generally under 50 lines; complex functions like `createTimeBuckets` are the exception

**Parameters:**
- Destructure props in React components: `({ events, maxVisible = 50 }: EventsTableProps)`
- Use default parameter values where appropriate
- Env bindings passed as second parameter to Worker handlers

**Return Values:**
- Explicit return types for non-trivial functions
- `Response` objects from Worker handlers
- React components return JSX or `null`

## Module Design

**Exports:**
- Named exports preferred throughout
- Default export only for Worker entry point (`export default { fetch: ... }`)
- Type exports use `export type` for type-only exports

**Barrel Files:**
- Not used; direct imports from specific files

## React Patterns

**Component Structure:**
```typescript
// Props interface at top of file
interface ComponentProps {
  prop1: Type1;
  prop2?: Type2;
}

// Component function
export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState<Type>(initialValue);
  
  // Memoized values
  const computed = React.useMemo(() => { ... }, [deps]);
  
  // Early returns for loading/empty states
  if (!data) return <Skeleton />;
  
  // Main render
  return ( ... );
}
```

**State Management:**
- React hooks for local state (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`)
- No external state management library (Redux, Zustand, etc.)
- Custom hooks for encapsulating complex logic (`useWebSocket`)

**UI Components:**
- shadcn/ui primitives in `src/components/ui/`
- Use `cn()` utility for conditional class merging
- Tailwind CSS for all styling

## TypeScript Patterns

**Strict Mode:**
- `"strict": true` in tsconfig.json
- Explicit typing for function parameters and return values
- Type guards for runtime type narrowing

**Type Assertions:**
- Used sparingly with `as` keyword for known safe casts
- Example: `(e.payload as WebhookPayload).duration`

**Discriminated Unions:**
```typescript
export type SetupManagerWebhook = SetupManagerStartedWebhook | SetupManagerFinishedWebhook;
```

## Security Patterns

**Input Validation:**
- Validate all webhook payloads before processing (`validateWebhookPayload`)
- Check for prototype pollution keys (`__proto__`, `constructor`, `prototype`)
- Size limits enforced before parsing (8KB webhook, 4KB WebSocket)

**Output Sanitization:**
- CSV export sanitizes formula-triggering characters (`=`, `+`, `-`, `@`)
- Generic error messages to clients; detailed logs server-side

**Authentication:**
- Timing-safe token comparison using HMAC
- Content-Type validation to prevent CSRF

---

*Convention analysis: 2026-04-17*
