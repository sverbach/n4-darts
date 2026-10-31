# Every list follows the server live, one pattern everywhere

Follow-up to `.scratch/state-library/analysis.md`. Decided with the user (2026-10-31): **no state library**. Instead, the screens that still fetch once are made live like the rest, so the web app has one way to read server data.

## The pattern

- **Data that changes while a page is open** comes over Server-Sent Events: a stream on the server built with `streamView` on the change feed (`live.ts`), read on the client with `useLive(url)`. The server pushes the whole view; the client never patches it.
- **Data read once** (the stats pages, by design VIEW-01; the admin session) goes through one small hook, `useFetch(url)` in `lib/`, with the same loading and error handling everywhere.
- **Changes** go out with `request()` (`lib/api.ts`) as today. A page doesn't reload anything after its own change: the stream brings the new view.
- **No `fetch` in features or components.** Only `lib/` calls `fetch`; a lint rule enforces it.

## What changes

| Screen | Today | After |
|---|---|---|
| /admin players (`PlayersAdmin`) | fetched once, reloaded after its own changes | live |
| Player pickers (`usePlayers`: `PlayerPicker`, the tournament's `Roster`) | fetched once per component | live, so two pickers can't disagree |
| /admin matches, the history list (`MatchHistory`) | fetched once | live |
| Home's station list | fetched once | live (the existing `/api/stations/live`) |
| /admin diagnostics | polled every 2 s | live, pushed every 2 s while open |
| Stats pages, admin session | fetched by hand, errors handled differently | `useFetch` |

## Out of scope

- Client-side navigation and any client store (the analysis lists when that would change).
- Making the stats pages live: VIEW-01 keeps them still on purpose.

## Tickets

1. `01-live-players.md`: players live (admin and pickers)
2. `02-live-match-history.md`: the match history live
3. `03-live-home-stations.md`: Home's stations live
4. `04-live-diagnostics.md`: diagnostics pushed instead of polled
5. `05-use-fetch-and-lint.md`: `useFetch` for the rest, `fetch` only in `lib/`, docs on the pattern

Each ticket updates the architecture docs it touches.
