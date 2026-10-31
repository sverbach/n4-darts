# 6. Runtime view

Three scenarios. The participants are kept high level: the **station screen** is the kiosk browser (or any device on `/station/n`), **n4-darts** is the server with its database, the **board** is Autodarts' Board Manager, and **other screens** are everything else following along (`/watch/n`, `/display`, `/admin`).

## 6.1 A player throws a dart in an active match

```mermaid
sequenceDiagram
    actor P as Player
    participant B as Board (Autodarts)
    participant N as n4-darts
    participant S as Station screen
    participant O as Other screens

    P->>B: throws a dart
    B->>N: new state snapshot (WebSocket)
    N->>N: diff with the last snapshot: a new dart
    N->>N: append the dart to the match's log, recompute the score
    N-->>S: new station view (SSE)
    N-->>O: new views (SSE)
    Note over P,O: after three darts, a bust or a checkout: "remove darts"
    P->>B: takes the darts out
    B->>N: snapshot: takeout finished
    N->>N: append, end the visit, next player
    N-->>S: next player's turn
    N-->>O: next player's turn
```

- The darts count for whoever's visit it is; nobody at the board has to press anything (PLAY-05).
- The visit ends at takeout, not at the third dart (ADR 0003). Darts after the visit is over are ignored and shown as such (PLAY-06).
- If the connection to the board drops, n4-darts reconnects and resyncs with `GET /api/state`, so no dart is lost or counted twice (BOARD-02).
- From the board to the screens within 150 ms (Q-05). Every screen gets a new view only if it changed (section 8.3).

## 6.2 A player corrects a dart detection

```mermaid
sequenceDiagram
    actor P as Player
    participant S as Station screen
    participant N as n4-darts
    participant O as Other screens

    P->>S: taps the wrong dart of the current visit
    S->>S: opens the segment picker
    P->>S: picks the right segment
    S->>N: correctDart (dart, segment)
    N->>N: append the correction to the log, recompute the score
    N-->>S: corrected view (SSE)
    N-->>O: corrected views (SSE)
```

- The correction is appended; the original detection stays in the log and the dart stays marked as corrected (PLAY-09, ADR 0002).
- At the station only darts of the current visit can be corrected. A dart the board missed is added the same way (`addDart`, PLAY-10).
- The organiser can correct any dart of any match from `/admin`. For a finished tournament match, n4-darts first checks whether the result may still change (TOUR-14).

## 6.3 Players start a quick match

```mermaid
sequenceDiagram
    actor P as Players
    participant S as Station screen
    participant N as n4-darts
    participant B as Board (Autodarts)
    participant O as Other screens

    P->>S: "New match" on a free station
    S->>N: player list
    N-->>S: players
    P->>S: pick players (or add one on the spot), choose settings
    S->>N: quickMatch (players, settings)
    N->>N: create the match on the station, not started yet
    N-->>S: settle the throwing order
    N-->>O: station busy
    P->>S: reorder or shuffle, then "Start"
    S->>N: setOrder, startMatch
    N->>B: reset the board
    N->>N: append "match started" to the new log
    N-->>S: first player to throw
    N-->>O: match on
```

- No PIN and no organiser needed: quick matches and new players are open at the station (MATCH-01, PLAYER-04, ADMIN-02).
- A busy station refuses a new match. During a tournament, the station and the players count as busy, so the scheduler leaves them alone (SCHED-04).
- The board is reset before the match starts, so darts still on it can't count (BOARD-05).
