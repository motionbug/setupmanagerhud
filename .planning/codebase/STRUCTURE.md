# Codebase Structure

**Analysis Date:** 2026-04-17

## Directory Layout

```
setupmanagerHUD/
├── .claude/                # Claude Code configuration
├── .github/
│   └── workflows/          # GitHub Actions (empty/placeholder)
├── .planning/
│   └── codebase/           # GSD codebase analysis documents
├── dist/                   # Vite build output (generated, not committed)
├── docs/                   # Documentation assets
│   └── dashboard.png       # Screenshot for README
├── node_modules/           # Dependencies (not committed)
├── public/                 # Static assets served as-is
│   ├── jamf-icon-dark.svg  # Logo for light theme
│   └── jamf-icon-white.svg # Logo for dark theme
├── scripts/                # Development utilities
│   └── send-dummy-events.js # Test webhook script
├── src/
│   ├── components/
│   │   ├── dashboard/      # Feature components (App, charts, tables)
│   │   ├── providers/      # Context providers (empty)
│   │   └── ui/             # shadcn/ui primitives
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Layout components (empty)
│   ├── lib/                # Utility functions
│   ├── styles/             # Global CSS
│   ├── DashboardRoom.ts    # Durable Object class
│   ├── index.ts            # Worker entry point
│   ├── main.tsx            # React entry point
│   └── types.ts            # Shared TypeScript types
├── CLAUDE.md               # Claude Code instructions
├── components.json         # shadcn/ui configuration
├── index.html              # SPA entry HTML
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS config (Tailwind)
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler config
└── wrangler.toml           # Cloudflare Workers config
```

## Directory Purposes

**`src/`:**
- Purpose: All application source code (Worker + React)
- Contains: TypeScript files, React components, styles
- Key files: `index.ts` (Worker), `main.tsx` (React), `types.ts` (shared)

**`src/components/dashboard/`:**
- Purpose: Feature-specific React components for the dashboard
- Contains: App shell, KPI cards, charts, data table, filters
- Key files: `App.tsx`, `EventsTable.tsx`, `Filters.tsx`, `KpiCards.tsx`

**`src/components/ui/`:**
- Purpose: Reusable UI primitives (shadcn/ui)
- Contains: Button, Card, Table, Select, Input, etc.
- Key files: All files are standalone components

**`src/hooks/`:**
- Purpose: Custom React hooks for shared logic
- Contains: WebSocket connection management
- Key files: `useWebSocket.ts`

**`src/lib/`:**
- Purpose: Utility functions used across components
- Contains: `cn()` helper for Tailwind class merging
- Key files: `utils.ts`

**`src/styles/`:**
- Purpose: Global CSS including Tailwind theme
- Contains: CSS custom properties, base styles, component variants
- Key files: `globals.css`

**`public/`:**
- Purpose: Static assets copied directly to build output
- Contains: SVG icons (Jamf logo variants)
- Key files: `jamf-icon-dark.svg`, `jamf-icon-white.svg`

**`scripts/`:**
- Purpose: Development and testing utilities
- Contains: Script to send test webhook events
- Key files: `send-dummy-events.js`

**`docs/`:**
- Purpose: Documentation assets
- Contains: Screenshot for README
- Key files: `dashboard.png`

## Key File Locations

**Entry Points:**
- `src/index.ts`: Worker entry point (routes, handlers, auth)
- `src/main.tsx`: React entry point (mounts App component)
- `index.html`: HTML shell for SPA

**Configuration:**
- `wrangler.toml`: Cloudflare Workers config (KV, Durable Objects, assets)
- `vite.config.ts`: Vite bundler config (plugins, path aliases, dev proxy)
- `tsconfig.json`: TypeScript compiler options
- `components.json`: shadcn/ui component config
- `package.json`: Dependencies, npm scripts

**Core Logic:**
- `src/DashboardRoom.ts`: Durable Object for WebSocket management
- `src/types.ts`: Shared types and validation functions
- `src/hooks/useWebSocket.ts`: WebSocket client hook with reconnection

**Testing:**
- `scripts/send-dummy-events.js`: Manual webhook testing script

## Naming Conventions

**Files:**
- React components: PascalCase (`EventsTable.tsx`, `KpiCards.tsx`)
- Hooks: camelCase with `use` prefix (`useWebSocket.ts`)
- Utilities: camelCase (`utils.ts`)
- Worker/DO files: PascalCase or camelCase (`index.ts`, `DashboardRoom.ts`)

**Directories:**
- Lowercase, hyphenated for multi-word (`src/components/dashboard/`)
- Feature-based organization under `components/`

**Exports:**
- Named exports for components and hooks
- Default export for Worker entry (`src/index.ts`)

## Where to Add New Code

**New Dashboard Feature:**
- Component: `src/components/dashboard/NewFeature.tsx`
- Import in: `src/components/dashboard/App.tsx`
- Types: Add to `src/types.ts` if shared

**New UI Primitive:**
- Component: `src/components/ui/new-component.tsx`
- Follow shadcn/ui pattern (kebab-case filename, PascalCase export)
- Use `cn()` from `@/lib/utils` for class merging

**New Custom Hook:**
- Hook: `src/hooks/useNewHook.ts`
- Export named function starting with `use`

**New API Endpoint:**
- Handler function: Add to `src/index.ts`
- Route: Add case in default export fetch handler
- Auth: Add Cloudflare Access check if needed

**New Worker Feature:**
- Internal endpoint on DashboardRoom: Add to `DashboardRoom.fetch()`
- Shared types: Add to `src/types.ts`

**Utilities:**
- Shared helpers: `src/lib/utils.ts` or new file in `src/lib/`

## Special Directories

**`dist/`:**
- Purpose: Vite build output (frontend assets)
- Generated: Yes (by `npm run build`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**`.wrangler/`:**
- Purpose: Wrangler local development state
- Generated: Yes (by `npm run dev:worker`)
- Committed: No (in `.gitignore`)

**`public/`:**
- Purpose: Static assets copied verbatim to dist root
- Generated: No
- Committed: Yes
- Note: SVGs here are referenced by absolute path in components (`/jamf-icon-*.svg`)

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: By GSD commands
- Committed: Depends on team preference

---

*Structure analysis: 2026-04-17*
