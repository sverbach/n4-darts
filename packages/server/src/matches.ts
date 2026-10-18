// The organiser creates matches in /admin and puts them on a free station (no queue: dispatch
// is the scheduler's job, later). The station then runs the match exactly like a quick match.
// /admin also shows the history and can correct any dart of any match (docs/adr/0002: the
// correction is appended, the original detection stays in the log).

import { matchState, type Segment } from "@n4/engine";
import type { FastifyInstance } from "fastify";
import type { MatchDetail, MatchSettingsInput, MatchSummary } from "./api.ts";
import type { Db, MatchRecord, StoredEvent } from "./db.ts";
import { CommandError } from "./station.ts";
import type { StationDirectory } from "./stations.ts";

const isSegment = (value: unknown): value is Segment => {
  const { number, multiplier } = (value ?? {}) as Partial<Segment>;
  if (typeof number !== "number" || typeof multiplier !== "number") return false;
  const validNumber = number === 25 || (Number.isInteger(number) && number >= 0 && number <= 20);
  return validNumber && [0, 1, 2, 3].includes(multiplier);
};

export function registerMatches(app: FastifyInstance, stations: StationDirectory, db?: Db) {
  app.post<{ Body: { station?: unknown; playerIds?: unknown; settings?: MatchSettingsInput } }>(
    "/api/admin/matches",
    async (request, reply) => {
      const { station: stationId, playerIds, settings } = request.body ?? {};
      if (!Array.isArray(playerIds) || !playerIds.every((p) => typeof p === "string")) {
        return reply.code(400).send({ error: "playerIds must be a list of player ids" });
      }
      const station = stations.get(Number(stationId));
      if (!station) return reply.code(404).send({ error: "no such station" });
      try {
        return reply.code(201).send(station.assign({ playerIds, settings }));
      } catch (error) {
        if (error instanceof CommandError) return reply.code(409).send({ error: error.message });
        throw error;
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/admin/stations/:id/abandon",
    async (request, reply) => {
      const station = stations.get(Number(request.params.id));
      if (!station) return reply.code(404).send({ error: "no such station" });
      return station.command({ type: "abandonMatch" });
    },
  );

  if (!db) return;

  /** The station currently running this match, if any. */
  const stationOf = (matchId: string) =>
    stations.list().find((s) => s.view().match?.id === matchId);

  function detail(match: MatchRecord, events: StoredEvent[]): MatchDetail {
    const state = matchState(match.settings, events);
    const originals: Record<string, Segment> = {};
    for (const event of events) {
      if (event.type === "DartThrown") originals[event.dartId] = event.segment;
    }
    // Keep only the darts whose segment changed since detection.
    const corrected = new Set(
      events.flatMap((e) => (e.type === "DartCorrected" ? [e.dartId] : [])),
    );
    for (const dartId of Object.keys(originals)) {
      if (!corrected.has(dartId)) delete originals[dartId];
    }
    return {
      id: match.id,
      station: match.station,
      players: match.playerIds.map((id) => ({ id, name: db?.getPlayer(id)?.name ?? "?" })),
      settings: match.settings,
      winner: match.winner,
      abandoned: match.abandoned,
      closedAt: match.closedAt,
      legsWon: match.playerIds.map((_, i) => state.players[i]?.legsWon ?? 0),
      state,
      originals,
    };
  }

  const summary = ({ state: _, originals: __, ...rest }: MatchDetail): MatchSummary => rest;

  app.get("/api/admin/matches", async () =>
    db.closedMatches().map((match) => summary(detail(match, db.events(match.id)))),
  );

  app.get<{ Params: { id: string } }>("/api/admin/matches/:id", async (request, reply) => {
    const match = db.getMatch(request.params.id);
    if (!match) return reply.code(404).send({ error: "no such match" });
    return detail(match, db.events(match.id));
  });

  app.post<{ Params: { id: string }; Body: { dartId?: unknown; segment?: unknown } }>(
    "/api/admin/matches/:id/corrections",
    async (request, reply) => {
      const match = db.getMatch(request.params.id);
      if (!match) return reply.code(404).send({ error: "no such match" });
      const { dartId, segment } = request.body ?? {};
      if (!isSegment(segment)) return reply.code(400).send({ error: "not a valid segment" });
      const events = db.events(match.id);
      if (!events.some((e) => e.type === "DartThrown" && e.dartId === dartId)) {
        return reply.code(404).send({ error: "no such dart in this match" });
      }

      // A running match goes through its station, which keeps its own state and live viewers.
      const station = stationOf(match.id);
      if (station) {
        station.correct(dartId as string, segment, "admin");
      } else {
        const event: StoredEvent = {
          type: "DartCorrected",
          dartId: dartId as string,
          segment,
          source: "admin",
        };
        db.append(match.id, event);
        // The stored result follows the log, also after the match was closed; an abandoned
        // match never gets one.
        const winner = match.abandoned
          ? null
          : matchState(match.settings, [...events, event]).winner;
        db.setWinner(match.id, winner === null ? null : (match.playerIds[winner] ?? null));
      }
      const updated = db.getMatch(match.id) as MatchRecord;
      return detail(updated, db.events(match.id));
    },
  );
}
