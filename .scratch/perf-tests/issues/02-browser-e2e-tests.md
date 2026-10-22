# Browser end-to-end tests with Playwright

Status: ready-for-agent
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
