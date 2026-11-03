// Finished tournaments as the stats pages show them: the list, and each one's page.

import type { PastTournament, PastTournamentSummary } from "../api.ts";
import type { Db, TournamentRecord } from "../db.ts";
import { matchPlayer } from "../players/players.ts";
import { fixedDirectory } from "../stations/stations.ts";
import { plan } from "./plan/plan.ts";
import { resultOf } from "./results.ts";
import { progressView } from "./tournamentView.ts";

function summary(db: Db, tournament: TournamentRecord): PastTournamentSummary {
  const champion = tournament.placings?.find((p) => p.from === 1);
  return {
    id: tournament.id,
    name: tournament.name,
    date: tournament.startedAt ?? tournament.createdAt,
    champion: champion ? matchPlayer(db, champion.playerId) : null,
  };
}

/** Finished tournaments, newest first. */
export function pastTournaments(db: Db): PastTournamentSummary[] {
  return db
    .tournaments()
    .filter((t) => t.status === "finished")
    .map((t) => summary(db, t));
}

/** A finished tournament's page, without the awards (Stats adds those); undefined otherwise. */
export function pastTournament(db: Db, id: string): PastTournament | undefined {
  const tournament = db.getTournament(id);
  if (tournament?.status !== "finished") return undefined;
  const results = db
    .tournamentMatches(tournament.id)
    .flatMap((m) => resultOf(m, m.walkover ? [] : db.events(m.id)) ?? []);
  const progress = progressView(
    db,
    fixedDirectory([]),
    tournament,
    plan(tournament.config, db.entrants(tournament.id), results),
  );
  return {
    ...summary(db, tournament),
    endedEarly: progress.endedEarly,
    placings: progress.placings,
    awards: null,
    groups: progress.groups,
    bracket: progress.bracket,
  };
}
