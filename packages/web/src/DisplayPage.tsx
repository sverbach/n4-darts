import type { DisplayStation, DisplayView, ScoreCard } from "@n4/server/api";
import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from "react";
import { dartLabel } from "./darts.ts";
import { Awards, MatchCard } from "./TournamentRun.tsx";
import { useLive } from "./useLive.ts";

const PHASES = { groups: "Group phase", knockout: "Knockout", finished: "Finished" };
const place = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);

/** The projector: the tournament with live station scores, or just the stations. */
export function DisplayPage() {
  const { view, connected } = useLive<DisplayView>("/api/display/live");

  return (
    <main className="display">
      {!view ? (
        <p className="display-wait">{connected ? "Loading…" : "Connecting…"}</p>
      ) : view.tournament?.phase === "finished" ? (
        <Finished view={view} />
      ) : view.tournament ? (
        <Running view={view} />
      ) : (
        <Idle view={view} />
      )}
      {view && !connected && <p className="display-offline">Server offline</p>}
    </main>
  );
}

function Header({ title, detail }: { title: string; detail?: string }) {
  return (
    <header className="display-header">
      <h1>{title}</h1>
      {detail && <p>{detail}</p>}
    </header>
  );
}

function Running({ view }: { view: DisplayView }) {
  const t = view.tournament as NonNullable<DisplayView["tournament"]>;
  return (
    <>
      <Header
        title={t.name}
        detail={`${PHASES[t.phase]} · ${t.played} of ${t.total} matches played`}
      />
      <div className="display-split">
        <Fit className="display-side">
          <h2>Now playing</h2>
          <div className="display-cards">
            {view.stations.map((s) => (
              <StationCard key={s.id} station={s} />
            ))}
          </div>
          {view.upNext.length > 0 && (
            <>
              <h2>Up next</h2>
              <ol className="display-next">
                {view.upNext.map((m) => (
                  <li key={`${m.label}-${m.players.join()}`}>
                    <span className="display-next-label">{m.label}</span>
                    <span>{m.players.join(" vs ")}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Fit>
        <Fit className="display-main">
          {t.phase === "knockout" ? <Bracket view={view} /> : <Groups view={view} />}
        </Fit>
      </div>
    </>
  );
}

function Finished({ view }: { view: DisplayView }) {
  const t = view.tournament as NonNullable<DisplayView["tournament"]>;
  const champion = view.placings?.find((p) => p.from === 1);
  return (
    <>
      <Header title={t.name} detail={t.endedEarly ? "Ended early" : "Finished"} />
      <Fit className="display-finished">
        {champion && (
          <div className="display-champion">
            <p>Champion</p>
            <h2>{champion.name}</h2>
          </div>
        )}
        <div className="display-results">
          {view.placings && (
            <ol className="display-placings">
              {view.placings.map((p) => (
                <li key={p.name}>
                  <span className="placing-place">{place(p.from, p.to)}</span>
                  <span>{p.name}</span>
                </li>
              ))}
            </ol>
          )}
          {view.awards && view.awards.length > 0 && <Awards awards={view.awards} />}
        </div>
      </Fit>
    </>
  );
}

function Idle({ view }: { view: DisplayView }) {
  const cards = (
    <div className={`display-cards ${view.leaderboard.length > 0 ? "" : "wide"}`}>
      {view.stations.map((s) => (
        <StationCard key={s.id} station={s} />
      ))}
    </div>
  );
  return (
    <>
      <Header title="n4-darts" />
      {view.leaderboard.length === 0 ? (
        <Fit className="display-idle">{cards}</Fit>
      ) : (
        <div className="display-split">
          <Fit className="display-side">
            <h2>Stations</h2>
            {cards}
          </Fit>
          <Fit className="display-main">
            <h2>Leaderboard</h2>
            <table className="group-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="name">Player</th>
                  <th>Rating</th>
                  <th>Matches</th>
                  <th>180s</th>
                  <th>High out</th>
                </tr>
              </thead>
              <tbody>
                {view.leaderboard.map((row, i) => (
                  <tr key={row.playerId}>
                    <td>{i + 1}</td>
                    <td className="name">{row.name}</td>
                    <td className="points">{row.rating === null ? "–" : row.rating.toFixed(1)}</td>
                    <td>{row.matches}</td>
                    <td>{row.s180}</td>
                    <td>{row.highestCheckout ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Fit>
        </div>
      )}
    </>
  );
}

function Groups({ view }: { view: DisplayView }) {
  return (
    <div className="display-groups">
      {view.groups.map((group) => (
        <section key={group.name}>
          {view.groups.length > 1 && <h2>{group.name}</h2>}
          <table className="group-table">
            <thead>
              <tr>
                <th>#</th>
                <th className="name">Player</th>
                <th>P</th>
                <th>W</th>
                <th>L</th>
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
                  <td>{row.legDiff > 0 ? `+${row.legDiff}` : row.legDiff}</td>
                  <td className="points">{row.points}</td>
                  <td>{row.average === null ? "–" : row.average.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

/** Winners bracket and final on top, losers bracket below. */
function Bracket({ view }: { view: DisplayView }) {
  const top = view.bracket.filter((c) => c.section !== "losers");
  const losers = view.bracket.filter((c) => c.section === "losers");
  return (
    <div className="display-bracket">
      {[top, losers]
        .filter((row) => row.length > 0)
        .map((row) => (
          <div key={row[0]?.section} className="bracket">
            {row.map((column) => (
              <div
                key={`${column.section}-${column.name}`}
                className={`bracket-round ${column.section}`}
              >
                <h3>{column.name}</h3>
                {column.matches.map((m) => (
                  <MatchCard key={m.slot} match={m} />
                ))}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}

function StationCard({ station }: { station: DisplayStation }) {
  const match = station.match;
  return (
    <a className={`display-card ${match ? "" : "free"}`} href={`/watch/${station.id}`}>
      <div className="display-card-head">
        <span>{station.name}</span>
        {match?.label && <span className="display-card-label">{match.label}</span>}
      </div>
      {!match ? (
        <p className="display-card-note">
          {station.paused ? "Paused" : station.boardOnline ? "Free" : "Board offline"}
        </p>
      ) : match.phase === "notStarted" ? (
        <p className="display-card-note">Next: {match.players.map((p) => p.name).join(" vs ")}</p>
      ) : (
        <Score card={match} />
      )}
    </a>
  );
}

function Score({ card }: { card: ScoreCard }) {
  const total = card.visit.reduce((sum, d) => sum + (d.ignored ? 0 : d.score), 0);
  return (
    <>
      <ul className={`display-score ${card.players.length > 2 ? "display-many" : ""}`}>
        {card.players.map((p, i) => (
          <li
            key={p.name}
            className={`${card.throwing === i ? "throwing" : ""} ${card.winner === i ? "won" : ""}`}
          >
            <span className="display-score-name">{p.name}</span>
            <span className="display-score-legs">{card.legsToWin > 1 ? p.legsWon : ""}</span>
            <span className="display-score-remaining">
              {card.winner === i ? "Won" : p.remaining}
            </span>
          </li>
        ))}
      </ul>
      {card.throwing !== null && (
        <div className="display-visit">
          {[0, 1, 2].map((i) => {
            const dart = card.visit[i];
            return (
              <span key={`dart-${i}`} className={`display-dart ${dart?.ignored ? "ignored" : ""}`}>
                {dart ? dartLabel(dart.segment) : ""}
              </span>
            );
          })}
          <span className="display-visit-total">{card.visit.length > 0 ? total : ""}</span>
        </div>
      )}
    </>
  );
}

/** Shrinks its content to fit the box, so nothing on the projector needs scrolling. */
function Fit({ className, children }: { className: string; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    if (!outer.current || !inner.current) return;
    // The transform doesn't change layout sizes, so these are the unscaled ones.
    const height = inner.current.scrollHeight;
    const width = inner.current.scrollWidth;
    setScale(Math.min(1, outer.current.clientHeight / height, outer.current.clientWidth / width));
  }, []);
  // Every render (new data) and every resize of the box.
  useLayoutEffect(measure);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(measure);
    if (outer.current) observer.observe(outer.current);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div ref={outer} className={`fit ${className}`}>
      <div ref={inner} className="fit-inner" style={{ transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
