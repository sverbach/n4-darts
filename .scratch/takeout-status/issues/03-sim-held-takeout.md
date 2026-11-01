# The simulator can hold a takeout

Status: done
Type: task

The fake board's takeout is instant ("Takeout started" then "Takeout finished"), so a stuck takeout can't be tried in dev or tested.

## What to do

- `POST /sim/takeout-start` emits only "Takeout started" (`status: "Takeout in progress"`); `POST /sim/takeout-finish` finishes it. `POST /sim/takeout` stays as both.
- The fake board's page gets a "Start takeout" / "Finish takeout" pair next to Takeout.
- A board reset during a held takeout clears it (as the real board's reset does).

## Acceptance

- Sim tests for start, finish, and reset during a held takeout.
- README's board simulator section lists the new controls.

## Comments

2026-11-01: Confirmed by the user.

2026-11-01: Built. `takeoutStart()` / `takeoutFinish()` (`POST /sim/takeout-start`, `/sim/takeout-finish`); `takeout()` is both. A dart during a held takeout is ignored (as before for any status but "Throw"); a reset clears it. Buttons "Start takeout" / "Finish takeout" on the fake board page; README lists them. Sim tests for holding and for a reset during one.
