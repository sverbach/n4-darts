# 11. Risks and technical debt

## 11.1 Risks

| Risk | Why it matters | What we do |
|---|---|---|
| **An Autodarts update changes the Board Manager API** | The API is local, unofficial, unauthenticated and only partly documented. An update can stop darts from arriving. | All of it sits behind one gateway (ADR 0001); `docs/board-manager-api.md` records what's observed; the simulator and recorded sessions keep our understanding testable. |
| **Parts of the API are still unobserved** | The bullseye's `bed`/`name` values, camera or detection error states, and what auto-calibrate reports while running haven't been seen on a real board. | Listed in `docs/board-manager-api.md`; the simulator assumes the likely behaviour. Check on the real board and update the doc and the simulator. |
| **The server is a single point of failure** | If the server is down, nobody can play. A relay on the laptops was rejected (ADR 0001). | Restarts resume every match exactly (Q-02); `restart: unless-stopped`; updates only between evenings. |
| **A power cut loses the last darts** | The database doesn't wait for the disk on every write (`synchronous = normal`), so a power cut or OS crash can lose the last write or two. A server crash or restart loses nothing. | Accepted: waiting for the disk stalled a dart by up to 300 ms on slow disks. Lost darts are still on the board and can be added by hand (PLAY-10). |
| **Backups on the same disk** | A broken disk loses the database and its backups together. | The operator keeps the backup folder elsewhere too (Q-07). |
| **Anyone on the network can reset a board or edit with the PIN** | The Board Manager has no authentication; the PIN only stops accidents. | Accepted for a private room; never expose the app to the internet (Q-12). |

## 11.2 Technical debt

- **Live views has no single home.** The change feed, `streamView` and the projector's view are in `live/`, but the tournament's view is put together in `app.ts`, and each component streams its own views from its routes file. Fine while small (section 5.2).
- **`db.ts` is shared by every cluster.** All tables and queries are in one module; every change goes through it (section 5.2).
- **The shared "Guest" player** mixes different people's stats and can only be used once per match (section 1.3). It's a convention, not a feature.
