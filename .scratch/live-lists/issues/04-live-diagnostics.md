# Diagnostics pushed, not polled

Status: ready-for-agent
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
