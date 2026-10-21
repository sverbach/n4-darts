import type {
  Award,
  QueueEntryView,
  TournamentAdminView,
  TournamentMatchView,
  TournamentProgress,
  TournamentStationView,
} from "@n4/server/api";
import { useState } from "react";
import { Avatar } from "./Avatar.tsx";
import { usePlayers } from "./MatchSetup.tsx";

type Send = (method: string, url: string, body?: object) => Promise<boolean>;

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" });
const place = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
const PHASES = { groups: "Group phase", knockout: "Knockout", finished: "Finished" };

export function TournamentRun(props: { view: TournamentAdminView; send: Send; onNew(): void }) {
  const { view, send, onNew } = props;
  const tournament = view.tournament as NonNullable<TournamentAdminView["tournament"]>;
  const progress = view.progress as TournamentProgress;
  const live = tournament.status === "running";

  const base = "/api/admin/tournament";
  return (
    <div className="tournament-run">
      <header className="run-header">
        <h2>{tournament.name}</h2>
        <p>
          {progress.endedEarly ? "Ended early" : PHASES[progress.phase]} · {progress.played} of{" "}
          {progress.total} matches played
          {progress.expectedEnd && ` · ends around ${time(progress.expectedEnd)}`}
        </p>
      </header>

      {progress.placings && (
        <section>
          <h2>Final placings</h2>
          <ol className="placings">
            {progress.placings.map((p) => (
              <li key={p.name} className={p.from === 1 ? "champion" : ""}>
                <span className="placing-place">{place(p.from, p.to)}</span>
                <span>{p.name}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {progress.awards && progress.awards.length > 0 && (
        <section>
          <h2>Awards</h2>
          <Awards awards={progress.awards} />
        </section>
      )}
      {!live && (
        <button type="button" className="primary" onClick={onNew}>
          New tournament
        </button>
      )}

      {live && (
        <>
          <h2>Stations</h2>
          <ul className="station-list">
            {progress.stations.map((s) => (
              <StationRow key={s.id} station={s} send={send} base={base} />
            ))}
          </ul>

          <h2>Queue ({progress.queue.length})</h2>
          {progress.queue.length === 0 ? (
            <p className="hint">Nothing waiting.</p>
          ) : (
            <ul className="queue-list">
              {progress.queue.map((q) => (
                <QueueRow
                  key={q.matchId}
                  entry={q}
                  stations={progress.stations}
                  send={send}
                  base={base}
                />
              ))}
            </ul>
          )}
        </>
      )}

      {progress.bracket.length > 0 && (
        <>
          <h2>Knockout</h2>
          <div className="bracket">
            {progress.bracket.map((column) => (
              <div
                key={`${column.section}-${column.name}`}
                className={`bracket-round ${column.section}`}
              >
                <h3>{column.name}</h3>
                <div className="bracket-matches">
                  {column.matches.map((m) => (
                    <MatchCard key={m.slot} match={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {progress.groups.map((group) => (
        <section key={group.name}>
          <h2>{group.name}</h2>
          <div className="table-scroll">
            <table className="group-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="name">Player</th>
                  <th>P</th>
                  <th>W</th>
                  <th>L</th>
                  <th>Legs</th>
                  <th>+/−</th>
                  <th>Pts</th>
                  <th>Avg</th>
                </tr>
              </thead>
              <tbody>
                {group.table.map((row, i) => (
                  <tr key={row.playerId}>
                    <td>{i + 1}</td>
                    <td className="name">{row.name}</td>
                    <td>{row.played}</td>
                    <td>{row.won}</td>
                    <td>{row.lost}</td>
                    <td>
                      {row.legsFor}:{row.legsAgainst}
                    </td>
                    <td>{row.legDiff > 0 ? `+${row.legDiff}` : row.legDiff}</td>
                    <td className="points">{row.points}</td>
                    <td>{row.average === null ? "–" : row.average.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="fixtures">
            <summary>Matches</summary>
            <ul>
              {group.fixtures.map((f) => (
                <li key={f.slot}>
                  <span className="fixture-players">
                    {f.players[0]} – {f.players[1]}
                  </span>
                  <span className="fixture-result">{fixtureResult(f)}</span>
                </li>
              ))}
            </ul>
          </details>
        </section>
      ))}

      {live && (
        <Roster view={view} send={send} base={base} groupPhase={progress.phase === "groups"} />
      )}

      {live && (
        <button
          type="button"
          className="ghost danger end-match"
          onClick={() => {
            if (
              confirm("End the tournament now? Open matches are abandoned and there's no champion.")
            ) {
              void send("POST", `${base}/end`);
            }
          }}
        >
          End tournament early
        </button>
      )}
    </div>
  );
}

const AWARDS: Record<Award["kind"], { title: string; format(value: number): string }> = {
  bestAverage: { title: "Best match average", format: (v) => v.toFixed(1) },
  highestCheckout: { title: "Highest checkout", format: String },
  most180s: { title: "Most 180s", format: String },
  bestLeg: { title: "Best leg", format: (v) => `${v} dart${v === 1 ? "" : "s"}` },
};

/** The evening's awards: what, the value, who. */
export function Awards({ awards }: { awards: Award[] }) {
  return (
    <ul className="awards">
      {awards.map((award) => (
        <li key={award.kind}>
          <span className="award-title">{AWARDS[award.kind].title}</span>
          <span className="award-players">{award.players.join(", ")}</span>
          <span className="award-value">{AWARDS[award.kind].format(award.value)}</span>
        </li>
      ))}
    </ul>
  );
}

const STATUS: Record<TournamentMatchView["status"], string> = {
  waiting: "",
  queued: "Queued",
  "on-station": "On a station",
  playing: "Playing",
  played: "",
  walkover: "Walkover",
};

function fixtureResult(f: TournamentMatchView) {
  if (f.legs) return `${f.legs[0]}:${f.legs[1]}${f.status === "walkover" ? " (w/o)" : ""}`;
  return STATUS[f.status];
}

const SIDES = ["top", "bottom"] as const;

export function MatchCard({ match }: { match: TournamentMatchView }) {
  return (
    <div className={`bracket-match ${match.status}`}>
      <div className="bracket-label">{match.label}</div>
      {SIDES.map((side, i) => {
        const p = match.sides[i];
        return (
          <div
            key={side}
            className={`bracket-player ${p && match.winner === p.name ? "winner" : ""}`}
          >
            {p && <Avatar player={p} />}
            <span className="bracket-name">{p?.name ?? "–"}</span>
            {match.legs && <span className="bracket-legs">{match.legs[i]}</span>}
          </div>
        );
      })}
      {!match.legs && STATUS[match.status] && (
        <div className="bracket-status">{STATUS[match.status]}</div>
      )}
    </div>
  );
}

function StationRow(props: { station: TournamentStationView; send: Send; base: string }) {
  const { station, send, base } = props;
  const match = station.match;
  return (
    <li className="station-row">
      <div className="station-row-head">
        <span className="station-row-name">{station.name}</span>
        <span className={`status ${station.boardOnline ? "ok" : "warn"}`}>
          {station.paused ? "Paused" : station.boardOnline ? "Board online" : "Board offline"}
        </span>
      </div>
      {match ? (
        <p className="station-row-match">
          {match.label && <span className="match-label">{match.label} </span>}
          {match.players.join(" vs ")}: {match.summary}
        </p>
      ) : (
        <p className="hint">{station.paused ? "Paused for the tournament" : "Free"}</p>
      )}
      <div className="station-row-actions">
        <button
          type="button"
          className="ghost"
          onClick={() =>
            send("POST", `${base}/stations/${station.id}/pause`, { paused: !station.paused })
          }
        >
          {station.paused ? "Resume" : "Pause"}
        </button>
        {match && !match.started && match.label && (
          <>
            <button
              type="button"
              className="ghost"
              onClick={() => send("POST", `${base}/matches/${match.id}/send-back`)}
            >
              Send back
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => send("POST", `${base}/matches/${match.id}/hold`, { held: true })}
            >
              Hold
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function QueueRow(props: {
  entry: QueueEntryView;
  stations: TournamentStationView[];
  send: Send;
  base: string;
}) {
  const { entry, stations, send, base } = props;
  const url = `${base}/matches/${entry.matchId}`;
  // Play now: a free station, or one whose match hasn't started (that one goes back).
  const open = stations.filter((s) => !s.match?.started);
  const pinnedTo = stations.find((s) => s.id === entry.pinnedStation);
  return (
    <li className={`queue-row ${entry.ready ? "ready" : ""}`}>
      <div className="queue-row-head">
        <span className="match-label">{entry.label}</span>
        <span className="queue-badges">
          {entry.held ? "Held" : entry.ready ? "Ready" : "Waiting for players"}
          {pinnedTo && ` · only ${pinnedTo.name}`}
        </span>
      </div>
      <p className="queue-players">{entry.players.map((p) => p.name).join(" vs ")}</p>
      <div className="queue-actions">
        <button
          type="button"
          className="ghost"
          onClick={() => send("POST", `${url}/hold`, { held: !entry.held })}
        >
          {entry.held ? "Release" : "Hold"}
        </button>
        <select
          aria-label={`Pin ${entry.label} to a station`}
          value={entry.pinnedStation ?? ""}
          onChange={(e) =>
            send("POST", `${url}/pin`, {
              station: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        >
          <option value="">Any station</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              Only {s.name}
            </option>
          ))}
        </select>
        <select
          aria-label={`Play ${entry.label} now`}
          value=""
          onChange={(e) =>
            e.target.value && send("POST", `${url}/play-now`, { station: Number(e.target.value) })
          }
        >
          <option value="">Play now on…</option>
          {open.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}

/** Who's in: withdraw a player, or add one who arrives late (group phase only). */
function Roster(props: {
  view: TournamentAdminView;
  send: Send;
  base: string;
  groupPhase: boolean;
}) {
  const { view, send, base, groupPhase } = props;
  const { players } = usePlayers();
  const [late, setLate] = useState("");
  const inIt = new Set(view.entrants.map((e) => e.playerId));
  const available = players?.filter((p) => !inIt.has(p.id)) ?? [];

  return (
    <section>
      <h2>Players</h2>
      <ul className="player-list">
        {view.entrants.map((e) => (
          <li key={e.playerId} className="player-row">
            <span className={`player-row-name ${e.withdrawn ? "withdrawn" : ""}`}>{e.name}</span>
            {e.withdrawn ? (
              <span className="hint">Withdrawn</span>
            ) : (
              <button
                type="button"
                className="ghost danger"
                onClick={() => {
                  if (confirm(`Withdraw ${e.name}? Their remaining matches become walkovers.`)) {
                    void send("POST", `${base}/withdraw`, { playerId: e.playerId });
                  }
                }}
              >
                Withdraw
              </button>
            )}
          </li>
        ))}
      </ul>
      {groupPhase && available.length > 0 && (
        <div className="inline-form">
          <select aria-label="Late arrival" value={late} onChange={(e) => setLate(e.target.value)}>
            <option value="">Late arrival…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!late}
            onClick={async () => {
              if (await send("POST", `${base}/late`, { playerId: late })) setLate("");
            }}
          >
            Add
          </button>
        </div>
      )}
    </section>
  );
}
