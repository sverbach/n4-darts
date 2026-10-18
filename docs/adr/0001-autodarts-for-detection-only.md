# Autodarts for dart detection only, via the Board Manager's local API

We keep Autodarts' Board Manager on each station laptop purely as a dart detector and own everything else (game rules, tournaments, stats) ourselves. Our server connects straight to each Board Manager's undocumented local API (`:3180`, WebSocket snapshots plus `start`/`stop`/`reset`) over the LAN; nothing of ours is installed on the laptops. Rebuilding 3-camera detection was not realistic, and play.autodarts.io offers no free offline tournaments.

## Consequences

- The API is unofficial: a Board Manager update can break us. `docs/board-manager-api.md` records the observed contract (v2.0.2); re-verify it after updates.
- If the server is down, no one can play. Accepted: a laptop-side relay that buffers darts was rejected as not worth the install and maintenance cost on two Windows machines.
