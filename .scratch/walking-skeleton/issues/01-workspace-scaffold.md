# Workspace scaffold

Status: done
Type: task

Set up the pnpm workspace with `packages/engine`, `packages/server`, `packages/web`, `tools/board-sim`; strict TypeScript; a test runner (Vitest); lint/format; a `Dockerfile` + `docker-compose.yml` that builds and serves server + web as one image with a SQLite volume. `packages/engine` must have zero runtime dependencies.

## Acceptance

- `pnpm install && pnpm test && pnpm build` pass on a clean clone.
- `docker compose up` serves a placeholder page on the server port.
- No asset is fetched from the internet at runtime (ADR-0005).

## Comments

**2026-10-18, done.** pnpm 12 workspace, TypeScript 7 (strict), Vitest 5 projects run against sources via the `source` export condition, Biome 2 for lint/format, React 19 + Vite 8, Fastify 5 serving `/api/health` and the SPA. `pnpm install && pnpm test && pnpm build` verified on a clean clone. Docker image built and verified on the server (`/api/health` OK). SQLite is left to ticket 05; `DATA_DIR=/data` is already set in the image.
