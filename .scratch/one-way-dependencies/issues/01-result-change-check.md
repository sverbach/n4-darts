# Matches asks "may this result change?" without knowing about tournaments

Status: done
Type: task

Matches and Tournaments depend on each other (`docs/architecture/functions.md`, Observations). Tournaments is built on Matches, but when the organiser corrects a dart, `packages/server/src/matches.ts` imports `Tournaments` and calls `tournaments.correctionProblem(...)` before the correction (TOUR-14) and `tournaments.corrected(...)` after it. Matches offers a "before a result changes" check, and Tournaments registers its rule there. Then the dependency points one way only: Tournaments → Matches.

No behaviour changes. This is a refactor.

## Decisions

- **The seam.** `matches.ts` defines a small interface of its own, e.g. `ResultGuard`, with the two calls it needs today:
  - `problem(match, events): string | null`: asked before a correction is stored. A string refuses it with 409, as now.
  - `changed(match)`: told after the correction is stored.
- **Wiring.** `registerMatches` takes a `ResultGuard` (optional, like `tournaments` is today) instead of `Tournaments`. `app.ts` passes the tournaments' implementation of it. `matches.ts` no longer imports `tournaments.ts`.
- **Names.** `correctionProblem` and `corrected` on `Tournaments` can stay or be renamed to fit the interface; whatever reads best at the call site.
- **One guard is enough.** No list of guards until there's a second rule.

## Acceptance

- `matches.ts` has no import from `tournaments.ts`.
- The existing tests pass unchanged, in particular `resultChanges.test.ts` (refused corrections name the match in the way; allowed ones rebuild what depends on them).
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Architecture docs updated:** in `docs/architecture/functions.md`, the dashed `matches -. "may a result change?" .-> tournaments` arrow is removed from the diagram (Tournaments → Matches already covers it), and the "Matches and Tournaments depend on each other" observation is rewritten to say the check is a seam Matches offers and Tournaments plugs into.

## Comments

2026-10-31: Confirmed by the user as written.

2026-10-31: Built. `ResultGuard` (`problem`, `changed`) in `packages/server/src/matches.ts`; `registerMatches` takes it instead of `Tournaments`. Tournaments exposes `resultGuard`, built from its existing `correctionProblem` and `corrected` (names kept), and `app.ts` passes it in. `matches.ts` no longer imports `tournaments.ts`; the type import now runs Tournaments → Matches. No test changes needed; all checks pass. `docs/architecture/functions.md`: dashed arrow removed, observation rewritten.
