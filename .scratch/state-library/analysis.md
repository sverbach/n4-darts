# Would a small state library improve the web app?

Analysis for `issues/01-evaluate.md`, 2026-10-31. Code references are to `packages/web/src` at `479b47c`.

**Recommendation: no state library.** The web app has almost no client-side state worth sharing, and its server state is already handled by one simple mechanism (whole views pushed over SSE). The real weaknesses are a few lists that are fetched once instead of followed live, and repeated fetch boilerplate. A client store (Zustand, Jotai, context) fixes neither. TanStack Query would fix the boilerplate, but brings a second way of handling server data next to the live views. The better fix is to make those lists live like everything else (follow-up ticket at the end).

## 1. What state there is today

### Server state, followed live (SSE)

Every live view is pushed **whole** by the server and kept in the component as "the latest view" (`lib/useLive.ts`, `lib/useStation.ts` on top of it). Nothing is merged or patched on the client.

| Where | Stream | Who changes it |
|---|---|---|
| `features/station/StationPage.tsx`, `features/watch/WatchPage.tsx` | `/api/stations/:id/live` via `useStation` | the board, the station's commands (`send`), /admin |
| `features/display/DisplayPage.tsx` | `/api/display/live` | everything in the room |
| `features/admin/tournament/TournamentAdmin.tsx` | `/api/admin/tournament/live` | the organiser's changes (`request`), the scheduler, matches finishing |
| `features/admin/stations/StationsAdmin.tsx` | `/api/admin/stations/live` | /admin, the boards |
| `features/admin/matches/MatchesAdmin.tsx` | `/api/stations/live` | the stations |
| `features/admin/matches/MatchHistory.tsx` (`MatchDetailView`) | `/api/admin/matches/:id/live` | the station, corrections |

Changes go out with `request()` (`lib/api.ts`) or `useStation`'s `send`; the screen updates when the server pushes the new view. There is no optimistic update and no client copy that could drift.

### Server state, fetched by hand

