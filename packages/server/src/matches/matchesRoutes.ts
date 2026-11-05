// The organiser's match routes in /admin: put a match on a station, end one, the history, one
// match's detail (also live), and corrections.

import type { FastifyInstance, FastifyReply } from "fastify";
import { CorrectionInput, NewMatchInput } from "../api.ts";
import type { ChangeFeed } from "../live/live.ts";
import { liveView, Refusal } from "../live/liveRoutes.ts";
import { IdParams, parse, TextIdParams } from "../parse.ts";
import { CommandError } from "../stations/station.ts";
import type { StationDirectory } from "../stations/stations.ts";
import { MatchError, type Matches } from "./matches.ts";

const STATUS = { missing: 404, refused: 409 } as const;

/** Runs a request, answering its refusal with a status. */
async function attempt<T>(reply: FastifyReply, run: () => T): Promise<T | FastifyReply> {
  try {
    return run();
  } catch (error) {
    if (error instanceof MatchError) {
      return reply.code(STATUS[error.reason]).send({ error: error.message });
    }
    throw error;
  }
}

/** Without `matches` (no database), only putting a match on a station and ending one work. */
export function registerMatches(
  app: FastifyInstance,
  stations: StationDirectory,
  matches?: Matches,
  feed?: ChangeFeed,
) {
  app.post("/api/admin/matches", async (request, reply) => {
    const { station: stationId, playerIds, settings } = parse(NewMatchInput, request.body);
    const station = stations.get(stationId);
    if (!station) return reply.code(404).send({ error: "no such station" });
    try {
      return reply.code(201).send(station.assign({ playerIds, settings }));
    } catch (error) {
      if (error instanceof CommandError) return reply.code(409).send({ error: error.message });
      throw error;
    }
  });

  app.post("/api/admin/stations/:id/abandon", async (request, reply) => {
    const station = stations.get(parse(IdParams, request.params).id);
    if (!station) return reply.code(404).send({ error: "no such station" });
    return station.command({ type: "abandonMatch" });
  });

  if (!matches) return;

  app.get("/api/admin/matches", async () => matches.history());
  liveView(app, "/api/admin/matches/live", () => {
    if (!feed) throw new Refusal(404, "not found");
    return { subscribe: feed.subscribe, view: () => matches.history(), kind: "match history" };
  });

  app.get("/api/admin/matches/:id", async (request, reply) =>
    attempt(reply, () => matches.detail(parse(TextIdParams, request.params).id)),
  );

  liveView(app, "/api/admin/matches/:id/live", (request) => {
    if (!feed) throw new Refusal(404, "no such match");
    const { id } = parse(TextIdParams, request.params);
    let view: () => unknown;
    try {
      view = matches.follow(id);
    } catch (error) {
      if (error instanceof MatchError) throw new Refusal(404, error.message);
      throw error;
    }
    return { subscribe: feed.subscribe, view, kind: "match detail", label: id };
  });

  app.post("/api/admin/matches/:id/corrections", async (request, reply) => {
    const { id } = parse(TextIdParams, request.params);
    const { dartId, segment } = parse(CorrectionInput, request.body);
    return attempt(reply, () => matches.correct(id, dartId, segment));
  });
}

/** A finished match's page, open to everyone (and on the public site). */
export function registerMatchPage(app: FastifyInstance, matches: Pick<Matches, "page">) {
  app.get("/api/matches/:id", async (request, reply) =>
    attempt(reply, () => matches.page(parse(TextIdParams, request.params).id)),
  );
}
