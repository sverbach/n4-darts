# Keep it that way, and document it

Status: ready-for-agent
Type: task
Blocked by: 02, 03, 04, 05

## What to do

- **Enforcement**, so a new route can't slip back:
  - Ban `zod` imports outside `api.ts`, the `*Routes.ts` files and `app.ts`, with `noRestrictedImports` in `biome.json` next to the existing `fastify` rule.
  - Keep `unknown` out of the parameters of the logic modules (every non-routes file in `packages/server/src` but `db.ts`). Try a Biome GritQL plugin first. If it can't be limited to those files, write a test in `testing/` that scans them and fails on `: unknown` in an exported function's parameters, and give the reason in its message.
  - Make route generics that declare `Body` fail lint or that test (`app.post<{ Body: … }>`), except the `Buffer` uploads.
- **ADR 0010**: request input is parsed with Zod at the routes, schemas in `api.ts`, types derived from them. Cover the alternatives weighed (TypeBox with Fastify's JSON Schema validation, Valibot, hand-written checks), why Zod won, and the consequences (one dependency; shape in schemas, domain rules in the logic; messages in two places).
- **Architecture docs**:
  - 5.2 (white box: server): the layering becomes "routes parse, logic decides, `db.ts` stores".
  - Section 8 (crosscutting): a short "Input validation" entry.
  - Section 9: lists ADR 0010.
- `GLOSSARY.md`: nothing new expected; check it.

## Acceptance

- Adding `app.post<{ Body: { x: string } }>` to a routes file, or `function f(x: unknown)` to a logic file, fails `pnpm lint` or `pnpm test` with a message pointing at the ADR.
- The ADR and docs are written; all checks pass.
