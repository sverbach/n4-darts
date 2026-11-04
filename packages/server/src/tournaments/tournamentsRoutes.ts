// The tournament's routes in /admin: its view (also live), drafting, starting, withdrawals, late
// players, ending early, and the organiser's overrides (pause, hold, pin, send back, play now).

import type { FastifyInstance, FastifyReply } from "fastify";
import {
  MatchHoldInput,
  MatchPinInput,
  type PastTournament,
  type PastTournamentSummary,
  PlayNowInput,
  StationPauseInput,
  type TournamentAdminView,
  TournamentInput,
  TournamentPlayerInput,
} from "../api.ts";
import type { ChangeFeed } from "../live/live.ts";
import { streamView } from "../live/liveRoutes.ts";
import { IdParams, parse, TextIdParams } from "../parse.ts";
import { TournamentError, type Tournaments } from "./tournaments.ts";

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

  app.post("/api/admin/tournament", async (request, reply) => {
    const input = parse(TournamentInput, request.body);
    return attempt(reply, () => reply.code(201).send(tournaments.create(input)));
  });
  app.patch("/api/admin/tournament", async (request, reply) => {
    const input = parse(TournamentInput, request.body);
    return attempt(reply, () => tournaments.update(input));
  });
  app.delete("/api/admin/tournament", async (_request, reply) =>
    attempt(reply, () => {
      tournaments.discard();
      return reply.code(204).send();
    }),
  );
  app.post("/api/admin/tournament/start", async (_request, reply) =>
    attempt(reply, () => tournaments.start()),
  );
  app.post("/api/admin/tournament/withdraw", async (request, reply) => {
    const { playerId } = parse(TournamentPlayerInput, request.body);
    return attempt(reply, () => {
      tournaments.withdraw(playerId);
      return tournaments.view();
    });
  });
  app.post("/api/admin/tournament/late", async (request, reply) => {
    const { playerId } = parse(TournamentPlayerInput, request.body);
    return attempt(reply, () => {
      tournaments.addLate(playerId);
      return tournaments.view();
    });
  });
  app.post("/api/admin/tournament/end", async (_request, reply) =>
    attempt(reply, () => {
      tournaments.endEarly();
      return tournaments.view();
    }),
  );
  app.post("/api/admin/tournament/stations/:id/pause", async (request, reply) => {
    const { id } = parse(IdParams, request.params);
    const { paused } = parse(StationPauseInput, request.body);
    return attempt(reply, () => {
      tournaments.pauseStation(id, paused);
      return tournaments.view();
    });
  });
  app.post("/api/admin/tournament/matches/:id/hold", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    const { held } = parse(MatchHoldInput, request.body);
    return attempt(reply, () => {
      tournaments.hold(id, held);
      return tournaments.view();
    });
  });
  app.post("/api/admin/tournament/matches/:id/pin", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    const { station } = parse(MatchPinInput, request.body);
    return attempt(reply, () => {
      tournaments.pin(id, station);
      return tournaments.view();
    });
  });
  app.post("/api/admin/tournament/matches/:id/send-back", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    return attempt(reply, () => {
      tournaments.sendBack(id);
      return tournaments.view();
    });
  });
  app.post("/api/admin/tournament/matches/:id/play-now", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    const { station } = parse(PlayNowInput, request.body);
    return attempt(reply, () => {
      tournaments.playNow(id, station);
      return tournaments.view();
    });
  });
}

/** Finished tournaments, open to everyone (and on the public site). */
export function registerPastTournaments(
  app: FastifyInstance,
  past: { list(): PastTournamentSummary[]; one(id: string): PastTournament | undefined },
) {
  app.get("/api/tournaments", async () => past.list());
  app.get("/api/tournaments/:id", async (request, reply) => {
    const tournament = past.one(parse(TextIdParams, request.params).id);
    return tournament ?? reply.code(404).send({ error: "no such tournament" });
  });
}
