# Party modes are persisted, but never counted

Besides X01, a match can be played in a party mode: Around the Clock, Golf, High Score, Killer, Cricket, Random Checkout or Bermuda. A party match is stored like any other: a row in `matches` with its mode and options in `settings`, its players in `match_players`, and every dart in `match_events`. The engine folds the log by mode (`matchState` dispatches on `settings.mode`). But every query for finished matches (`completedMatchesOf`, `closedMatches`, `tournamentMatches`) keeps to X01 in SQL, and returns an `X01MatchRecord`, so stats, ratings, profiles, the admin history and the duration estimate can't receive a party match, and the type checker enforces that too.

Party games are for fun: players aim at whatever the game asks for, not at scoring. Their darts would make the 3-dart average, checkout % and ratings lie. Counting them separately (a Cricket MPR, a Golf best round) was considered and left out: nobody asked for it, and it would mean a second set of stats pages.

Not storing party matches at all would have been the other way. That needs a second, in-memory path for running a match, and a party game would be lost if the server restarted mid-game. Corrections, undo and the live admin view would need their own versions too. Storing them reuses all of that as it is (ADR 0002).

## Consequences

- **Settings without a mode are X01.** Matches stored before party modes have no `mode`. `storedSettings()` reads them as X01, so nothing needed migrating.
- **Never in tournaments:** a tournament's config only takes X01 options, so a party mode can't be set there, and tournament matches are X01 by construction.
- **Visible only while live:** the station, `/watch`, `/display` and the live admin view show a party match. Once it's finished it shows up nowhere: not in the admin history, not on a match page, not on the public site.
- **Each mode has its own rules version**, like X01's, so old matches replay under the rules they were played with.
- **Party matches still count as "recently played" for the scheduler:** a player just back from a Killer game rests a little longer before their tournament match. That's accepted.
- **Some numbers are drawn:** Killer's numbers, Golf's random course, Random Checkout's numbers (one per round, plus spares for sudden death) and Bermuda's shuffled order are random, so the station draws them when the match starts and stores them on the `MatchStarted` event. A replay gives the same numbers, and the engine stays deterministic.
- **Random Checkout is the one party mode with a checkout hint.** It's practice for finishing, so the route is shown at every difficulty, under that difficulty's out rule. The other party modes have no checkout, so no hint.
- **The finished-match queries are where this is enforced.** A new list or stat of finished matches has to read from one of them, or filter to X01 itself.

## Addendum (2026-11-08): Random Checkout and Bermuda

Two modes joined the five, under the same rules: stored, never counted, never in tournaments, their own rules version. Neither needed anything new in this decision beyond the drawn numbers and the checkout hint above. The finished-match queries already keep to X01, so their matches were kept out of the stats without any change there.
