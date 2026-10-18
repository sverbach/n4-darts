# Play a leg on the real board

Status: done
Type: task
Blocked by: 06

Deploy to the server with `docker compose up`, point station 1 at the real Board Manager, play a full 301 leg on the board from `/station/1`, including one correction, one bust, and one server restart mid-leg. Note anything that differs from the simulator in `docs/board-manager-api.md`; also capture the bullseye's `bed`/`name` values there.

## Comments

- 2026-10-18: Played on the real board via Docker on the server. Worked end to end, no differences from the simulator reported. The bullseye wasn't hit, so its `bed`/`name` values are still unconfirmed; the simulator's `Double`/`Bull` remains a guess. Walking skeleton accepted as a successful proof of concept.
