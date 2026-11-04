# Requests are parsed with Zod at the routes

Every request body, path param and query string is parsed against a Zod schema in its `*Routes.ts` before the logic sees it. The schemas live in `packages/server/src/api.ts`, next to the view types, and the request types are derived from them (`z.infer`), so what the web app sends and what the server accepts can't drift apart. The web app imports only types from `api.ts`, so Zod isn't in its bundle. `parse()` in `parse.ts` throws on what doesn't fit, and one error handler in `app.ts` answers it with `400 { error }`. That's either the schema's own message (the ones the admin pages show, e.g. "a device needs a name"), or the field's path and Zod's message.

Before this, each logic module checked its own input by hand: parameters typed `unknown`, casts, and an `"invalid"` error of its own. Some routes declared a body type that nothing checked at runtime. That let an unknown `inRule`/`outRule` into a match's stored settings, and an unknown elimination or rule into a tournament's config.

We weighed:
- **TypeBox with Fastify's JSON Schema validation (Ajv):** native to Fastify and fast, but the schemas are clumsier, the errors harder to word for a person, and transforms (trimming a name, completing an address) don't fit.
- **Valibot:** the same idea in a smaller bundle. That doesn't matter here, because only the server runs the schemas.
- **Keeping the hand-written checks:** no dependency, but they had already drifted, and the gaps were real.

Zod won on readable schemas, discriminated unions (the station commands), transforms and friendly messages.

## Consequences

- **Shape in the schema, rules in the logic.** The schema owns types, ranges and allowed values; the logic keeps whatever needs state ("name already taken", "the match has already started", "3 players per group") and takes the parsed type, never `unknown`.
- **The linter keeps it that way:**
  - `zod` may only be imported in `api.ts`, `parse.ts`, the routes files, `app.ts` and the clients of devices on the network (`lights/wled.ts`).
  - The `lint/typed-logic.grit` plugin refuses a parameter or property typed `unknown` in the server's logic files.
  - `lint/no-route-generics.grit` refuses route registrations that declare what a request holds (`app.post<{ Body: … }>`).
- **The same goes for devices.** A WLED device's answers are untrusted input from the network too, so `wled.ts` parses them with schemas of its own, next to the client: they describe WLED's API, not ours.
- **Stored data isn't parsed on read.** It was written by our own server and is trusted. Changing a schema doesn't need a migration, but it also doesn't clean up what's already stored.
- **Messages live in two places:** the friendly ones in the schemas, the domain ones in the logic.
- **One more dependency** in the server, pinned like the rest.
