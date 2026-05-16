# Repository Guidelines

## Project Structure & Module Organization

Setup Manager HUD is a TypeScript React/Vite frontend deployed with a Cloudflare Worker backend. Worker code lives in `src/index.ts`, `src/DashboardRoom.ts`, `src/kv.ts`, and `src/types.ts`. The React app starts at `src/main.tsx`; dashboard features are in `src/components/dashboard/`, reusable shadcn-style primitives in `src/components/ui/`, hooks in `src/hooks/`, utilities in `src/lib/`, and global styles in `src/styles/globals.css`. Static assets belong in `public/`. Tests are colocated as `src/*.test.ts` or placed in `test/` for integration/security behavior. Deployment config is in `wrangler.toml`.

## Build, Test, and Development Commands

- `npm install` installs dependencies. Node.js `>=20` is required.
- `npm run dev` starts the local Vite frontend.
- `npm run dev:worker` starts Wrangler for the Cloudflare Worker environment.
- `npm run build` produces the Vite build in `dist/`.
- `npm run typecheck` runs `tsc --noEmit`.
- `npm test` runs Vitest once using `@cloudflare/vitest-pool-workers`.
- `npm run test:watch` starts Vitest in watch mode.
- `npm run deploy` builds and deploys with Wrangler.

## Coding Style & Naming Conventions

Use TypeScript modules and React function components. Follow existing formatting: two-space indentation, double quotes, semicolons, and named exports where the surrounding code uses them. Name React components in `PascalCase` (`EventsTable.tsx`), hooks as `useSomething`, and tests as `*.test.ts`. Keep dashboard-specific UI out of `src/components/ui/`.

## Testing Guidelines

Vitest is configured through `vitest.config.ts` to execute against the Cloudflare Workers pool and `wrangler.toml`. Add focused tests near changed backend or shared modules, or under `test/` for request/security behavior. Run `npm test` and `npm run typecheck` before opening a PR. Cover webhook auth, KV behavior, Durable Object broadcasts, and data-shape changes when touched.

## Commit & Pull Request Guidelines

Git history uses Conventional Commits, including `fix: ...`, `docs: ...`, `chore: ...`, and scoped forms such as `docs(phase-03): ...`. Keep commits small and imperative. Pull requests should include a summary, tests run, related issue or context, and screenshots for visible dashboard changes. Note required Cloudflare configuration changes, such as KV bindings, Durable Object migrations, Access variables, or `WEBHOOK_TOKEN` secrets.

## Security & Configuration Tips

Do not commit real Cloudflare account IDs, KV IDs, access audience values, team domains, webhook tokens, or Wrangler secrets. Production webhook auth depends on `WEBHOOK_TOKEN`, and dashboard access can be protected with Cloudflare Access variables documented in `wrangler.toml` and `README.md`.
