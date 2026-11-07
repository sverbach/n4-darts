# Party modes: Golf with random holes

Status: done
Type: task
Blocked by: 03

Asked for after the real-board check (2026-11-07): Golf is more interesting when every hole is a surprise number, like the random holes in the Switch's darts golf. The group wants that as the default.

## Decisions (2026-11-07)

- **A "Course" option: "Random" (the default) or "In order".** In order is Golf as before.
- **The pool is 1–20 and the bull**, and no number comes up twice. That's enough for 18 holes (21 to choose from). On the bull, the bull counts 1 and the outer bull 2, as before.
- **Drawn once, when the match starts:** the station shuffles the 21 targets and stores the order on `MatchStarted` (`course`), the same way as Killer's numbers. A replay or correction gives the same holes.
- **Sudden death** goes on with the rest of the drawn order, then round again.
- **Old matches stay in order:** settings without the option read as in order. Same rules version.

## What to do

- Engine: `course` on the Golf settings; the drawn order on the start event and in the state; hole N aims at the course's Nth target. Refuse a random Golf start without a valid draw.
- Server: `course` in the Golf settings input; the station draws it at start.
- Station: "Course: Random / In order" in the Game picker, default Random. The scorecard and target board follow the drawn holes. The strip reads "Golf · Hole 2 of 9", and the labels say "random" where they list the settings.

## Acceptance

- Engine tests: holes follow the drawn course; sudden death goes through the rest and wraps; settings without the option play in order; a random start without a draw is refused; the draw is 21 distinct targets.
- Server test: a random Golf start stores a draw and plays it.
- All checks pass, and the visual Golf test stays deterministic (it plays in order).

## Comments

2026-11-07: Done.
- **Engine:** `course` ("random" | "inOrder") on `GolfSettings`. The default is random; missing reads as in order. `drawGolfCourse()` shuffles 1–20 and the bull, `MatchStarted.course` carries the draw, and `GolfState.course` is the order played. `holeTarget(hole, course)` wraps after 21, so sudden death goes through the rest of the draw and round again. A random start without a valid draw is refused.
- **Server:** `course` in the Golf input. Anything else is a 400. The station draws the course at `startMatch`, next to Killer's numbers.
- **Station:** "Course: Random / In order" in the Game picker, Random first. The scorecard headers and the target board follow the draw. The labels add "· Random".
- **Docs:** glossary (Hole), `docs/ui-pages.md` (Golf options), spec ticket list.
- **Tests:** engine (holes follow the draw, sudden death through the rest and wrapping, in order when unset, a refused start, the draw itself) and the server (a random start stores and plays a 21-target draw, an unknown course refused). The visual Golf test now asks for "inOrder", so it stays deterministic.
- typecheck, lint, 823 unit tests, build, e2e (41) and the visual suite (9, nothing changed) pass.
