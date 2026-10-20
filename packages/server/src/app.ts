import { existsSync } from "node:fs";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { registerAdmin } from "./admin.ts";
import type { Db } from "./db.ts";
import { displayView } from "./display.ts";
import { createChangeFeed, streamView } from "./live.ts";
import { registerMatches } from "./matches.ts";
import { registerPlayers } from "./players.ts";
import { createScheduler, type SchedulerOptions } from "./scheduler.ts";
import { CommandError, type Station, type StationCommand } from "./station.ts";
import { registerStationAdmin } from "./stationAdmin.ts";
import {
  fixedDirectory,
  isRegistry,
  type StationDirectory,
  type StationRegistry,
} from "./stations.ts";
import { createStats, registerStats } from "./stats.ts";
import { createTournaments, registerTournaments } from "./tournaments.ts";

export interface AppOptions {
  /** Directory with the built web app; served at `/` when it exists. */
  webDir?: string;
  /** A fixed list (tests), or the registry, which also enables managing stations in /admin. */
  stations?: Station[] | StationDirectory | StationRegistry;
  db?: Db;
  /** Runs the tournament scheduler (main does; tests that need it pass fast timings). */
  scheduler?: SchedulerOptions;
  /** Shared PIN for /admin; without one /admin is open. */
  adminPin?: string | undefined;
}

export function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false });
  const stations = Array.isArray(options.stations)
    ? fixedDirectory(options.stations)
    : (options.stations ?? fixedDirectory([]));

  app.get("/api/health", async () => ({ ok: true }));
  registerAdmin(app, options.adminPin);
  if (options.db) {
    registerPlayers(app, options.db);
    registerStats(app, createStats(options.db));
  }
  const tournaments = options.db ? createTournaments(options.db, stations) : undefined;
  const feed = options.db ? createChangeFeed(options.db, stations) : undefined;
  if (feed) app.addHook("onClose", async () => feed.close());
  registerMatches(app, stations, options.db, tournaments, feed);
  if (isRegistry(stations)) registerStationAdmin(app, stations, feed);
  if (options.db && tournaments && feed) {
    const db = options.db;
    registerTournaments(app, tournaments);
    app.get("/api/admin/tournament/live", (request, reply) =>
      streamView(request, reply, feed.subscribe, () => tournaments.view()),
    );
    const display = () => displayView(db, stations, tournaments);
    app.get("/api/display", async () => display());
    app.get("/api/display/live", (request, reply) =>
      streamView(request, reply, feed.subscribe, display),
    );
    if (options.scheduler) {
      const scheduler = createScheduler(options.db, stations, tournaments, options.scheduler);
      app.addHook("onClose", async () => scheduler.stop());
    }
  }

  app.get("/api/stations", async () => stations.list().map((s) => s.view()));
  if (feed) {
    app.get("/api/stations/live", (request, reply) =>
      streamView(request, reply, feed.subscribe, () => stations.list().map((s) => s.view())),
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

  // Live station state as Server-Sent Events: the full view on connect and after every change.
  app.get<{ Params: { id: string } }>("/api/stations/:id/live", (request, reply) => {
    const station = stations.get(Number(request.params.id));
    if (!station) return reply.code(404).send({ error: "no such station" });
    streamView(request, reply, station.subscribe, station.view);
  });

  if (options.webDir && existsSync(options.webDir)) {
    app.register(fastifyStatic, { root: options.webDir });
    // Client-side routes such as /station/1 all load the SPA.
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) return reply.code(404).send({ error: "not found" });
      return reply.sendFile("index.html");
    });
  }

  return app;
}
