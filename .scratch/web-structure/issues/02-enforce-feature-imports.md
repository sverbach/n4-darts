# The linter stops a feature from importing another feature

Status: done
Type: task
Blocked by: 01

Make the spec's rule hold by itself: a file in `packages/web/src/features/<a>/` may not import from `features/<b>/`. `pnpm lint` fails on it, so CI does too.

## Decisions

- **Biome, not a script.** `noRestrictedImports` (level `error`) in an `overrides` entry for `packages/web/src/features/**`, with gitignore-style `patterns` and a message that says where shared code goes ("Shared between features? Move it to components/ or lib/.").
- **The pattern.** Relative imports that leave a feature look like `../<other>/…` (or `../../<other>/…` from an admin tab). Find patterns that block those but allow `../../components/…`, `../../lib/…`, `../../assets/…`, a tab's `../AdminPage` or similar inside `admin/`, and `@n4/*`. If gitignore-style patterns can't express it cleanly, use one override per feature folder, or add a `@/` path alias (tsconfig `paths` + Vite `resolve.alias`) for `components/`, `lib/` and `assets/`, and then ban every `../` import inside `features/` except within `admin/`. Pick whichever reads simplest in `biome.json`.
- **Proven both ways.** Add a cross-feature import on purpose, see `pnpm lint` fail with the message, and remove it again.

## Acceptance

- `pnpm lint` fails on an import from one feature into another, with the message, and passes on the code as it is.
- Imports from `components/`, `lib/`, `assets/`, `@n4/engine`, `@n4/server/api` and within a feature (and within `admin/`) are allowed.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Architecture docs updated:** `docs/architecture/05-building-block-view.md` (5.2, the web white box) states the rule and that the linter enforces it; `docs/architecture/02-architecture-constraints.md` (2.3 Conventions) gets a line for it.

## Comments

2026-10-31: Confirmed by the user as written.

2026-10-31: Built. Two `overrides` in `biome.json`, no path alias needed:
- Files directly in a feature (`features/*/*`): banned `../**` except `../../**`, plus `../../features/**`.
- Files one folder deeper (`features/*/*/*`, the admin tabs): banned `../../**` except `../../../**`, plus `../../../features/**`. `../AdminPage.tsx` and `../matches/…` stay allowed, so admin and its tabs are one feature.
- Message: "A feature never imports from another feature (docs/architecture/05-building-block-view.md, 5.2). Shared between features? Move it to components/ or lib/."
- Proven with probe files at both depths (imports and re-exports): every cross-feature path was flagged, and `components/`, `lib/`, own-folder and within-admin imports passed. `pnpm lint` failed on the probe and passed after removing it. A deeper folder in a feature would need a third override; noted in 5.2.
- Also restored `main.tsx`'s import order, which ticket 01's import rewrite had changed (no effect, but it wasn't meant to change).
- All checks pass. Docs: 5.2 states the rule is linted; 2.3 Conventions has a line for it.
