// The stations' routes: each station's view, live stream, commands and board menu (open, like the
// rest of the station, docs/adr/0004), and managing the stations in /admin (name and Board Manager
// address, applied without a restart).

import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { BoardActionInput, NewStationInput, StationChangesInput, StationCommand } from "../api.ts";
import type { ChangeFeed } from "../live/live.ts";
import { liveView, Refusal } from "../live/liveRoutes.ts";
import { IdParams, parse } from "../parse.ts";
import { CommandError } from "./station.ts";
import {
  StationConfigError,
  type StationDirectory,
  type StationRegistry,
  stationAdminView,
} from "./stations.ts";

/** `?view=watch` from /watch, so diagnostics can tell the projector from the kiosk. */
const LiveQuery = z.object({ view: z.enum(["station", "watch"]).default("station") });

export function registerStations(
  app: FastifyInstance,
  stations: StationDirectory,
  feed?: ChangeFeed,
) {
  app.get("/api/stations", async () => stations.list().map((s) => s.view()));
  if (feed) {
    liveView(app, "/api/stations/live", () => ({
      subscribe: feed.subscribe,
      view: () => stations.list().map((s) => s.view()),
      kind: "stations",
    }));
  }

  app.get("/api/stations/:id", async (request, reply) => {
    const station = stations.get(parse(IdParams, request.params).id);
    return station ? station.view() : reply.code(404).send({ error: "no such station" });
  });

  app.post("/api/stations/:id/commands", async (request, reply) => {
    const station = stations.get(parse(IdParams, request.params).id);
    if (!station) return reply.code(404).send({ error: "no such station" });
    const command = parse(StationCommand, request.body);
    try {
      return await station.command(command);
    } catch (error) {
      if (error instanceof CommandError) return reply.code(409).send({ error: error.message });
      throw error;
    }
  });

  app.post("/api/stations/:id/board", async (request, reply) => {
    const station = stations.get(parse(IdParams, request.params).id);
    if (!station) return reply.code(404).send({ error: "no such station" });
    const { action } = parse(BoardActionInput, request.body);
    try {
      await station.boardCommand(action);
      return { ok: true };
    } catch (error) {
      if (error instanceof CommandError) return reply.code(502).send({ error: error.message });
      throw error;
    }
  });

  // Live station state: the full view on connect and after every change.
  liveView(app, "/api/stations/:id/live", (request) => {
    const station = stations.get(parse(IdParams, request.params).id);
    if (!station) throw new Refusal(404, "no such station");
    return {
      subscribe: station.subscribe,
      view: station.view,
      kind: parse(LiveQuery, request.query).view,
      label: station.view().name,
    };
  });
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
    liveView(app, "/api/admin/stations/live", () => ({
      subscribe: feed.subscribe,
      view: adminViews,
      kind: "admin stations",
    }));
  }

  app.post("/api/admin/stations", async (request, reply) => {
    const input = parse(NewStationInput, request.body);
    return attempt(reply, () =>
      reply.code(201).send(stationAdminView(registry, registry.add(input))),
    );
  });

  app.patch("/api/admin/stations/:id", async (request, reply) => {
    const { id } = parse(IdParams, request.params);
    const changes = parse(StationChangesInput, request.body);
    return attempt(reply, () => stationAdminView(registry, registry.update(id, changes)));
  });

  app.delete("/api/admin/stations/:id", async (request, reply) => {
    const { id } = parse(IdParams, request.params);
    return attempt(reply, () => {
      registry.remove(id);
      return reply.code(204).send();
    });
  });
}
