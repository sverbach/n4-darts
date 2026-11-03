// Plays a tournament to its end without stations: every match is won by its first player with
// one dart (D20 on 40, straight out). For tests that need a finished tournament.

import type { TournamentAdminView } from "../api.ts";
import type { buildApp } from "../app.ts";
import type { Db } from "../db.ts";

export async function playTournament(
  app: ReturnType<typeof buildApp>,
  db: Db,
  playerIds: string[],
) {
  const call = async (method: "GET" | "POST" | "PATCH", url: string, payload?: object) =>
    (
      await app.inject({ method, url, ...(payload ? { payload } : {}) })
    ).json() as TournamentAdminView;
  await call("POST", "/api/admin/tournament", {
    name: "Test night",
    playerIds,
    config: {
      format: { elimination: "single" },
      legs: { groups: 1, winners: 1, losers: 1, final: 1 },
      x01: { startScore: 40 },
    },
  });
  await call("PATCH", "/api/admin/tournament", { seedOrder: playerIds });
  const id = (await call("POST", "/api/admin/tournament/start")).tournament?.id as string;
  for (let guard = 0; guard < 100; guard++) {
    const open = db.tournamentMatches(id).filter((m) => !m.closedAt);
    if (open.length === 0) break;
    for (const match of open) {
      db.append(match.id, { type: "MatchStarted", playerCount: 2 });
      db.append(match.id, {
        type: "DartThrown",
        dartId: `${match.id}-0`,
        segment: { number: 20, multiplier: 2 },
      });
      db.setWinner(match.id, match.playerIds[0] ?? null);
      db.closeMatch(match.id);
    }
    await call("GET", "/api/admin/tournament");
  }
  return id;
}
