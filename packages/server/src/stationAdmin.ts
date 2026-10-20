// Stations are configured in /admin: name and Board Manager address, applied without a restart.

import type { FastifyInstance, FastifyReply } from "fastify";
import type { StationAdminView } from "./api.ts";
import { type ChangeFeed, streamView } from "./live.ts";
import { type StationConfig, StationConfigError, type StationRegistry } from "./stations.ts";

export function registerStationAdmin(
  app: FastifyInstance,
  registry: StationRegistry,
  feed?: ChangeFeed,
) {
  const adminView = (config: StationConfig): StationAdminView => {
    const view = registry.get(config.id)?.view();
    return { ...config, boardOnline: view?.boardOnline ?? false, busy: Boolean(view?.match) };
  };

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

  app.get("/api/admin/stations", async () => registry.configs().map(adminView));
  if (feed) {
    app.get("/api/admin/stations/live", (request, reply) =>
      streamView(request, reply, feed.subscribe, () => registry.configs().map(adminView)),
    );
  }

  app.post<{ Body: { id?: unknown; name?: unknown; boardUrl?: unknown } }>(
    "/api/admin/stations",
    async (request, reply) =>
      attempt(reply, () => reply.code(201).send(adminView(registry.add(request.body ?? {})))),
  );

  app.patch<{ Params: { id: string }; Body: { name?: unknown; boardUrl?: unknown } }>(
    "/api/admin/stations/:id",
    async (request, reply) =>
      attempt(reply, () =>
        adminView(registry.update(Number(request.params.id), request.body ?? {})),
      ),
  );

  app.delete<{ Params: { id: string } }>("/api/admin/stations/:id", async (request, reply) =>
    attempt(reply, () => {
      registry.remove(Number(request.params.id));
      return reply.code(204).send();
    }),
  );
}
