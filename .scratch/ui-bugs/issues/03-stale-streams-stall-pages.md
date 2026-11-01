# Pages stall after a few clicks: left pages keep their live streams

Status: done
Type: bug

Reported 2026-11-01: tapping around /admin, at some point a page's document request stays pending for 27 s to over a minute (Brave, dev server :5173, one tab).

## Cause

Pages the user has left stay alive in the browser's back/forward cache, and with them their open Server-Sent Events streams. Over HTTP/1.1 a browser has six connections per host, so after a few clicks the kept pages' streams use them all and the next document request queues until the browser evicts one. Seen directly in `/api/admin/diagnostics`: an "admin players" stream still open 102 s after the user had moved to Matches.

## Fix

Every stream goes through `followStream` (`packages/web/src/lib/liveStream.ts`, used by `useLive`): it closes on `pagehide` and opens again on `pageshow` when the page comes back from the cache (the server pushes the whole view on connect). Regression test: `liveStream.test.ts` (red against the old behaviour).

No browser test: Playwright switches the back/forward cache off, and headless Chrome with it on still released the streams, so the bug only showed in the user's Brave. Confirmed fixed there by the user.

Not covered, by decision: six or more live tabs in one browser can still stall the next page (reproduced headless); the app isn't expected to be open in more than one tab.
