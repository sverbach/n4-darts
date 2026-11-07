# The real light strips on a darts evening

Status: done
Type: task
Blocked by: 05

Everything was tested against the fake WLED (`tools/wled-sim`). What's left needs the real controllers.

## What to do

1. Give each WLED controller a fixed IP (DHCP reservation). In WLED's own app, save the presets you want (idle, playing, and one per moment) and note their numbers.
2. Deploy, then in `/admin` → Lights add each controller by its IP and press **Test connection**: its name and preset count show.
3. Per station: pick its controller, the idle and playing presets, and the moments you want with their seconds. Press **Test** on each: the strip changes, and the base preset comes back after the seconds.
4. Play a match at each station: match start, a bust, a 180, a leg, a high checkout and the game shot each start their preset; the strip goes back to playing, and to idle once the match is done.
5. Unplug one controller during a match: play carries on as usual; `/admin` → Diagnostics → Lights counts the failures. Plug it back in: the next moment works again.
6. Note anything that feels wrong in the room (too long, too short, a moment missing or too much), here.

## Acceptance

- Each step done, or noted here with what went wrong.

## Comments

2026-11-07: Done, checked by the user: the room lights behaved exactly as specified. One question came up: a 100+ visit lit up once and not the next time. That was by design, since "High out" only fires for checkouts of 100+. It led to a separate "100+ visit" light (`07-100-plus-visit-light.md`).
