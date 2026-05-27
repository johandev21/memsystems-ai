<!-- intent-skills:start -->
# 32 skills in 10 packages. Load: bunx @tanstack/intent@latest load <use>
# @tanstack/devtools(4): devtools-app-setup, devtools-marketplace, devtools-plugin-panel, devtools-production
# @tanstack/devtools-event-client(3): devtools-bidirectional, devtools-event-client, devtools-instrumentation
# @tanstack/devtools-vite(1): devtools-vite-plugin
# @tanstack/react-start(3): react-start, lifecycle/migrate-from-nextjs, server-components
# @tanstack/router-core(10): router-core, auth-and-guards, code-splitting, data-loading, navigation, not-found-and-errors, path-params, search-params, ssr, type-safety
# @tanstack/router-plugin(1): router-plugin
# @tanstack/start-client-core(6): start-core, deployment, execution-model, middleware, server-functions, server-routes
# @tanstack/start-server-core(1): start-server-core
# @tanstack/virtual-file-routes(1): virtual-file-routes
# dotenv(2): dotenv, dotenvx
<!-- intent-skills:end -->

## Frontend Context

- **Working Directory**: Use `frontend/` as the working directory for UI work.
- **Commands**: `bun install`, `bun run dev`, `bun run build`, `bun run preview`, `bun run test`, `bun run lint`, `bun run format`, `bun run check`.
- **Generated Code**: `frontend/src/routeTree.gen.ts` is generated. Do not edit it by hand.
- **Architecture**: `frontend/src/routes/__root.tsx` owns the app shell, theme bootstrap, and devtools.
- **Tooling**: Biome is the formatter and linter; the config uses tabs and double quotes.
