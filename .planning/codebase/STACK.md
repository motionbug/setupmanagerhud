# Technology Stack

**Analysis Date:** 2026-04-17

## Languages

**Primary:**
- TypeScript ^5.3.3 - All source code (`src/**/*.ts`, `src/**/*.tsx`)

**Secondary:**
- JavaScript (ES modules) - Scripts (`scripts/send-dummy-events.js`)
- CSS - Styles with Tailwind (`src/styles/globals.css`)

## Runtime

**Environment:**
- Cloudflare Workers - Edge runtime with Durable Objects and KV support
- Node.js >=20.0.0 - Local development only

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

**Compatibility:**
- `wrangler.toml` sets `compatibility_date = "2024-12-01"` with `nodejs_compat` flag

## Frameworks

**Core:**
- React 19.0.0 - Frontend UI framework (`src/main.tsx`, `src/components/**`)
- Cloudflare Workers - Serverless edge runtime (`src/index.ts`)

**Build/Dev:**
- Vite 6.0.0 - Frontend build tool and dev server (`vite.config.ts`)
- Wrangler 4.61.0 - Cloudflare Workers CLI for local dev and deployment

**Styling:**
- Tailwind CSS 4.0.0 - Utility-first CSS framework
- tw-animate-css 1.4.0 - Animation utilities

## Key Dependencies

**Critical:**
- `react` / `react-dom` ^19.0.0 - React 19 with concurrent features
- `recharts` ^3.7.0 - Charting library for `EventsChart`, `ActionsChart`
- `@cloudflare/workers-types` ^4.20241127.0 - Type definitions for Workers runtime

**UI Components:**
- `@radix-ui/react-dropdown-menu` ^2.1.16 - Accessible dropdown menus
- `@radix-ui/react-select` ^2.2.6 - Accessible select components
- `@radix-ui/react-slot` ^1.2.4 - Slot composition pattern
- `@radix-ui/react-tooltip` ^1.2.8 - Accessible tooltips
- `class-variance-authority` ^0.7.1 - Component variant management
- `clsx` ^2.1.1 - Conditional class names
- `tailwind-merge` ^3.4.0 - Merge Tailwind classes without conflicts

**Icons/Fonts:**
- `@hugeicons/react` ^1.1.4 with `@hugeicons/core-free-icons` ^3.1.1 - Icon library
- `@fontsource-variable/figtree` ^5.2.10 - Variable font for UI

**Infrastructure:**
- None (all infrastructure is Cloudflare-managed)

## Configuration

**TypeScript:**
- `tsconfig.json` - ES2022 target, bundler module resolution, strict mode
- Path alias: `@/*` maps to `./src/*`
- Types: `@cloudflare/workers-types`, `node`

**Vite:**
- `vite.config.ts` - React plugin, Tailwind CSS v4 plugin
- Dev proxy: `/webhook`, `/api/*`, `/ws` proxy to `localhost:8787`

**Cloudflare Workers:**
- `wrangler.toml` - Worker configuration
  - Entry: `src/index.ts`
  - Static assets: `./dist` directory
  - Durable Object: `DashboardRoom` class
  - KV namespace: `WEBHOOKS` binding

**PostCSS:**
- `postcss.config.js` - Empty config (Tailwind v4 handles processing via Vite plugin)

**Environment Variables:**
- `WEBHOOK_SECRET` - Optional Bearer token for webhook authentication (set via `wrangler secret`)
- `CF_ACCESS_AUD` - Cloudflare Access audience tag (set in `wrangler.toml` vars)
- `CF_ACCESS_TEAM_DOMAIN` - Cloudflare Access team domain (set in `wrangler.toml` vars)
- Local dev: `.dev.vars` file (see `.dev.vars.example`)

## Build Configuration

**Development Commands:**
```bash
npm run dev          # Vite dev server (frontend only, port 5173)
npm run dev:worker   # Wrangler dev (full stack, port 8787)
npm run typecheck    # TypeScript type checking
```

**Production Commands:**
```bash
npm run build        # Build frontend to dist/
npm run deploy       # Build + deploy to Cloudflare Workers
npm run setup        # Create KV namespace (one-time)
```

**Build Output:**
- Frontend compiled to `dist/` via Vite
- Worker bundles `src/index.ts` with Durable Object export

## Platform Requirements

**Development:**
- Node.js >=20.0.0
- npm (lockfile present)
- Cloudflare account (for Wrangler commands)

**Production:**
- Cloudflare Workers (serverless edge)
- Cloudflare KV (key-value storage)
- Cloudflare Durable Objects (WebSocket coordination)
- Optional: Cloudflare Access (authentication)

---

*Stack analysis: 2026-04-17*
