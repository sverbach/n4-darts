import type {
  QueueEntryView,
  TournamentAdminView,
  TournamentMatchView,
  TournamentProgress,
  TournamentStationView,
} from "@n4/server/api";
import { useState } from "react";
import { Avatar } from "../../../components/Avatar.tsx";
import { Awards } from "../../../components/Awards.tsx";
import { MatchCard, STATUS } from "../../../components/MatchCard.tsx";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { Progress } from "../../../components/Progress.tsx";
import { usePlayers } from "../../../lib/usePlayers.ts";

type Send = (method: string, url: string, body?: object) => Promise<boolean>;

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" });
const place = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
const PHASES = { groups: "Group phase", knockout: "Knockout", finished: "Finished" };

export function TournamentRun(props: { view: TournamentAdminView; send: Send; onNew(): void }) {
  const { view, send, onNew } = props;
  const tournament = view.tournament as NonNullable<TournamentAdminView["tournament"]>;
  const progress = view.progress as TournamentProgress;
  const live = tournament.status === "running";
  const champion = progress.placings?.find((p) => p.from === 1);

  const base = "/api/admin/tournament";
  return (
    <div className="tournament-run">
      <header className="run-header">
        <div>
          {live ? (
            <span className="run-state running">Running</span>
          ) : (
            <span className="run-state">{progress.endedEarly ? "Ended early" : "Finished"}</span>
          )}
          <h1>{tournament.name}</h1>
          <p className="hint">
            {live && `${PHASES[progress.phase]} · `}
            {progress.played} of {progress.total} matches played
            {progress.expectedEnd && ` · ends around ${time(progress.expectedEnd)}`}
          </p>
        </div>
        {live ? (
          <Progress played={progress.played} total={progress.total} />
        ) : (
          <button type="button" className="primary cta" onClick={onNew}>
            New tournament <PixelIcon name="arrow" height="0.9em" />
          </button>
        )}
      </header>

      {(progress.placings || (progress.awards && progress.awards.length > 0)) && (
        <div className="admin-columns even">
          {progress.placings && (
            <section className="admin-section">
              <h2>Final placings</h2>
              {champion && (
                <div className="champion-card">
                  <Avatar player={champion} large />
                  <div>
                    <span className="match-label">Champion</span>
                    <span className="champion-name">{champion.name}</span>
                  </div>
                  <PixelIcon name="trophy" label="Champion" />
                  <span className="champion-place">1</span>
                </div>
              )}
              <ol className="placings">
                {progress.placings
                  .filter((p) => p !== champion)
                  .map((p) => (
                    <li key={p.id}>
                      <span className="placing-place">{place(p.from, p.to)}</span>
                      <Avatar player={p} />
                      <span className="placing-name">{p.name}</span>
                    </li>
                  ))}
              </ol>
            </section>
          )}
          {progress.awards && progress.awards.length > 0 && (
            <section className="admin-section">
              <h2>Awards</h2>
              <Awards awards={progress.awards} />
            </section>
          )}
        </div>
      )}

      {live && (
        <div className="admin-columns even">
          <div className="admin-main">
            <section className="admin-section">
              <h2>Stations</h2>
              <ul className="card-list">
                {progress.stations.map((s) => (
                  <StationRow key={s.id} station={s} send={send} base={base} />
                ))}
              </ul>
            </section>
            <section className="admin-section">
              <h2>
                Queue <span className="count">({progress.queue.length})</span>
              </h2>
              {progress.queue.length === 0 ? (
                <p className="hint">Nothing waiting.</p>
              ) : (
                <ul className="card-list">
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
            </section>
          </div>
          <div className="admin-main">
            <Roster view={view} send={send} base={base} groupPhase={progress.phase === "groups"} />
          </div>
        </div>
      )}

      {progress.bracket.length > 0 && (
        <section className="admin-section">
          <h2>Knockout</h2>
          <BracketRows bracket={progress.bracket} />
        </section>
      )}

      <section className="admin-section">
        <h2>Groups</h2>
        <div className="group-grid">
          {progress.groups.map((group) => (
            <div key={group.name} className="group-block">
              {progress.groups.length > 1 && <span className="match-label">{group.name}</span>}
              <div className="table-scroll table-panel">
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
                      <th className="accent">Pts</th>
                      <th>Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.table.map((row, i) => (
                      <tr key={row.playerId}>
                        <td className="rank">{i + 1}</td>
                        <td className="name">
                          <span className="table-player">
                            <Avatar
                              player={{ id: row.playerId, name: row.name, photo: row.photo }}
                            />
                            {row.name}
                          </span>
                        </td>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.lost}</td>
                        <td className="muted">
                          {row.legsFor}:{row.legsAgainst}
                        </td>
                        <td>{row.legDiff > 0 ? `+${row.legDiff}` : row.legDiff}</td>
                        <td className="points">{row.points}</td>
                        <td className="muted">
                          {row.average === null ? "–" : row.average.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details className="fixtures">
                <summary>
                  <PixelIcon name="caret" /> Matches ({group.fixtures.length})
                </summary>
                <ul>
                  {group.fixtures.map((f) => (
                    <li key={f.slot}>
                      <span className="fixture-players">
                        {f.players[0]} <span className="vs">vs</span> {f.players[1]}
                      </span>
                      <span className={`fixture-result ${f.legs ? "" : "pending"}`}>
                        {fixtureResult(f)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </section>

      {live && (
        <div className="run-end">
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (
                confirm(
                  "End the tournament now? Open matches are abandoned and there's no champion.",
                )
              ) {
                void send("POST", `${base}/end`);
              }
            }}
          >
            End tournament early
          </button>
        </div>
      )}
    </div>
  );
}

/** The winners bracket and final in one row, the losers bracket in another; each scrolls sideways. */
function BracketRows({ bracket }: { bracket: TournamentProgress["bracket"] }) {
  const top = bracket.filter((c) => c.section !== "losers");
  const losers = bracket.filter((c) => c.section === "losers");
  const rows = [
    { title: losers.length > 0 ? "Winners bracket" : "", columns: top },
    { title: "Losers bracket", columns: losers },
  ].filter((row) => row.columns.length > 0);
  return (
    <>
      {rows.map((row) => (
        <div key={row.title} className="bracket-row">
          {row.title && <span className="match-label">{row.title}</span>}
          <div className="bracket">
            {row.columns.map((column) => (
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
        </div>
      ))}
    </>
  );
}

function fixtureResult(f: TournamentMatchView) {
  if (f.legs) return `${f.legs[0]}:${f.legs[1]}${f.status === "walkover" ? " (w/o)" : ""}`;
  return STATUS[f.status];
}

function StationRow(props: { station: TournamentStationView; send: Send; base: string }) {
  const { station, send, base } = props;
  const match = station.match;
  const [status, tone] = station.paused
    ? ["Paused", "warn"]
    : station.boardOnline
      ? ["Board online", "ok"]
      : ["Board offline", "danger"];
  return (
    <li className="card-row">
      <div className="card-row-main">
        <div className="card-row-title">
          <span className="card-row-name">{station.name}</span>
          <span className={`status small ${tone}`}>{status}</span>
        </div>
        {match ? (
          <span className="card-row-detail">
            {match.label && <span className="match-label">{match.label}</span>}{" "}
            {match.players.join(" vs ")}: {match.summary}
          </span>
        ) : (
          <span className="card-row-detail hint">
            {station.paused ? "Paused for the tournament" : "Free"}
          </span>
        )}
      </div>
      <div className="card-row-actions">
        <button
          type="button"
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
              onClick={() => send("POST", `${base}/matches/${match.id}/send-back`)}
            >
              Send back
            </button>
            <button
              type="button"
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
  const [badge, tone] = entry.held
    ? ["Held", "warn"]
    : entry.ready
      ? ["Ready", "ok"]
      : ["Waiting for players", ""];
  return (
    <li className="queue-row">
      <div className="queue-row-head">
        <span className="match-label">{entry.label}</span>
        <span className="queue-players">{entry.players.map((p) => p.name).join(" vs ")}</span>
        <span className={`badge ${tone}`}>{badge}</span>
        {pinnedTo && <span className="badge">Only {pinnedTo.name}</span>}
      </div>
      <div className="queue-actions">
        <button type="button" onClick={() => send("POST", `${url}/hold`, { held: !entry.held })}>
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
    <section className="admin-section">
      <h2>
        Players <span className="count">({view.entrants.length})</span>
      </h2>
      <ul className="roster">
        {view.entrants.map((e) => (
          <li key={e.playerId} className={e.withdrawn ? "withdrawn" : ""}>
            <Avatar player={{ id: e.playerId, name: e.name, photo: e.photo }} />
            <span className="roster-name">{e.name}</span>
            {e.withdrawn ? (
              <span className="label">Withdrawn</span>
            ) : (
              <button
                type="button"
                className="ghost"
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
        <div className="inline-form late-arrival">
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
