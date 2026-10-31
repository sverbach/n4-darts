// The diagnostics page's data, in /admin.

import type { FastifyInstance } from "fastify";
import type { StationDirectory } from "../stations/stations.ts";
import { diagnostics } from "./diagnostics.ts";

export function registerDiagnostics(app: FastifyInstance, stations: StationDirectory) {
  app.get("/api/admin/diagnostics", async (request) =>
    diagnostics.view(
      request,
      stations.list().map((station) => {
        const { id, name, boardOnline } = station.view();
        const stats = station.boardStats();
        return {
          station: id,
          name,
          online: boardOnline,
          reconnects: stats?.reconnects ?? 0,
          sinceMessageSeconds:
            stats?.lastMessageAt == null
              ? null
              : Math.round((Date.now() - stats.lastMessageAt) / 1000),
          lastCommand: stats?.lastCommand ?? null,
        };
      }),
    ),
  );
}
