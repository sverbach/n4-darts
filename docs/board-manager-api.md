# Autodarts Board Manager local API

Observed on Board Manager **v2.0.2** (2026-10-18) with `prototypes/listen-board.ps1`. Unofficial and undocumented: re-verify after Board Manager updates.

## Access

- Base: `http://<laptop-ip>:3180`, reachable over the LAN, no authentication (`auth.api_key` empty).
- `GET /api/state`: current state snapshot (same shape as WebSocket `data`).
- `GET /api/config`: board id, camera, detection and host config.
- `GET /api/version`: plain text, e.g. `2.0.2`.
- `ws://<laptop-ip>:3180/api/events`: pushes state snapshots.
- Works with the laptop offline from the internet.

### Control endpoints

Read from the web UI bundle (the board client calls these on the local Board Manager):

- `PUT /api/stop`: stop detection. Verified: `Stopping` then `Stopped` (`running: false`, `status` equals `event`), under 1 s.
- `PUT /api/start`: start detection. Verified: `Starting` then `Started` (`running: true`, `status: "Throw"`), under 1 s.
- `POST /api/reset`: clear the current visit. Verified: emits `event: "Manual reset"`, `numThrows: 0`, `status: "Throw"`.
- `POST /api/config/calibration/auto`: auto-calibrate.
- `HEAD /api/ping`: health check.

## Message shape

Every WebSocket message is a **full snapshot**, not a delta:

```json
{"type":"state","data":{
  "connected":true,"running":true,
  "event":"Throw detected","status":"Throw","numThrows":2,
  "throws":[
    {"bouncer":false,"coords":{"x":0.0029,"y":0.3003},
     "segment":{"bed":"SingleInner","multiplier":1,"name":"S20","number":20}},
    ...
  ]}}
```

- `throws` lists the darts of the current visit; it is omitted once the board is empty.
- Score of a dart is always `segment.number * segment.multiplier`.
- `coords` are normalised: bull ≈ (0,0), double ring ≈ radius 0.95, `y` positive toward 20.

| Dart                | `bed`                        | `name`        | `number` | `multiplier` | Notes                                      |
| ------------------- | ---------------------------- | ------------- | -------- | ------------ | ------------------------------------------ |
| Singles             | `SingleInner`, `SingleOuter` | `S20`         | 1–20     | 1            | inner = between bull and treble            |
| Double / treble     | `Double`, `Triple`           | `D20`, `T13`  | 1–20     | 2, 3         |                                            |
| Outer bull          | `Single`                     | `25`          | 25       | 1            |                                            |
| Miss (off board)    | `Outside`                    | `M17`         | 17       | 0            | real coords, radius > 1                    |
| Bounce-out          | `Outside`                    | `Miss`        | 0        | 0            | `bouncer: true`, coords (0,0): not a position |
| Bullseye            | ?                            | ?             | ?        | ?            | not yet observed                           |

## Visit lifecycle

| `event`            | `status`              | `numThrows` |
| ------------------ | --------------------- | ----------- |
| `Throw detected`   | `Throw`               | 1, 2        |
| `Throw detected`   | `Takeout`             | 3           |
| `Takeout started`  | `Takeout in progress` | unchanged   |
| `Takeout finished` | `Throw`               | 0           |

Takeout after fewer than 3 darts works the same way: `Takeout started` arrives with `numThrows` 1 or 2.

Consumers should treat the latest snapshot as authoritative for the current visit, and `Takeout finished` as end of visit.

## Not yet observed

- Bullseye (`bed`/`name` values).
- Camera or detection error states (`connected:false`, `running:false`).
