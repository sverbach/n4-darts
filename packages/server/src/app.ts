import { existsSync } from "node:fs";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { registerAdmin } from "./admin.ts";
import type { Db } from "./db.ts";
import { registerMatches } from "./matches.ts";
import { registerPlayers } from "./players.ts";
import { CommandError, type Station, type StationCommand } from "./station.ts";

export interface AppOptions {
  /** Directory with the built web app; served at `/` when it exists. */
  webDir?: string;
  stations?: Station[];
  db?: Db;
  /** Shared PIN for /admin; without one /admin is open. */
  adminPin?: string | undefined;
}

export function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false });
  const stations = new Map((options.stations ?? []).map((s) => [s.id, s]));

  app.get("/api/health", async () => ({ ok: true }));
  registerAdmin(app, options.adminPin);
  if (options.db) registerPlayers(app, options.db);
  registerMatches(app, stations);

  app.get("/api/stations", async () => [...stations.values()].map((s) => s.view()));

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

    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    const send = (view: unknown) => res.write(`data: ${JSON.stringify(view)}\n\n`);
    send(station.view());
    const unsubscribe = station.subscribe(send);
    const keepAlive = setInterval(() => res.write(": keep-alive\n\n"), 25_000);
    request.raw.on("close", () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
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
