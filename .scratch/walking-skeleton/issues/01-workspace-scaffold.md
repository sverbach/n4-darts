# Workspace scaffold

Status: ready-for-agent
Type: task

Set up the pnpm workspace with `packages/engine`, `packages/server`, `packages/web`, `tools/board-sim`; strict TypeScript; a test runner (Vitest); lint/format; a `Dockerfile` + `docker-compose.yml` that builds and serves server + web as one image with a SQLite volume. `packages/engine` must have zero runtime dependencies.

## Acceptance

- `pnpm install && pnpm test && pnpm build` pass on a clean clone.
- `docker compose up` serves a placeholder page on the server port.
- No asset is fetched from the internet at runtime (ADR-0005).
