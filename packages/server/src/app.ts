// Wiring: creates the components and registers their routes. Each component's routes are in its
// own *Routes.ts; only the health check and serving the web app are the app's own.

import { existsSync } from "node:fs";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { registerAdmin } from "./access/accessRoutes.ts";
import { createAccess } from "./access/admin.ts";
import type { Db } from "./db.ts";
import { displayView } from "./live/display.ts";
import { createChangeFeed } from "./live/live.ts";
import { registerDisplay } from "./live/liveRoutes.ts";
import { createMatches } from "./matches/matches.ts";
import { registerMatches } from "./matches/matchesRoutes.ts";
import { registerDiagnostics } from "./operations/operationsRoutes.ts";
import { createPlayers } from "./players/players.ts";
import { registerPlayers } from "./players/playersRoutes.ts";
import { createScheduler, type SchedulerOptions, withQueue } from "./scheduling/scheduler.ts";
import type { Station } from "./stations/station.ts";
import {
  fixedDirectory,
  isRegistry,
  type StationDirectory,
  type StationRegistry,
} from "./stations/stations.ts";
import { registerStationAdmin, registerStations } from "./stations/stationsRoutes.ts";
import { createStats } from "./stats/stats.ts";
import { registerStats } from "./stats/statsRoutes.ts";
import { createTournaments } from "./tournaments/tournaments.ts";
import { registerTournaments } from "./tournaments/tournamentsRoutes.ts";

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
  const db = options.db;

  app.get("/api/health", async () => ({ ok: true }));
  registerAdmin(app, createAccess(options.adminPin));

  const stats = db ? createStats(db) : undefined;
  if (db && stats) {
    registerPlayers(app, createPlayers(db), db);
    registerStats(app, stats);
  }

  const tournaments = db ? createTournaments(db, stations) : undefined;
  const feed = db ? createChangeFeed(db, stations) : undefined;
  if (feed) app.addHook("onClose", async () => feed.close());

  registerStations(app, stations, feed);
  if (isRegistry(stations)) registerStationAdmin(app, stations, feed);
  registerMatches(
    app,
    stations,
    db ? createMatches(db, stations, tournaments?.resultGuard) : undefined,
    feed,
  );

  if (db && tournaments && feed) {
    // The tournament as /admin shows it, with the queue from Scheduling and the awards from Stats.
    const tournament = () => {
      const { view, plan } = tournaments.shown();
      const queued = withQueue(db, view, plan);
      return stats ? stats.withAwards(queued) : queued;
    };
    registerTournaments(app, tournaments, tournament, feed);
    registerDisplay(app, () => displayView(db, stations, tournament(), stats), feed);
    if (options.scheduler) {
      const scheduler = createScheduler(db, stations, tournaments, options.scheduler);
      app.addHook("onClose", async () => scheduler.stop());
    }
  }

  registerDiagnostics(app, stations);

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
