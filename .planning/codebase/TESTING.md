# Testing Patterns

**Analysis Date:** 2026-04-17

## Test Framework

**Runner:**
- No test framework configured
- No jest.config, vitest.config, or similar present
- No test files in `src/` directory

**Assertion Library:**
- Not applicable (no tests)

**Run Commands:**
```bash
# No test commands defined in package.json
# Available scripts:
npm run dev          # Vite dev server
npm run dev:worker   # Wrangler dev (full stack)
npm run build        # Build frontend
npm run deploy       # Build + deploy
npm run typecheck    # TypeScript checking (tsc --noEmit)
```

## Test File Organization

**Location:**
- No test files present in the codebase

**Naming:**
- Not established

**Structure:**
- Not established

## Type Checking as Validation

**TypeScript Strict Mode:**
- `"strict": true` enabled in `tsconfig.json`
- Run type checking with `npm run typecheck`
- Catches type errors at build time

**Type Guards:**
```typescript
// src/types.ts - Runtime validation
export function validateWebhookPayload(payload: unknown): ValidationResult {
  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, error: 'Payload must be a non-null object' };
  }
  // ... validation logic
  return { valid: true };
}

export function isSetupManagerWebhook(payload: unknown): payload is SetupManagerWebhook {
  return validateWebhookPayload(payload).valid;
}
```

## Manual Testing

**Dummy Data Script:**
- Location: `scripts/send-dummy-events.js`
- Purpose: Generate test webhook events for dashboard verification

**Usage:**
```bash
# Send dummy events to deployed worker
WORKER_URL=https://your-worker.workers.dev node scripts/send-dummy-events.js

# With webhook secret
WORKER_URL=https://your-worker.workers.dev \
WEBHOOK_SECRET=your-secret-here \
node scripts/send-dummy-events.js
```

**What it does:**
- Creates 10 dummy devices with random Mac models and macOS versions
- Sends 70 started events and 70 matching finished events
- Events spread over 3 days for chart display
- ~5% of enrollment actions randomly marked as "failed"

**Manual curl testing:**
```bash
# Test webhook endpoint locally
curl -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -d '{"name":"Started","event":"com.jamf.setupmanager.started","timestamp":"2025-01-01T00:00:00Z","started":"2025-01-01T00:00:00Z","modelName":"MacBook Pro","modelIdentifier":"Mac15,3","macOSBuild":"24A335","macOSVersion":"15.0","serialNumber":"TEST001","setupManagerVersion":"2.0.0"}'
```

## Coverage

**Requirements:** None enforced

**View Coverage:** Not applicable

## Test Types

**Unit Tests:**
- Not implemented
- Candidates for unit testing:
  - `validateWebhookPayload()` in `src/types.ts`
  - `timingSafeEqual()` in `src/index.ts`
  - `sanitizeCsvValue()` in `src/components/dashboard/Filters.tsx`
  - Helper functions like `formatDuration()`, `getThroughputQuality()`

**Integration Tests:**
- Not implemented
- Candidates for integration testing:
  - Worker request routing (`POST /webhook`, `GET /api/events`, etc.)
  - WebSocket connection and message handling
  - Durable Object broadcast functionality

**E2E Tests:**
- Not implemented
- Dashboard functionality manually verified using dummy data script

## What Should Be Tested

**High Priority (Core Functionality):**

1. **Webhook Validation** (`src/types.ts`):
   - Valid started payload acceptance
   - Valid finished payload acceptance
   - Missing required field rejection
   - Invalid timestamp rejection
   - Prototype pollution key rejection
   - Invalid enrollment action rejection

2. **Worker Routes** (`src/index.ts`):
   - Webhook token authentication
   - Content-Type validation
   - Payload size limit enforcement
   - CORS header behavior
   - JWT validation (when configured)

3. **WebSocket Hook** (`src/hooks/useWebSocket.ts`):
   - Connection establishment
   - Reconnection with exponential backoff
   - Event deduplication
   - Stats computation accuracy

**Medium Priority:**

4. **CSV Export** (`src/components/dashboard/Filters.tsx`):
   - Formula character sanitization
   - Quote escaping in values
   - Header generation

5. **Chart Data Bucketing** (`src/components/dashboard/EventsChart.tsx`):
   - Time range filtering
   - Bucket aggregation accuracy

## Recommended Test Setup

**Framework Recommendation:**
- Vitest (aligns with Vite-based project)
- Install: `npm install -D vitest @testing-library/react @testing-library/jest-dom`

**Proposed Configuration (`vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Proposed Test Structure:**
```
src/
├── __tests__/
│   ├── types.test.ts           # Validation function tests
│   ├── index.test.ts           # Worker route tests (with miniflare)
│   └── hooks/
│       └── useWebSocket.test.ts
├── components/
│   └── dashboard/
│       └── __tests__/
│           ├── Filters.test.tsx
│           └── EventsChart.test.tsx
```

**Worker Testing:**
- Use Miniflare or Vitest's Cloudflare Workers testing utilities
- Mock KV namespace and Durable Objects for unit tests

## Validation Patterns (Current)

The codebase uses runtime validation instead of tests:

```typescript
// src/types.ts - Comprehensive validation
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidTimestamp(value: unknown): boolean {
  if (!isNonEmptyString(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && isFinite(value);
}

function hasDangerousKeys(obj: object): boolean {
  return Object.keys(obj).some((key) =>
    (DANGEROUS_KEYS as readonly string[]).includes(key)
  );
}
```

These validation functions would be ideal candidates for unit tests to ensure edge cases are handled correctly.

---

*Testing analysis: 2026-04-17*
