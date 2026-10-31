import type { DisplayStation, DisplayView, LeaderboardRow, ScoreCard } from "@n4/server/api";
import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from "react";
import { Avatar } from "../../components/Avatar.tsx";
import { Awards } from "../../components/Awards.tsx";
import { Logo } from "../../components/Logo.tsx";
import { MatchCard } from "../../components/MatchCard.tsx";
import { Progress } from "../../components/Progress.tsx";
import { dartLabel } from "../../lib/darts.ts";
import { useLive } from "../../lib/useLive.ts";

const PHASES = { groups: "Group phase", knockout: "Knockout", finished: "Finished" };
const place = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** The projector: the tournament with live station scores, or the stations and the leaderboard. */
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
      {view && !connected && <p className="status status-danger display-offline">Server offline</p>}
    </main>
  );
}

function Header(props: { title: string; detail: string; played?: number; total?: number }) {
  const { title, detail, played, total } = props;
  return (
    <header className="display-header">
      <Logo width="4.8em" />
      <div>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
      {total !== undefined && played !== undefined && total > 0 && (
        <Progress played={played} total={total} />
      )}
    </header>
  );
}

function Running({ view }: { view: DisplayView }) {
  const t = view.tournament as NonNullable<DisplayView["tournament"]>;
  const knockout = t.phase === "knockout";
  return (
    <>
      <Header
        title={t.name}
        detail={`${PHASES[t.phase]} · ${t.played} of ${t.total} matches played`}
        played={t.played}
        total={t.total}
      />
      <div className={`display-split ${knockout ? "knockout" : ""}`}>
        <Fit className="display-side">
          <section className="display-section">
            <h2>Now playing</h2>
            {view.stations.map((s) => (
              <StationCard key={s.id} station={s} />
            ))}
          </section>
          {view.upNext.length > 0 && (
            <section className="display-section">
              <h2>Up next</h2>
              {view.upNext.map((m) => (
                <div
                  key={`${m.label}-${m.players.map((p) => p.id).join()}`}
                  className="display-next"
                >
                  <span className="display-next-label">{m.label}</span>
                  {m.players.map((p, i) => (
                    <span key={p.id} className="display-next-player">
                      {i > 0 && <span className="display-vs">vs</span>}
                      <Avatar player={p} />
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              ))}
            </section>
          )}
        </Fit>
        <Fit className="display-main">
          {knockout ? <Bracket view={view} /> : <Groups view={view} />}
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
          <section className="display-champion" aria-label="Champion">
            <span className="display-champion-title">Champion</span>
            <span className="avatar-frame">
              <Avatar player={champion} large />
            </span>
            <p>{champion.name}</p>
          </section>
        )}
        {view.placings && (
          <section className="display-section">
            <h2>Final placings</h2>
            <ol className="display-placings">
              {view.placings.map((p) => (
                <li key={p.id} className={p.from === 1 ? "first" : ""}>
                  <span className="placing-place">{place(p.from, p.to)}</span>
                  <Avatar player={p} />
                  <span className="placing-name">{p.name}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {view.awards && view.awards.length > 0 && (
          <section className="display-section">
            <h2>Awards</h2>
            <Awards awards={view.awards} />
          </section>
        )}
      </Fit>
    </>
  );
}

function Idle({ view }: { view: DisplayView }) {
  const cards = view.stations.map((s) => <StationCard key={s.id} station={s} large />);
  return (
    <>
      <header className="display-header idle">
        <Logo width="7.2em" />
        <span className="label">Darts evening · {today()}</span>
      </header>
      {view.leaderboard.length === 0 ? (
        <Fit className="display-idle">
          <section className="display-section display-cards-wide">
            <h2>Stations</h2>
            {cards}
          </section>
        </Fit>
      ) : (
        <div className="display-split idle">
          <Fit className="display-side">
            <section className="display-section">
              <h2>Stations</h2>
              {cards}
            </section>
          </Fit>
          <Fit className="display-main">
            <section className="display-section">
              <h2>Leaderboard</h2>
              <Leaderboard rows={view.leaderboard} />
            </section>
          </Fit>
        </div>
      )}
    </>
  );
}

function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <table className="display-table">
      <thead>
        <tr>
          <th>#</th>
          <th className="name">Player</th>
          <th className="accent">Rating</th>
          <th>M</th>
          <th>180s</th>
          <th>High out</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.playerId}>
            <td className={`rank ${i < 3 ? "top" : ""}`}>{i + 1}</td>
            <td className="name">
              <span className="table-player">
                <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />
                {row.name}
              </span>
            </td>
            <td className="big">{row.rating === null ? "–" : row.rating.toFixed(1)}</td>
            <td className="muted">{row.matches}</td>
            <td>{row.s180}</td>
            <td>{row.highestCheckout ?? "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Groups({ view }: { view: DisplayView }) {
  return (
    <div className="display-groups">
      {view.groups.map((group) => (
        <section key={group.name} className="display-section">
          <h2 className="accent">{group.name}</h2>
          <table className="display-table">
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
                      <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />
                      {row.name}
                    </span>
                  </td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.lost}</td>
                  <td className="muted">
                    {row.legsFor}–{row.legsAgainst}
                  </td>
                  <td>{row.legDiff > 0 ? `+${row.legDiff}` : row.legDiff}</td>
                  <td className="big">{row.points}</td>
                  <td className="muted">{row.average === null ? "–" : row.average.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

/** The winners bracket and final on top, the losers bracket below. */
function Bracket({ view }: { view: DisplayView }) {
  const top = view.bracket.filter((c) => c.section !== "losers");
  const losers = view.bracket.filter((c) => c.section === "losers");
  const rows = [
    { title: losers.length > 0 ? "Winners bracket" : "Knockout", columns: top },
    { title: "Losers bracket", columns: losers },
  ].filter((row) => row.columns.length > 0);
  return (
    <div className="display-bracket">
      {rows.map((row) => (
        <section key={row.title} className="display-section">
          <h2 className="accent">{row.title}</h2>
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
        </section>
      ))}
    </div>
  );
}

/** A station: its live score, the match waiting on it, or why it's idle. Links to /watch. */
function StationCard({ station, large }: { station: DisplayStation; large?: boolean }) {
  const match = station.match;
  const idle = station.paused
    ? { text: "Paused", tone: "warn" }
    : !station.boardOnline
      ? { text: "Board offline", tone: "danger" }
      : { text: "Free", tone: "muted" };
  const tone = !match && idle.tone !== "muted" ? idle.tone : "";

  if (match?.phase === "notStarted" || !match) {
    return (
      <a
        className={`display-card compact ${tone} ${large ? "large" : ""}`}
        href={`/watch/${station.id}`}
      >
        <span className="display-card-name">{station.name}</span>
        {match ? (
          <span className="display-card-next">
            <span className="display-card-note">Next · </span>
            {match.players.map((p, i) => (
              <span key={p.id}>
                {i > 0 && <span className="display-vs"> vs </span>}
                {p.name}
              </span>
            ))}
          </span>
        ) : (
          <span className={`display-card-idle ${idle.tone}`}>{idle.text}</span>
        )}
      </a>
    );
  }
  return (
    <a className={`display-card ${large ? "large" : ""}`} href={`/watch/${station.id}`}>
      <div className="display-card-head">
        <span className="display-card-name">{station.name}</span>
        {match.label && <span className="display-card-label">{match.label}</span>}
      </div>
      <Score card={match} />
    </a>
  );
}

function Score({ card }: { card: ScoreCard }) {
  const total = card.visit.reduce((sum, d) => sum + (d.ignored ? 0 : d.score), 0);
  return (
    <>
      {card.players.map((p, i) => (
        <div
          key={p.id}
          className={`display-score ${card.throwing === i ? "is-throwing" : ""} ${card.winner === i ? "is-won" : ""}`}
        >
          <Avatar player={p} />
          <span className="display-score-name">{p.name}</span>
          <span className="display-score-legs">
            {card.legsToWin > 1 ? `Legs ${p.legsWon}` : ""}
          </span>
          <span className="display-score-remaining">{card.winner === i ? "Won" : p.remaining}</span>
        </div>
      ))}
      {card.throwing !== null && (
        <div className="display-visit">
          <span className="display-visit-title">Visit</span>
          {[0, 1, 2].map((i) => {
            const dart = card.visit[i];
            return (
              <span
                key={`dart-${i}`}
                className={`display-dart ${dart ? (dart.ignored ? "ignored" : "") : "empty"}`}
              >
                {dart ? dartLabel(dart.segment) : "—"}
              </span>
            );
          })}
          <span className="display-visit-total">
            Total <span>{String(total).padStart(3, "0")}</span>
          </span>
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
