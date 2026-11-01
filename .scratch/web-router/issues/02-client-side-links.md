# Client-side navigation: links that don't reload the page

Status: needs-triage
Type: task
Blocked by: ui-slop-2 07 (after the design cleanup)

Since `01-wouter.md` the router picks the page, but every link is still a plain `<a href>`, so every tab and tile is a full page load. Each load starts the app from scratch, reopens every live stream and drops the previous page into the back/forward cache. That cache is what kept stale streams open in `ui-bugs/issues/03-stale-streams-stall-pages.md`. With client-side navigation a route change only swaps components: streams close through `useLive`'s effect cleanup, nothing lands in the back/forward cache, and moving between admin tabs is instant.

## What to do

- In-app links go through wouter's `Link` (or `useLocation` for buttons that navigate). Today they're in `components/Logo.tsx`, `features/home/HomePage.tsx`, `features/admin/AdminPage.tsx` (the tabs), `features/admin/stations/StationsAdmin.tsx`, `features/admin/matches/MatchesAdmin.tsx`, `features/display/DisplayPage.tsx` (station cards → /watch) and `features/stats/StatsPages.tsx` (back links, leaderboard → profile). Links that leave the app (a fake board on another port) stay plain.
- **Scroll:** a new route starts at the top; Back returns to where the user was (wouter doesn't do this by itself).
- **Focus and title:** after a route change, focus moves to the page's heading (screen readers otherwise hear nothing), and `document.title` names the page.
- **Admin tabs:** the strip's `scrollIntoView` on the current tab runs on every tab change, not only on a fresh page. `AdminPage` now stays mounted across tabs, so check what that changes: the session is fetched once, a tab's state resets when you leave it.
- **What still mounts fresh:** the stats pages read once by design (VIEW-01), so opening /players or a profile again must load it again, not show the old data.
- **Streams:** a stream that two routes share (Stations on several admin tabs) can stay open across the change if that falls out naturally; don't build a cache for it. Keep `followStream`'s `pagehide` guard for leaving the app and coming back.
- Kiosk pages (`/station/n`, `/watch/n`, `/display`) are opened directly and rarely navigated away from; they only need their links (display → watch, back) to work.

## Acceptance

- Clicking any in-app link changes the page without a document request (browser test: navigate Home → Admin → every tab → Players → a profile → Back, and assert no `document` request after the first load and no page error).
- Back and Forward land on the right page, at the right scroll position.
- Only the current screen's streams are open after a round of admin tabs (browser test, counting via `/api/admin/diagnostics`).
- The visual suite passes unchanged (or every change is explained).
- All checks pass. Bundle size before and after noted here.
- Docs: `docs/architecture/05-building-block-view.md` (5.2: links and navigation), `08-crosscutting-concepts.md` (live updates: when streams open and close), and ADR 0007 if the no-client-state reasoning changes.
