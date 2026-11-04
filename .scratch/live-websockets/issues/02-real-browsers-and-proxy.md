# Live views over WebSockets in real browsers and behind the proxy

Status: ready-for-human
Type: task
Blocked by: 01

Things the automated tests can't show: Playwright switches the back/forward cache off, and `ui-bugs/03` only reproduced in Brave.

## Checks

- **Brave, the dev server and the built app:** click through every /admin tab for a minute, use Back and Forward, and open 7+ live tabs. No page request should stay pending, and `/api/admin/diagnostics` should list only the streams of pages that are actually open.
- **Back/forward:** going back to a live page shows current data (a reload is fine).
- **Kiosk:** a station page on a kiosk. Turn its Wi-Fi off for a minute and back on: it reconnects by itself, and diagnostics drops the old stream within about 50 s.
- **Behind the room's proxy:** turn on the WebSocket toggle in nginx UI. Play a long match: darts show up as fast as on the local IP, also late in the match, and a page left open and idle for 5+ minutes keeps updating.
- **Without the toggle** (optional): the page shows disconnected instead of looking slow. That confirms the README's advice is right.

## Acceptance

All checks pass. Record the results, and anything odd, under Comments.
