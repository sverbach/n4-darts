# 10. Quality requirements

The quality goals in section 1.2 are the most important of these.

## 10.1 Quality requirements overview

| ID | Quality | Requirement | For | Source |
|---|---|---|---|---|
| Q-01 | Availability | A full tournament evening runs with the internet unplugged. Nothing is loaded from outside the room at runtime. | Org, Ops | ADR 0005 |
| Q-02 | Reliability | After a server restart, every match resumes exactly where it was, including the visit in progress. | Pla, Org | spec: walking-skeleton |
| Q-03 | Reliability | No dart is ever lost or counted twice, across board reconnects, server restarts and darts the board missed. | Pla | arch |
| Q-04 | Integrity | Results are always derived from the full record of the match. Nothing is overwritten: corrections are added on top, and old matches are replayed under their own rules. | Pla, Org | ADR 0002 |
| Q-05 | Responsiveness | A detected dart reaches the station's screens within 150 ms, measured over a long match. On a loaded machine a rare single dart may take longer (at most 3 in a test's match), but never over 500 ms. | Pla | ticket: perf-tests |
| Q-06 | Scalability | Responsiveness doesn't degrade over a long match, over an evening, or as the history grows over months. Tested over 600 darts with 200 past matches, and in the browser over 300 darts. | Pla, Ops | ticket: perf-tests |
| Q-07 | Durability | At most a day of data can be lost to a broken disk, given the operator keeps the backup folder elsewhere too. | Ops | spec: display-and-stats |
| Q-08 | Usability | The station can be used by touch, quickly, from where the player stands, and is readable from 2–3 m. | Pla | docs/ui-pages.md |
| Q-09 | Usability | The projector pages are readable from across the room and fit any screen without scrolling. | Spe | spec: design-system |
| Q-10 | Usability | Every page works on a phone (about 390 px wide) and on a laptop or kiosk (about 1440 px), with a layout for each. The organiser's area is made for a phone first. | Org, Pla | spec: design-system |
| Q-11 | Consistency | One visual language across all pages. Every colour is a named role, so a theme can be added in one place. | Pla, Dev | spec: design-system |
| Q-12 | Security | The PIN stops accidental edits by guests, not attackers. The system is for a private room and must not be exposed to the internet. | Org, Ops | ADR 0004, ticket: live-behind-proxy |
| Q-13 | Privacy | Player data (names, photos, history) stays on the room's server and in its backups. | Pla | ADR 0005 |
| Q-14 | Testability | Everything can be exercised without a real board, through a simulator that speaks the board's protocol. Game rules, scheduling and brackets can be tested without any I/O. | Dev | arch |
| Q-15 | Maintainability | Every change runs the full checks: types, lint, unit and integration tests, a load test, browser tests and the build. Nothing ships that fails them. | Dev, Ops | CI |
| Q-16 | Maintainability | The game rules exist once and are shared by the server and the browser. | Dev | ADR 0006 |
| Q-17 | Observability | A slow or broken evening can be explained afterwards from the diagnostics, and collecting them costs next to nothing when nobody looks. | Ops | ticket: diagnostics |
| Q-18 | Deployability | One container image and one data volume. The station laptops run nothing of ours. | Ops | arch |

## 10.2 Quality scenarios

| # | Goal | Scenario | Expected response | Requirement |
|---|---|---|---|---|
| QS-01 | Correct scores | The Board Manager's connection drops mid-visit after the second dart and comes back; meanwhile the third dart lands. | On reconnect the gateway resyncs; the third dart counts exactly once and the first two aren't counted again. | Q-03, BOARD-02 |
| QS-02 | Correct scores | The organiser corrects a dart in a group match whose result already decided a knockout match that has started. | The correction is refused, naming the match in the way; nothing changes. | TOUR-14, Q-04 |
| QS-03 | Correct scores | A rule changes in a new engine version. | Old matches replay under the rules version they were played with; their results and stats don't move. | PLAY-17 |
| QS-04 | Reliable evenings | The server is restarted while a player has thrown one dart of a visit. | After the restart the match shows the same visit with one dart, and play carries on. | Q-02 |
| QS-05 | Reliable evenings | The room's internet line is unplugged before the evening. | A whole tournament evening runs: every page loads with its fonts and icons, nothing waits on the internet. | Q-01 |
| QS-06 | Instant at the board | Dart 600 of a long match, with 200 matches in the history and the projector and two phones watching. | The dart is on the station's screens within 150 ms; on a loaded machine at most 3 darts of the match take longer, none over 500 ms. | Q-05, Q-06 |
| QS-07 | Usable from where you stand | A player at the board sees the board missed a dart. | From the kiosk, at arm's length, they add the dart in a few taps and the score follows at once. | PLAY-10, Q-08 |
| QS-08 | Safe to change | A change slows down dart handling or breaks a page. | CI fails on the load test or the browser tests, and no image is published. | Q-15 |
