# Repository Guidelines

## Project Structure & Module Organization

Setup Manager HUD is a TypeScript React/Vite dashboard deployed as a Cloudflare Worker. Worker entry and routing live in `src/index.ts`; WebSocket coordination is in `src/DashboardRoom.ts`; KV persistence helpers are in `src/kv.ts`; webhook payload types and validation are in `src/types.ts`. The React app starts at `src/main.tsx`, with dashboard features in `src/components/dashboard/`, reusable UI primitives in `src/components/ui/`, hooks in `src/hooks/`, utilities in `src/lib/`, global styles in `src/styles/globals.css`, and static assets in `public/`.

Tests are colocated as `src/*.test.ts`, with broader request/security flows under `test/`. Deployment configuration lives in `wrangler.toml`; customer-facing docs live in `README.md`, and extended setup docs live in the GitHub wiki repo.

## Build, Test, and Development Commands

- `npm install`: install dependencies; Node.js `>=20` is required.
- `npm run dev`: start the Vite frontend dev server.
- `npm run dev:worker`: run the Cloudflare Worker locally with Wrangler.
- `npm run build`: build the production frontend into `dist/`.
- `npm run typecheck`: run TypeScript checks without emitting files.
- `npm test`: build and run the Vitest suite once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run deploy`: build and deploy with Wrangler.

## Coding Style & Naming Conventions

Use TypeScript, ES modules, and React function components. Follow local formatting: two-space indentation, double quotes, semicolons, and named exports where nearby code uses them. Name components in `PascalCase` (`EventsTable.tsx`), hooks with `use` prefixes, tests as `*.test.ts`, and small Worker helpers with clear lower-case module names (`kv.ts`, `types.ts`). Keep generic UI primitives in `src/components/ui/`; dashboard-specific logic belongs in `src/components/dashboard/`.

## Testing Guidelines

Vitest runs through `@cloudflare/vitest-pool-workers`, so Worker behavior should be tested in the Cloudflare runtime where practical. Add focused tests near changed code. Run `npm run typecheck` and `npm test` before PRs. Cover webhook auth, payload validation, KV behavior, Durable Object broadcasts, Access/JWT behavior, and security headers when touching those paths.

## Recent Changes To Preserve

- Webhook auth uses `WEBHOOK_TOKEN` as the production secret and accepts Setup Manager's raw `Authorization` header format; Bearer tokens remain supported for manual `curl` testing.
- `/webhook` must stay reachable outside Cloudflare Access, but the Worker must reject missing or wrong webhook tokens.
- Dashboard, API, WebSocket, asset, 404, OPTIONS, and Access-denied responses should retain standard security headers.
- Customer docs must use placeholders for `CF_ACCESS_AUD`, `CF_ACCESS_TEAM_DOMAIN`, KV IDs, and tokens. Never copy values from test deployments.
- Cloudflare docs should reference `dash.cloudflare.com`; Access login options include One-time PIN plus providers such as GitHub, Google, Microsoft, Okta, SAML, and OIDC.

## Commit & Pull Request Guidelines

Use clear, imperative commit subjects. Existing history includes both Conventional Commit style (`fix: ...`, `docs: ...`) and short imperative messages (`Fix Access denial security headers`). Keep commits scoped to one logical change. PRs should include a short summary, tests run, related issue or context, screenshots for visible UI changes, and any Cloudflare configuration impact.

## Security & Configuration Tips

Do not commit `.dev.vars`, real webhook tokens, Access audience values, team domains, Cloudflare account IDs, or customer-specific KV IDs. Treat changes to `wrangler.toml`, Durable Object migrations, KV bindings, Access variables, and `WEBHOOK_TOKEN` behavior as deployment-affecting. Keep README and wiki guidance aligned when changing customer setup steps.
