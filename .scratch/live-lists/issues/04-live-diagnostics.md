# Diagnostics pushed, not polled

Status: done
Type: task

/admin diagnostics polls `/api/admin/diagnostics` every 2 seconds (`DiagnosticsAdmin.tsx`, a hand-written `setTimeout` loop). It's the last screen with its own way of staying fresh (`../spec.md`).

## What to do

- Server: `/api/admin/diagnostics/live`, behind the PIN. Unlike the other views it isn't driven by database writes: it sends a new view every 2 seconds while at least one client is connected (and only when it differs, like `streamView`).
- An open stream counts as "someone is looking", replacing the two-minute window after the last request that switches the heavier timings on (OPS-03, Q-17). **No grace period**: the heavier timings stop as soon as the last client leaves (decided with the user, 2026-10-31).
- **The page must not load the server.** One shared timer computes the view once per tick, whoever is connected, and sends the same view to every client; nothing is computed per client, and the timer stops when nobody is connected.
- Web: `DiagnosticsAdmin` reads it with `useLive`; the polling loop goes.

## Acceptance

- The page updates every 2 seconds as today; closing it stops the heavier timings at once (test on the server side).
- Two open diagnostics pages compute one view per tick, not two (test on the server side).
- `diagnostics.test.ts` covers the stream and the on/off of the heavier timings.
- The visual suite passes unchanged.
- All checks pass (types, lint, tests, load test, browser tests, build).
- **Docs:** `docs/architecture/08-crosscutting-concepts.md` (the diagnostics paragraph: "while someone has had the page open in the last two minutes"), and Q-17 in `docs/architecture/10-quality-requirements.md` if its wording depends on the polling.

## Comments

2026-10-31: Confirmed by the user, with no grace period; not loading the server matters more.

2026-10-31: Built.
- Server: `/api/admin/diagnostics/live` in `operationsRoutes.ts`. One timer for all open pages (started by the first, stopped with the last); `diagnostics.view(boards)` runs once per tick and the same JSON goes to every page, with that page's own request (`requestInfo`, worked out once when it connects) put in front. Sent only when it differs.
- The recorder's two-minute idle window is gone: `diagnostics.watch()` returns a `stop`, and the event-loop monitor and view/write timings run while at least one page watches. No grace period.
- `openEventStream` (in `liveRoutes.ts`) holds the SSE headers and keep-alive, shared by `streamView` and the diagnostics stream. New stream kind `diagnostics`, so the page lists itself.
- The one-shot `GET /api/admin/diagnostics` stays for scripts and tests; it no longer switches the timings on.
- `buildApp` takes `diagnosticsRefreshMs` (default 2000) so tests can tick faster.
- Tests: the stream (first view, next tick, each viewer's own request); two pages, one `view` call per tick; timings stop once both close; the recorder keeps collecting until the last of several watchers stops.
- Web: `DiagnosticsAdmin` reads the stream with `useLive`; the polling loop is gone.
- Docs: 8.x diagnostics paragraph. Q-17's wording ("costs next to nothing when nobody looks") still holds, unchanged.
- Visual suite: `admin-diagnostics-phone` and `-kiosk` retaken: the page now lists its own stream (kind `diagnostics`) under "Live streams" instead of "No screens connected". Stable over two further runs.
