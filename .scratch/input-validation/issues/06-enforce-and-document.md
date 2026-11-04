# Keep it that way, and document it

Status: done
Type: task
Blocked by: 02, 03, 04, 05

## What to do

- **Enforcement**, so a new route can't slip back:
  - Ban `zod` imports outside `api.ts`, `parse.ts`, the `*Routes.ts` files and `app.ts`, with `noRestrictedImports` in `biome.json` next to the existing `fastify` rule.
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

## Comments

2026-11-04: Built.
- **`zod` imports:** `biome.json`'s logic override now restricts `fastify` and `zod` together. `api.ts` and `parse.ts` got their own override with `fastify` only, since one file can't merge two `noRestrictedImports` overrides.
- **No `unknown` in logic:** a Biome GritQL plugin works, and overrides can scope it, so no test was needed.
  - `lint/typed-logic.grit` flags a `JsFormalParameter` or `TsPropertySignatureTypeMember` that contains `unknown`, in `packages/server/src/**` minus the routes files, `app.ts`, `api.ts`, `parse.ts`, `db.ts`, `testing/` and tests.
  - It leaves out parameters of callbacks passed to a call (`.catch((error: unknown) => …)` in `show.ts`) and types inside an `as` cast (`wled.ts` reading the device's JSON).
- **No route generics:** `lint/no-route-generics.grit` flags `app.`/`zips.` + `get`/`post`/`put`/`patch`/`delete` with type arguments, in the routes files and `app.ts`. The `Buffer` uploads parse their body too (`FileBody`), so no exception was needed. The last generic was in `statsRoutes.ts`, now parsed with `TextIdParams`.
- **Proven by planting violations** (then removed): an `unknown` parameter, `{ name?: unknown }` and a `zod` import in `players.ts`, a `fastify` import in `players.ts` and in `api.ts`, and `app.post<{ Body: … }>` in a routes file. Each failed `biome lint` with its message pointing at the ADR.
- **Docs:**
  - `docs/adr/0010-requests-parsed-with-zod-at-the-routes.md`.
  - Architecture section 2.3 (a convention bullet), 5.2 (the layering is now "routes parse, logic decides, `db.ts` stores", plus the lint rules), and a new 8.8 "Input validation". Operations moved to 8.9; nothing linked to the old number.
  - Section 9: ADR 0010 in the table, and an "Input validation" entry in the decision log with what's stricter now and what a segment is.
  - `GLOSSARY.md` needs nothing: "a miss or bounce-out" already covers it. `parse.ts`'s header points at the ADR again.
