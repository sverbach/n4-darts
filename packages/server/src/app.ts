import { existsSync } from "node:fs";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";

export interface AppOptions {
  /** Directory with the built web app; served at `/` when it exists. */
  webDir?: string;
}

export function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: false });

  app.get("/api/health", async () => ({ ok: true }));

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
