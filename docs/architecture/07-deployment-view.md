# 7. Deployment view

## 7.1 Infrastructure level 1

```mermaid
flowchart TB
    subgraph lan["LAN"]
        subgraph server["Linux server with Docker"]
            container["n4-darts container<br/>"]
            volume[("Volume n4-data<br/>/data: SQLite, backups/")]
            container --- volume
        end
        subgraph laptop1["Station laptop 1 (Windows)"]
            bm1["Board Manager :3180"]
            kiosk1(["Kiosk browser<br/>/station/1"])
        end
        subgraph laptopN["Station laptop n"]
            bmN["Board Manager :3180"]
            kioskN(["Kiosk browser<br/>/station/n"])
        end
        projector(["Projector browser<br/>/display"])
        phones(["Phones<br/>/admin, /players"])
    end

    container -- "WebSocket + HTTP" --> bm1
    container -- "WebSocket + HTTP" --> bmN
    kiosk1 & kioskN & projector & phones -- "HTTP + SSE :3000" --> container
```

**Motivation**

One server in the room holds everything; the laptops only run what they already have (the Board Manager) plus a browser. The room keeps working with the internet unplugged.

**Quality and performance features**

Restart policy `unless-stopped`; all state on the volume, so a container can be replaced at any time between evenings. Backups stay on the same volume unless the operator copies the folder elsewhere (Q-07).

**Mapping of building blocks to infrastructure**

The container runs `server` with the built `web` files and `engine`; `/data` holds the database and backups. The Board Manager and the browsers are on the laptops, the projector and phones.

## 7.2 Infrastructure level 2

### The container

- **Image:** `ghcr.io/sverbach/n4-darts:latest`, built by CI from the `Dockerfile`
- **Configuration** (environment, see `docker-compose.yml`):

| Variable    | Default                   | What                                                                                                                                                                      |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`      | `3000`                    | HTTP port inside the container (`N4_PORT` maps it on the host).                                                                                                           |
| `DATA_DIR`  | `/data`                   | Database and `backups/`.                                                                                                                                                  |
| `STATIONS`  | `1=http://localhost:3180` | Seeds the stations on the very first start (`number=Board Manager address`, comma-separated). Afterwards stations are managed in `/admin` and this is ignored (ADMIN-04). |
| `ADMIN_PIN` | empty                     | The shared PIN for `/admin`. Empty leaves it open, with a warning (ADMIN-01).                                                                                             |

- **Update:** `docker compose pull && docker compose up -d` (OPS-05).
- **Restore:** stop the server, put a backup file in place of the database, start again (OPS-02).

### Network and trust

- Fixed IPs (DHCP reservations) for the laptops and the server; each station's Board Manager address is set in `/admin` → Stations.
- No player logins. `/admin` is behind a shared PIN so a guest can't edit by accident (ADR 0004).
- The Board Manager is unauthenticated, so anyone on the network can reset a board. Accepted for a private room.
- A reverse proxy is optional; the live streams send `X-Accel-Buffering: no` so nginx passes them straight through (OPS-04, README "Behind a reverse proxy"). The app must not be exposed to the internet (Q-12).
