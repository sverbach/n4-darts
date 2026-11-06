# Party modes: Around the Clock with skip-ahead

Status: done
Type: task
Blocked by: 01

Asked for by the players (2026-11-06): an option, chosen when the match is set up, that makes doubles and trebles count for more in Around the Clock. Until now the spec left skip-ahead out.

## Decisions (2026-11-06)

- **Off by default**, so a hit moves you one target on, as before.
- **Skip-ahead on:** a single moves you 1 target on, a double 2 and a treble 3. E.g. on 5, a D5 takes you to 7, and a T5 to 8.
- **Near the end:** a jump never goes past the bull. From 19, a treble takes you to the bull; from 20, a double too. The bull only has a single and a double, and either finishes, as before.
- **Same rules version:** without the option the rules are unchanged, and matches stored without it read as off.

## What to do

- Engine: `skipAhead` on the Around the Clock settings (missing = off), and the moves above.
- Server: `skipAhead` (true/false) in the Around the Clock settings input.
- Station: a "Doubles & trebles" option in the Game picker: "Count once" or "Skip ahead". The settings strip says "Around the Clock · Skip-ahead" when it's on.

## Acceptance

- Engine tests: a double and a treble moving 2 and 3 targets with the option, 1 without; a jump from 19 or 20 landing on the bull; the bull still finishing; settings without the option reading as off.
- Server test: the option set from the quick match and stored; refused when it isn't true or false.
- All checks pass.

## Comments

2026-11-06: Done.
- Engine: `skipAhead` on `AroundTheClockSettings` (default false, missing reads as off). A hit moves `multiplier` targets with the option and 1 without, and never past the bull. Same rules version.
- Server: `skipAhead` (boolean) in the Around the Clock input. Anything else is a 400.
- Station: "Doubles & trebles: Count once / Skip ahead" in the Game picker. The strip and labels read "Around the Clock · Skip-ahead" when it's on.
- Tests: engine (single/double/treble moves, off and missing, jumps from 19 and 20 landing on the bull, the bull still finishing) and the server (set and stored, refused when not a boolean).
- typecheck, lint, 811 unit tests, build, e2e (41) and the visual suite (9, nothing changed) pass. The first e2e run failed after hanging for several minutes, and the output didn't show which test. A clean rerun passed.
