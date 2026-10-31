// The stations' routes: each station's view, live stream, commands and board menu (open, like the
// rest of the station, docs/adr/0004), and managing the stations in /admin (name and Board Manager
// address, applied without a restart).

import type { FastifyInstance, FastifyReply } from "fastify";
import type { ChangeFeed } from "../live/live.ts";
import { streamView } from "../live/liveRoutes.ts";
import { CommandError, type StationCommand } from "./station.ts";
import {
  StationConfigError,
  type StationDirectory,
  type StationRegistry,
  stationAdminView,
} from "./stations.ts";

export function registerStations(
  app: FastifyInstance,
  stations: StationDirectory,
  feed?: ChangeFeed,
) {
  app.get("/api/stations", async () => stations.list().map((s) => s.view()));
  if (feed) {
    app.get("/api/stations/live", (request, reply) =>
      streamView(request, reply, feed.subscribe, () => stations.list().map((s) => s.view()), {
        kind: "stations",
      }),
    );
  }

  app.get<{ Params: { id: string } }>("/api/stations/:id", async (request, reply) => {
    const station = stations.get(Number(request.params.id));
    return station ? station.view() : reply.code(404).send({ error: "no such station" });
  });

  app.post<{ Params: { id: string }; Body: StationCommand }>(
    "/api/stations/:id/commands",
    async (request, reply) => {
      const station = stations.get(Number(request.params.id));
      if (!station) return reply.code(404).send({ error: "no such station" });
      try {
        return await station.command(request.body);
      } catch (error) {
        if (error instanceof CommandError) return reply.code(409).send({ error: error.message });
        throw error;
      }
    },
  );

  app.post<{ Params: { id: string }; Body: { action?: unknown } }>(
    "/api/stations/:id/board",
    async (request, reply) => {
      const station = stations.get(Number(request.params.id));
      if (!station) return reply.code(404).send({ error: "no such station" });
      const action = request.body?.action;
      if (action !== "start" && action !== "stop" && action !== "calibrate" && action !== "reset") {
        return reply.code(400).send({ error: "action must be start, stop, calibrate or reset" });
      }
      try {
        await station.boardCommand(action);
        return { ok: true };
      } catch (error) {
        if (error instanceof CommandError) return reply.code(502).send({ error: error.message });
        throw error;
      }
    },
  );

  // Live station state: the full view on connect and after every change. `?view=watch` from
  // /watch, so diagnostics can tell the projector from the kiosk.
  app.get<{ Params: { id: string }; Querystring: { view?: string } }>(
    "/api/stations/:id/live",
    (request, reply) => {
      const station = stations.get(Number(request.params.id));
      if (!station) return reply.code(404).send({ error: "no such station" });
      streamView(request, reply, station.subscribe, station.view, {
        kind: request.query.view === "watch" ? "watch" : "station",
        label: station.view().name,
      });
    },
  );
}

export function registerStationAdmin(
  app: FastifyInstance,
  registry: StationRegistry,
  feed?: ChangeFeed,
) {
  const adminViews = () => registry.configs().map((config) => stationAdminView(registry, config));

  /** Runs a registry change, answering its errors with their status. */
  function attempt<T>(reply: FastifyReply, change: () => T): T | FastifyReply {
    try {
      return change();
    } catch (error) {
      if (error instanceof StationConfigError) {
        return reply.code(error.status).send({ error: error.message });
      }
      throw error;
    }
  }

  app.get("/api/admin/stations", async () => adminViews());
  if (feed) {
    app.get("/api/admin/stations/live", (request, reply) =>
      streamView(request, reply, feed.subscribe, adminViews, { kind: "admin stations" }),
    );
  }

  app.post<{ Body: { id?: unknown; name?: unknown; boardUrl?: unknown } }>(
    "/api/admin/stations",
    async (request, reply) =>
      attempt(reply, () =>
        reply.code(201).send(stationAdminView(registry, registry.add(request.body ?? {}))),
      ),
  );

  app.patch<{ Params: { id: string }; Body: { name?: unknown; boardUrl?: unknown } }>(
    "/api/admin/stations/:id",
    async (request, reply) =>
      attempt(reply, () =>
        stationAdminView(registry, registry.update(Number(request.params.id), request.body ?? {})),
      ),
  );

  app.delete<{ Params: { id: string } }>("/api/admin/stations/:id", async (request, reply) =>
    attempt(reply, () => {
      registry.remove(Number(request.params.id));
      return reply.code(204).send();
    }),
  );
}
