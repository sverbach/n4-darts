import type { LeaderboardRow, PlayerProfile } from "@n4/server/api";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar.tsx";

const avg = (value: number | null) => (value === null ? "–" : value.toFixed(1));
const num = (value: number | null) => (value === null ? "–" : String(value));
const place = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
const date = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
/** A day key (YYYY-MM-DD) as a short date. */
const shortDay = (day: string) =>
  new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

/** Loads JSON once; `undefined` while loading, `null` if it failed. */
function useJson<T>(url: string) {
  const [data, setData] = useState<T | null | undefined>(undefined);
  useEffect(() => {
    void (async () => {
      const res = await fetch(url).catch(() => null);
      setData(res?.ok ? await res.json() : null);
    })();
  }, [url]);
  return data;
}

/** /players: everyone with a counted match, best rating first. */
export function LeaderboardPage() {
  const rows = useJson<LeaderboardRow[]>("/api/players/stats");
  return (
    <main className="stats">
      <a className="back" href="/">
        ← n4-darts
      </a>
      <h1>Players</h1>
      {rows === undefined ? (
        <p className="hint">Loading…</p>
      ) : rows === null ? (
        <p className="error">Couldn't load the stats</p>
      ) : rows.length === 0 ? (
        <p className="hint">No matches played yet.</p>
      ) : (
        <Leaderboard rows={rows} />
      )}
    </main>
  );
}

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="table-scroll">
      <table className="group-table leaderboard">
        <thead>
          <tr>
            <th>#</th>
            <th className="name">Player</th>
            <th title="3-dart average, last 10 matches">Rating</th>
            <th title="3-dart average, all matches">Avg</th>
            <th title="Matches played">M</th>
            <th title="Matches won">W</th>
            <th>180s</th>
            <th title="Highest checkout">HC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.playerId}>
              <td>{i + 1}</td>
              <td className="name">
                <a href={`/players/${row.playerId}`}>
                  <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />{" "}
                  {row.name}
                </a>
              </td>
              <td className="points">{avg(row.rating)}</td>
              <td>{avg(row.average)}</td>
              <td>{row.matches}</td>
              <td>{row.matchesWon}</td>
              <td>{row.s180}</td>
              <td>{num(row.highestCheckout)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** /players/<id>: one player's numbers, their average per evening, tournaments and matches. */
export function ProfilePage({ id }: { id: string }) {
  const profile = useJson<PlayerProfile>(`/api/players/${encodeURIComponent(id)}/stats`);
  return (
    <main className="stats">
      <a className="back" href="/players">
        ← Players
      </a>
      {profile === undefined ? (
        <p className="hint">Loading…</p>
      ) : profile === null ? (
        <p className="error">No such player</p>
      ) : (
        <Profile profile={profile} />
      )}
    </main>
  );
}

function Profile({ profile }: { profile: PlayerProfile }) {
  const t = profile.totals;
  const percent = (part: number, whole: number) =>
    whole === 0 ? "" : ` (${Math.round((part / whole) * 100)}%)`;
  if (t.matches === 0 && profile.tournaments.length === 0) {
    return (
      <>
        <h1>{profile.name}</h1>
        <p className="hint">No matches played yet.</p>
      </>
    );
  }
  return (
    <>
      <h1 className="profile-name">
        <Avatar player={{ id: profile.playerId, name: profile.name, photo: profile.photo }} large />
        {profile.name}
      </h1>
      <div className="stat-groups">
        <StatGroup
          title="Average"
          items={[
            ["Rating (last 10)", avg(profile.rating)],
            ["3-dart average", avg(t.average)],
            ["First 9", avg(t.first9Average)],
          ]}
        />
        <StatGroup
          title="Checkouts"
          items={[
            [
              "Checkout %",
              t.checkoutPercent === null
                ? "–"
                : `${t.checkoutPercent.toFixed(0)}% of ${t.checkoutAttempts}`,
            ],
            ["Highest checkout", num(t.highestCheckout)],
            [
              "Best leg",
              t.bestLeg === null ? "–" : `${t.bestLeg} dart${t.bestLeg === 1 ? "" : "s"}`,
            ],
          ]}
        />
        <StatGroup
          title="Scoring"
          items={[
            ["180", String(t.s180)],
            ["140+", String(t.s140)],
            ["100+", String(t.s100)],
          ]}
        />
        <StatGroup
          title="Results"
          items={[
            ["Matches won", `${t.matchesWon} of ${t.matches}${percent(t.matchesWon, t.matches)}`],
            ["Legs won", `${t.legsWon} of ${t.legs}${percent(t.legsWon, t.legs)}`],
            ["Tournaments won", `${profile.tournamentsWon} of ${profile.tournaments.length}`],
            [
              "Best placing",
              profile.bestPlacing ? place(profile.bestPlacing.from, profile.bestPlacing.to) : "–",
            ],
          ]}
        />
      </div>

      {profile.evenings.length > 0 && (
        <section>
          <h2>Average per evening</h2>
          <AverageChart evenings={profile.evenings} />
        </section>
      )}

      {profile.tournaments.length > 0 && (
        <section>
          <h2>Tournaments</h2>
          <ul className="stat-list">
            {profile.tournaments.map((tournament) => (
              <li key={tournament.id}>
                <span className="stat-list-main">{tournament.name}</span>
                <span className="stat-list-date">{date(tournament.date)}</span>
                <span className="stat-list-value">
                  {place(tournament.from, tournament.to)}
                  {tournament.from === 1 && " 🏆"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.recent.length > 0 && (
        <section>
          <h2>Last matches</h2>
          <ul className="stat-list">
            {profile.recent.map((m) => (
              <li key={m.matchId}>
                <span className="stat-list-main">
                  {m.won ? "Won" : "Lost"} {m.legsFor}–{m.legsAgainst} vs {m.opponents.join(", ")}
                </span>
                <span className="stat-list-date">{date(m.date)}</span>
                <span className="stat-list-value">{avg(m.average)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function StatGroup({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <section className="stat-group">
      <h2>{title}</h2>
      <dl>
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** A line of the 3-dart average per evening, with the dates below and a value scale. */
function AverageChart({ evenings }: { evenings: PlayerProfile["evenings"] }) {
  const points = evenings.flatMap((e) => (e.average === null ? [] : [{ ...e, value: e.average }]));
  if (points.length === 0) return null;
  // About a phone's width, so the text comes out at its real size there.
  const width = 360;
  const height = 200;
  const pad = { left: 32, right: 24, top: 10, bottom: 26 };
  const values = points.map((p) => p.value);
  // A scale in steps of 10 around the values, at least 20 tall.
  let low = Math.floor(Math.min(...values) / 10) * 10;
  let high = Math.ceil(Math.max(...values) / 10) * 10;
  if (high - low < 20) {
    low = Math.max(0, low - 10);
    high = low + 20;
  }
  const x = (i: number) =>
    points.length === 1
      ? (pad.left + width - pad.right) / 2
      : pad.left + (i / (points.length - 1)) * (width - pad.left - pad.right);
  const y = (v: number) => pad.top + ((high - v) / (high - low)) * (height - pad.top - pad.bottom);
  const ticks = Array.from({ length: Math.floor((high - low) / 10) + 1 }, (_, i) => low + i * 10);
  const step = high - low > 60 ? 2 : 1; // Fewer labels on a tall scale.
  // Every date fits up to about 5 points; beyond that, every n-th one.
  const labelEvery = Math.ceil(points.length / 5);

  return (
    <svg
      className="average-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="3-dart average per evening"
    >
      {ticks.map((tick, i) => (
        <g key={tick}>
          <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="grid" />
          {i % step === 0 && (
            <text x={pad.left - 6} y={y(tick)} className="axis" textAnchor="end" dy="0.35em">
              {tick}
            </text>
          )}
        </g>
      ))}
      <polyline className="line" points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")} />
      {points.map((p, i) => (
        <g key={p.day}>
          <circle cx={x(i)} cy={y(p.value)} r={4} className="dot">
            <title>
              {shortDay(p.day)}: {p.value.toFixed(1)} ({p.matches} matches)
            </title>
          </circle>
          {i % labelEvery === 0 && (
            <text x={x(i)} y={height - 8} className="axis" textAnchor="middle">
              {shortDay(p.day)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
