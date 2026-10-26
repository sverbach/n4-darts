# Browser end-to-end tests with Playwright

Status: done
Type: task

The tests so far stop at the server. Nothing checks that the pages actually show what the server sends, or how long that takes in a browser. Playwright's test runner covers both: the UI flows, and the time from a dart to the screen.

## In scope

- **Setup.**
  - `@playwright/test` with Chromium only, in a new workspace package `e2e/` (or `packages/e2e`).
  - A Playwright `webServer` starts the built app against a fresh temporary database and two simulated boards, the way `dev:sim` does, but from the production build.
  - Tests seed players through the API.
- **Flows**, at phone width (390 px) and desktop width (1440 px) where the layout differs:
  - **Station:** set up a quick match, start it, throw darts through the simulator and see them; correct a dart; add a missed dart ("+ Add"); undo; take out; play to "Game shot"; Done.
  - **Board menu:** End match and Cancel match.
  - **Display and watch:** `/display` and `/watch/1` follow the same match live.
  - **Admin:** PIN screen; create, start and play one match of a small tournament; correct a dart in match detail.
- **Latency.** With the station, `/display` and `/watch/1` open in three pages, throw a long match through the simulator (e.g. 300 darts). For each dart, measure the time from the throw until it shows on the station page (the dart tile has the new label). The same rules as ticket 01 decide failure: growth from the first to the last block, plus a loose ceiling.
- **CI.** A separate `e2e` job:
  - installs Chromium with dependencies (`playwright install --with-deps chromium`) and caches the browser;
  - runs after `check`, and the Docker publish waits for it too;
  - uploads the Playwright report and traces as an artifact when it fails.
- **Locally.** `pnpm e2e` runs it, and `pnpm e2e --ui` debugs it. A short README note in "Development".
- **Selectors.** Use roles and labels (`getByRole`, `aria-label`, which most controls already have) rather than CSS classes, so restyling doesn't break the tests. Where something can't be found that way, add the missing `aria-label` rather than a test-only id.

## Out of scope

- Other browsers.
- Screenshot comparison: the design still changes too often.
- An nginx-with-gzip run: the header test from `live-behind-proxy` guards that.

## Acceptance

- `pnpm e2e` passes locally and in CI. The job adds at most about 2 minutes.
- A deliberately broken page (e.g. the station no longer rendering new darts) and an artificial delay in the station stream both make it fail. Note in the comments which were tried.

## Comments

2026-10-26: Built as `packages/e2e` (`@playwright/test` 1.64.1, Chromium only).
- **Server.** `src/start.ts` starts two simulated boards (:4381/:4382) in-process and the built server (`packages/server/dist/main.js`) on :4300, with a fresh temporary database and `ADMIN_PIN=4242`. That's away from the dev ports, so it runs next to `pnpm dev:sim`.
- **Shared state.** Tests share the server and its stations, so they run one at a time. A fixture logs in through the API, makes sure Ann, Bob and Cid exist, and clears both stations and the boards before each test.
- **Tournaments.** A finished tournament stays on show in /admin and on /display until the next one is created, so the fixture hides it behind an empty draft. The tournament test discards that draft and uses the real "New tournament" button.
- **Layouts.** Two projects, phone (390 px) and desktop (1440 px). Every flow runs in both, except latency, which runs on desktop (the kiosk) only.
- **Latency.** A `MutationObserver` in the station page records when the visit's dart tiles change. Each dart is timed from the throw to that change (both `Date.now()`, same machine). 300 darts with station, /display and /watch/1 open. It fails above 150 ms or on 4× growth (medians under 5 ms are noise), and stops at the first dart over 150 ms. Locally the median is about 2 ms and the slowest 3–4 ms.
- **Selectors.** Roles and labels only. No `aria-label` had to be added: the display's station cards are links named by their content.
- **CI.** An `e2e` job after `check` that builds, caches `~/.cache/ms-playwright` by the lockfile, installs Chromium with its system libraries, runs `pnpm e2e`, and on failure uploads `playwright-report` and `test-results`. `docker-build` now needs both. The Dockerfile copies `packages/e2e/package.json` so the frozen-lockfile install still matches; the image built locally.
- **Run time.** 14 tests (1 skipped), about 11–13 s locally, plus install, build and the browser in CI.

Tried on purpose:
- The station page rendering only the first dart of a visit: the station flow fails on both layouts and the latency test fails.
- A 200 ms delay on the station stream: the latency test fails on its first dart (205 ms against 150).