| Where | What | Kept fresh how |
|---|---|---|
| `App.tsx` (`Home`) | `/api/stations` | once, on load |
| `features/admin/AdminPage.tsx` | `/api/admin/session`, login, logout | after login/logout |
| `features/admin/players/PlayersAdmin.tsx` | `/api/admin/players` | once, and again after each of **its own** changes |
| `features/admin/players/PhotoEditor.tsx` | photo upload/delete | the parent reloads |
| `features/admin/matches/MatchHistory.tsx` (`MatchHistory`) | `/api/admin/matches` | once, on load |
| `lib/usePlayers.ts` (used by `components/PlayerPicker.tsx`, `TournamentRun.tsx`'s `Roster`) | `/api/players` | once **per component instance**, again after its own `add` |
| `features/stats/StatsPages.tsx` | leaderboard, profile | once (stats pages don't update live by design, VIEW-01) |
| `features/admin/diagnostics/DiagnosticsAdmin.tsx` | `/api/admin/diagnostics` | polled every 2 s |

### UI state

Plain `useState` in the component that owns it: forms, pickers, open menus and dialogs, the dart being corrected, save status. At most 7 `useState` per file (`TournamentAdmin.tsx`, `PlayersAdmin.tsx`). No React context, no reducers anywhere.

### Props passed down

`view`/`match` and a `send` function, at most two levels deep: `TournamentAdmin` → `TournamentRun` → `StationRow` / `QueueRow` / `Roster`; `StationPage` → `Lineup` / `Match` → `Scoreboard`. Every hop is a component in the same file or the same feature.

## 2. Where it hurts, concretely

1. **Two admin lists don't follow changes.** VIEW-01 says every screen except the stats pages updates by itself, but `PlayersAdmin.tsx` (lines 12–20) and `MatchHistory.tsx`'s list (lines 24–30) are fetched once. A player added at a station, or a match finishing while the organiser looks at the history, only shows after a reload. (Home's station list, `App.tsx` line 41, is fetched once too.)
2. **The player list is fetched per component.** `usePlayers()` keeps its own copy in each component that calls it; a player added in one `PlayerPicker` doesn't show in another mounted component until it remounts. Today the two users are on different screens, so this rarely shows, but it's the one place two parts of the UI can disagree.
3. **Fetch boilerplate, seven times, handled differently.** Loading, error and reload are written by hand in each place above, and errors are handled inconsistently: `Home`, `MatchHistory` and `usePlayers` ignore a failed fetch silently, `PlayersAdmin` and `DiagnosticsAdmin` show one.

What does **not** hurt:

- **Prop drilling:** two levels at most, within one feature. Context or a store would hide where `send` comes from without saving much.
- **Client state:** small and local. Nothing is shared between pages (every navigation is a full page load).
- **Re-render cost:** each live message replaces one view in one component; the browser latency test shows a median of 1–6 ms from board to screen.

## 3. What a library would change

**Zustand** (or context with `useReducer`, or Jotai): these hold *client* state. Used here, the live views would move from `useLive`'s `useState` into a store, and the components would read from the store instead. That is the same data with one more indirection: the server still pushes whole views, and the store would only be a second place to hold them. It fixes none of the three pain points: the lists still have to be fetched or followed, and `usePlayers` would still need someone to refresh it.

```ts
// Zustand, for the player list (pain point 2): one shared copy, but still fetched by hand
const usePlayerStore = create<{ players: Player[] | null; load(): Promise<void> }>((set) => ({
  players: null,
  load: async () => set({ players: await (await fetch("/api/players")).json() }),
}));
// …and every caller still has to decide when to call load().
```

**TanStack Query**: this one is about *server* state, and it addresses 2 and 3: one cache per URL shared by all components (so `usePlayers` can't disagree with itself), uniform loading and error states, and refetching after a change (`invalidateQueries`) or on an interval (diagnostics).

```ts
const players = useQuery({ queryKey: ["players"], queryFn: () => get("/api/players") });
const add = useMutation({ mutationFn: post, onSuccess: () => client.invalidateQueries({ queryKey: ["players"] }) });
```

But for pain point 1 it can only poll or refetch on focus, while the rest of the app is pushed live. The app would then have two models for server data: SSE views for most screens, a query cache for a few.

**Nothing new, and finish what the architecture already does:** the server's change feed sees every database write (`docs/architecture/08-crosscutting-concepts.md`, 8.3), and `streamView` turns any view function into a live stream. Making the players list (admin and pickers), the match history and Home's station list live is a route each on the server and `useLive(url)` on the client. That fixes 1 and 2 the same way as every other screen, and removes most of the hand-written fetches behind 3. The one-shot fetches left (stats pages, the admin session) could share a ten-line `useFetch(url)` in `lib/` for consistent loading and errors.

## 4. What it would cost

Sizes measured on 2026-10-31 by bundling a minimal real use of each with the project's Vite (minified, React not included, gzip -9). For scale: the web app's JS bundle is 94.2 kB gzip today.

| Option | Version | Bundle | Other costs |
|---|---|---|---|
| Zustand (`create`) | 5.0.16 | 0.5 kB | A second place for state next to `useState`; doesn't remove any fetching |
| Jotai (`atom`, `useAtom`) | 3.0.1 | 3.9 kB | As Zustand, plus atoms as a concept |
| TanStack Query (`QueryClient`, provider, `useQuery`, `useMutation`) | 5.105.0 | 12.1 kB | A second model for server data next to SSE; a provider at the root; cache keys and invalidation to learn and keep right |
| Context + `useReducer` | React | 0 | Boilerplate per store; hides where data comes from |
| Live lists + `useFetch` | (ours) | ~0 | Three or four small server routes; nothing new to learn |

Testing: the live-list option stays testable as today (server routes through `buildApp`, pages through Playwright). A store or query cache would need resetting between unit tests, and the web package has only one unit test so far.

## 5. Recommendation

**Don't introduce a state library now.** Instead, follow-up ticket:

> **Every admin list updates by itself (VIEW-01).** Live streams for the player list (`/api/players/live`, used by `usePlayers` and `PlayersAdmin` with its ratings), the match history (`/api/admin/matches/live`) and Home's stations (the existing `/api/stations/live`), on the server's change feed like the other views; the pages switch from `fetch` to `useLive`. A small `useFetch(url)` in `lib/` for the one-shot fetches left (stats pages, admin session) with the same loading and error handling everywhere. Acceptance: a player added at a station appears in /admin and in an open picker without a reload; a finished match appears in the history; the browser tests cover both.

**What would change the answer:**

- **Client-side navigation** with state kept across pages (e.g. the organiser's filters, a half-filled form when switching tabs): then a small client store, and Zustand would be the lightest fit.
- **State that only exists on the client and is shared** across components far apart (e.g. darts queued while the server is unreachable, a multi-step setup spread over components).
- **Many one-shot fetches with caching needs** that can't reasonably be live (e.g. large, rarely changing reference data): then TanStack Query earns its 12 kB.
