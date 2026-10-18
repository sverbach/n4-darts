# Board reset mid-visit: keep and continue

Status: ready-for-agent
Type: task

When someone presses reset on the laptop mid-visit, the board forgets darts that are already logged. Decision: the logged darts stand and the visit carries on; no prompt.

- Pin the behaviour with tests against the simulator (it needs a way to trigger an outside reset, if it doesn't have one): 1 dart logged, outside reset, 2 more darts thrown → one visit with 3 darts; takeout closes it normally.
- Also: outside reset while awaiting takeout → the visit still closes on the next takeout (or via "next player").
- Fix whatever doesn't hold. Server-initiated resets behave as today.

## Acceptance

- Both cases covered by tests and passing.
