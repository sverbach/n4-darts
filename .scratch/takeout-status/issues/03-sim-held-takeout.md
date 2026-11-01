# The simulator can hold a takeout

Status: needs-triage
Type: task

The fake board's takeout is instant ("Takeout started" then "Takeout finished"), so a stuck takeout can't be tried in dev or tested.

## What to do

- `POST /sim/takeout-start` emits only "Takeout started" (`status: "Takeout in progress"`); `POST /sim/takeout-finish` finishes it. `POST /sim/takeout` stays as both.
- The fake board's page gets a "Start takeout" / "Finish takeout" pair next to Takeout.
- A board reset during a held takeout clears it (as the real board's reset does).

## Acceptance

- Sim tests for start, finish, and reset during a held takeout.
- README's board simulator section lists the new controls.
