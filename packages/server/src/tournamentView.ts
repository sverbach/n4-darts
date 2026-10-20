// What /admin shows of a running or finished tournament: progress, stations, queue, group
// tables, the bracket and placings.

import { matchState } from "@n4/engine";
import type { TournamentMatchView, TournamentProgress, TournamentStationView } from "./api.ts";
import type { Db, MatchRecord, TournamentRecord } from "./db.ts";
import { legMinutes, matchMinutes } from "./estimate.ts";
import { queueOf } from "./scheduler.ts";
import type { StationDirectory } from "./stations.ts";
import type { Stats } from "./stats.ts";
import { groupName, type Plan, type PlannedMatch } from "./tournament/plan.ts";

export function progressView(
  db: Db,
  stations: StationDirectory,
  tournament: TournamentRecord,
  plan: Plan,
  stats?: Stats,
): TournamentProgress {
  const name = (id: string | null) => (id ? (db.getPlayer(id)?.name ?? "?") : null);
  const records = db.tournamentMatches(tournament.id);
  /** The record that counts for a slot: the live one, not an abandoned attempt. */
  const recordFor = (slot: string): MatchRecord | undefined =>
    records.filter((m) => m.slot === slot && !m.abandoned).at(-1);
  const decided = (m: MatchRecord | undefined) => Boolean(m?.closedAt && m.winner);

  function matchView(planned: PlannedMatch): TournamentMatchView {
    const record = recordFor(planned.slot);
    const players: [string | null, string | null] = [
      name(planned.sides[0]),
      name(planned.sides[1]),
    ];
    let legs: [number, number] | null = null;
    let status: TournamentMatchView["status"] = planned.players ? "queued" : "waiting";
    if (record) {
      if (record.walkover) status = "walkover";
      else if (decided(record)) status = "played";
      else if (record.station !== null) {
        status = db.events(record.id).length > 0 ? "playing" : "on-station";
      }
      if (decided(record)) {
        const index = (id: string) => record.playerIds.indexOf(id);
        const ordered = planned.players ?? (record.playerIds as [string, string]);
        if (record.walkover) {
          const n = record.settings.legsToWin;
          legs = ordered.map((p) => (p === record.winner ? n : 0)) as [number, number];
        } else {
          const state = matchState(record.settings, db.events(record.id));
          legs = ordered.map((p) => state.players[index(p)]?.legsWon ?? 0) as [number, number];
        }
      }
    }
    return {
      matchId: record?.id ?? null,
      slot: planned.slot,
      label: planned.label,
      players,
      legs,
      winner: decided(record) ? name(record?.winner ?? null) : null,
      status,
      station: record?.closedAt ? null : (record?.station ?? null),
    };
  }

  const groups = plan.groups.map((group, g) => ({
    name: plan.groups.length === 1 ? "Group" : `Group ${groupName(g)}`,
    table: group.table.map((row) => ({ ...row, name: name(row.playerId) ?? "?" })),
    fixtures: plan.matches.filter((m) => m.slot.startsWith(`g:${g}:`)).map(matchView),
  }));

  // Knockout rounds in bracket order: the winners bracket, the losers bracket, the final(s).
  const bracket: TournamentProgress["bracket"] = [];
  const knockoutMatches = plan.matches.filter((m) => m.phase !== "groups");
  for (const planned of knockoutMatches) {
    const section = planned.slot.startsWith("l")
      ? "losers"
      : planned.slot.startsWith("gf")
        ? "final"
        : "winners";
    const round = planned.label.replace(/ \d+$/, "");
    let column = bracket.find((c) => c.section === section && c.name === round);
    if (!column) {
      column = { section, name: round, matches: [] };
      bracket.push(column);
    }
    column.matches.push(matchView(planned));
  }
  const sectionOrder = { winners: 0, losers: 1, final: 2 };
  bracket.sort((a, b) => sectionOrder[a.section] - sectionOrder[b.section]);

  const busyStations = stations.list();
  const stationViews: TournamentStationView[] = busyStations.map((station) => {
    const view = station.view();
    const match = view.match;
    return {
      id: station.id,
      name: view.name,
      boardOnline: view.boardOnline,
      paused: db.isStationPaused(station.id),
      match: match
        ? {
            id: match.id,
            label: match.label,
            players: match.players.map((p) => p.name),
            started: match.state.phase !== "notStarted",
            summary:
              match.state.phase === "notStarted"
                ? "Waiting to start"
                : match.state.winner !== null
                  ? `${match.players[match.state.winner]?.name ?? "?"} won`
                  : match.state.players
                      .map((p, i) => `${match.players[i]?.name ?? "?"} ${p.remaining}`)
                      .join(" · "),
          }
        : null,
    };
  });

  const finished = tournament.status === "finished";
  const remaining = plan.matches.filter((m) => !decided(recordFor(m.slot)));
  const perLeg = legMinutes(db, tournament.config.x01.startScore);
  const working = Math.max(1, stationViews.filter((s) => !s.paused).length);
  const minutesLeft =
    remaining.reduce((sum, m) => sum + matchMinutes(tournament.config.legs[m.phase], perLeg), 0) /
    working;

  return {
    phase: finished ? "finished" : plan.groupPhaseDone ? "knockout" : "groups",
    played: plan.matches.length - remaining.length,
    total: plan.matches.length,
    expectedEnd: finished ? null : new Date(Date.now() + minutesLeft * 60_000).toISOString(),
    stations: stationViews,
    queue: finished
      ? []
      : queueOf(db, tournament.id, plan).map(({ match, ready }) => ({
          matchId: match.id,
          label: match.label ?? "",
          players: match.playerIds.map((id) => ({ id, name: name(id) ?? "?" })),
          ready,
          held: match.held,
          pinnedStation: match.pinnedStation,
        })),
    groups,
    bracket,
    placings:
      tournament.placings?.map((p) => ({
        name: name(p.playerId) ?? "?",
        from: p.from,
        to: p.to,
      })) ?? null,
    awards: finished && tournament.placings && stats ? stats.awards(tournament.id) : null,
    endedEarly: finished && !tournament.placings,
  };
}
