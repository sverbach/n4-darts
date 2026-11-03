// Wiring: creates the components and registers their routes. Each component's routes are in its
// own *Routes.ts; only the health check and serving the web app are the app's own.

import { existsSync } from "node:fs";
import fastifyStatic from "@fastify/static";
import Fastify, { type FastifyInstance } from "fastify";
import { registerAdmin } from "./access/accessRoutes.ts";
import { createAccess } from "./access/admin.ts";
import { registerCallouts } from "./callouts/calloutsRoutes.ts";
import { createCalloutPacks } from "./callouts/packs.ts";
import type { Db } from "./db.ts";
import { displayView } from "./live/display.ts";
import { createChangeFeed } from "./live/live.ts";
import { registerDisplay } from "./live/liveRoutes.ts";
import { createMatches } from "./matches/matches.ts";
import { registerMatches, registerMatchPage } from "./matches/matchesRoutes.ts";
import { registerDiagnostics } from "./operations/operationsRoutes.ts";
import { hiddenIds, withHiddenPlayers } from "./players/hidden.ts";
import { createPlayers } from "./players/players.ts";
import { registerPlayerPhoto, registerPlayers } from "./players/playersRoutes.ts";
import { ratingOf } from "./ratings/ratings.ts";
import { createScheduler, type SchedulerOptions, withQueue } from "./scheduling/scheduler.ts";
import type { Station } from "./stations/station.ts";
import {
  fixedDirectory,
  isRegistry,
  type StationDirectory,
  type StationRegistry,
} from "./stations/stations.ts";
import { registerStationAdmin, registerStations } from "./stations/stationsRoutes.ts";
import { createStats, type Stats } from "./stats/stats.ts";
import { registerStats } from "./stats/statsRoutes.ts";
import { pastTournament, pastTournaments } from "./tournaments/past.ts";
import { createTournaments } from "./tournaments/tournaments.ts";
import { registerPastTournaments, registerTournaments } from "./tournaments/tournamentsRoutes.ts";

export interface AppOptions {
  /** Directory with the built web app; served at `/` when it exists. */
  webDir?: string;
  /** A fixed list (tests), or the registry, which also enables managing stations in /admin. */
  stations?: Station[] | StationDirectory | StationRegistry;
  db?: Db;
  /** Runs the tournament scheduler (main does; tests that need it pass fast timings). */
  scheduler?: SchedulerOptions;
  /** How often an open /admin diagnostics page is updated; tests shorten it. */
  diagnosticsRefreshMs?: number;
  /** Shared PIN for /admin; without one /admin is open. */
  adminPin?: string | undefined;
  /** Where uploaded voice packs are kept; without one only the default voice is offered. */
  calloutsDir?: string;
}

export function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false });
  const stations = Array.isArray(options.stations)
    ? fixedDirectory(options.stations)
    : (options.stations ?? fixedDirectory([]));
  const db = options.db;

  app.get("/api/health", async () => ({ ok: true }));
  registerAdmin(app, createAccess(options.adminPin));

  const feed = db ? createChangeFeed(db, stations) : undefined;
  if (feed) app.addHook("onClose", async () => feed.close());

  const stats = db ? createStats(db) : undefined;
  if (db && stats && feed) {
    registerPlayers(app, createPlayers(db), (id) => ratingOf(db, id), feed);
    registerStats(app, stats);
    registerPastTournaments(app, pastWithAwards(db, stats));
  }

  const tournaments = db ? createTournaments(db, stations) : undefined;

  registerStations(app, stations, feed);
  if (isRegistry(stations)) registerStationAdmin(app, stations, feed);
  const matches = db ? createMatches(db, stations, tournaments?.resultGuard) : undefined;
  registerMatches(app, stations, matches, feed);
  if (matches) registerMatchPage(app, matches);

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

  registerDiagnostics(app, stations, options.diagnosticsRefreshMs);
  registerCallouts(app, createCalloutPacks(options.calloutsDir));

  serveWeb(app, options.webDir);
  return app;
}

export interface PublicAppOptions {
  /** Opened read-only: the room's server keeps it up to date. */
  db: Db;
  webDir?: string;
}

/**
 * The public site (docs/adr/0008): only the routes registered here, all reads. Anything else
 * answers 404; nothing runs in the background.
 */
export function buildPublicApp(options: PublicAppOptions) {
  const app = Fastify({ logger: false });
  const hidden = () => hiddenIds(options.db);
  const db = withHiddenPlayers(options.db);

  app.addHook("preHandler", async (request, reply) => {
    const id = (request.params as { id?: string } | undefined)?.id;
    if (id && (hidden().has(id) || id.startsWith("hidden-"))) {
      return reply.code(404).send({ error: "not found" });
    }
  });
  app.addHook("onSend", async (_request, reply, payload) => {
    if (typeof payload !== "string" || !String(reply.getHeader("content-type")).includes("json")) {
      return payload;
    }
    let redacted = payload;
    for (const [id, standIn] of hidden()) redacted = redacted.replaceAll(id, standIn);
    return redacted;
  });

  app.get("/api/health", async () => ({ ok: true }));
  const stats = createStats(db);
  registerStats(app, stats);
  registerPlayerPhoto(app, createPlayers(db));
  registerPastTournaments(app, pastWithAwards(db, stats));
  registerMatchPage(app, createMatches(db, fixedDirectory([])));

  serveWeb(app, options.webDir);
  return app;
}

/** Finished tournaments with the awards from Stats. */
function pastWithAwards(db: Db, stats: Stats) {
  return {
    list: () => pastTournaments(db),
    one(id: string) {
      const tournament = pastTournament(db, id);
      return tournament && { ...tournament, awards: stats.awards(id) };
    },
  };
}

function serveWeb(app: FastifyInstance, webDir: string | undefined) {
  if (!webDir || !existsSync(webDir)) return;
  app.register(fastifyStatic, { root: webDir });
  // Client-side routes such as /station/1 all load the SPA.
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api/")) return reply.code(404).send({ error: "not found" });
    return reply.sendFile("index.html");
  });
}
