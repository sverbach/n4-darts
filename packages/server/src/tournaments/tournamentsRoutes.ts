// The tournament's routes in /admin: its view (also live), drafting, starting, withdrawals, late
// players, ending early, and the organiser's overrides (pause, hold, pin, send back, play now).

import type { FastifyInstance, FastifyReply } from "fastify";
import type { TournamentAdminView } from "../api.ts";
import type { ChangeFeed } from "../live/live.ts";
import { streamView } from "../live/liveRoutes.ts";
import { TournamentError, type TournamentInput, type Tournaments } from "./tournaments.ts";

/**
 * `view` is the tournament as /admin shows it, put together in app.ts with the queue from
 * Scheduling and the awards from Stats; the changes answer with the tournament's own view.
 */
export function registerTournaments(
  app: FastifyInstance,
  tournaments: Tournaments,
  view: () => TournamentAdminView,
  feed: ChangeFeed,
) {
  /** Runs a change, answering its errors with their status. */
  function attempt(reply: FastifyReply, change: () => unknown) {
    try {
      return change();
    } catch (error) {
      if (error instanceof TournamentError) {
        return reply.code(error.status).send({ error: error.message });
      }
      throw error;
    }
  }

  app.get("/api/admin/tournament", async () => view());
  app.get("/api/admin/tournament/live", (request, reply) =>
    streamView(request, reply, feed.subscribe, view, { kind: "admin tournament" }),
  );

  app.post<{ Body: TournamentInput }>("/api/admin/tournament", async (request, reply) =>
    attempt(reply, () => reply.code(201).send(tournaments.create(request.body ?? {}))),
  );
  app.patch<{ Body: TournamentInput }>("/api/admin/tournament", async (request, reply) =>
    attempt(reply, () => tournaments.update(request.body ?? {})),
  );
  app.delete("/api/admin/tournament", async (_request, reply) =>
    attempt(reply, () => {
      tournaments.discard();
      return reply.code(204).send();
    }),
  );
  app.post("/api/admin/tournament/start", async (_request, reply) =>
    attempt(reply, () => tournaments.start()),
  );
  app.post<{ Body: { playerId?: unknown } }>(
    "/api/admin/tournament/withdraw",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.withdraw(String(request.body?.playerId ?? ""));
        return tournaments.view();
      }),
  );
  app.post<{ Body: { playerId?: unknown } }>("/api/admin/tournament/late", async (request, reply) =>
    attempt(reply, () => {
      tournaments.addLate(String(request.body?.playerId ?? ""));
      return tournaments.view();
    }),
  );
  app.post("/api/admin/tournament/end", async (_request, reply) =>
    attempt(reply, () => {
      tournaments.endEarly();
      return tournaments.view();
    }),
  );
  app.post<{ Params: { id: string }; Body: { paused?: unknown } }>(
    "/api/admin/tournament/stations/:id/pause",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.pauseStation(Number(request.params.id), request.body?.paused !== false);
        return tournaments.view();
      }),
  );
  app.post<{ Params: { id: string }; Body: { held?: unknown } }>(
    "/api/admin/tournament/matches/:id/hold",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.hold(request.params.id, request.body?.held !== false);
        return tournaments.view();
      }),
  );
  app.post<{ Params: { id: string }; Body: { station?: unknown } }>(
    "/api/admin/tournament/matches/:id/pin",
    async (request, reply) =>
      attempt(reply, () => {
        const station = request.body?.station;
        tournaments.pin(
          request.params.id,
          station === null || station === undefined ? null : Number(station),
        );
        return tournaments.view();
      }),
  );
  app.post<{ Params: { id: string } }>(
    "/api/admin/tournament/matches/:id/send-back",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.sendBack(request.params.id);
        return tournaments.view();
      }),
  );
  app.post<{ Params: { id: string }; Body: { station?: unknown } }>(
    "/api/admin/tournament/matches/:id/play-now",
    async (request, reply) =>
      attempt(reply, () => {
        tournaments.playNow(request.params.id, Number(request.body?.station));
        return tournaments.view();
      }),
  );
}
