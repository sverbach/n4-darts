import type { LeaderboardRow, PlayerProfile } from "@n4/server/api";
import { type ReactNode, useEffect, useState } from "react";
import { Avatar } from "../../components/Avatar.tsx";
import { Logo } from "../../components/Logo.tsx";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { Heatmap } from "./Heatmap.tsx";

const avg = (value: number | null) => (value === null ? "–" : value.toFixed(1));
const num = (value: number | null) => (value === null ? "–" : String(value));
const place = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const pad2 = (n: number) => String(n).padStart(2, "0");
/** "21 Oct 2026" */
const date = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
/** A day key (YYYY-MM-DD) as a short date. */
const shortDay = (day: string) => date(`${day}T12:00:00`).slice(0, 6);
/** A day key as "Jul 2026". */
const monthOf = (day: string) => date(`${day}T12:00:00`).slice(3);

/** The stats pages' frame: a back link and the logo, then the page. */
function StatsFrame(props: { back: [string, string]; children: ReactNode }) {
  const [href, text] = props.back;
  return (
    <div className="stats-page">
      <header className="stats-bar">
        <div>
          <a className="back" href={href}>
            <PixelIcon name="back" height="0.7em" /> {text}
          </a>
          <Logo width="72px" />
        </div>
      </header>
      <main className="stats">{props.children}</main>
    </div>
  );
}

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
    <StatsFrame back={["/", "n4-darts"]}>
      <div className="stats-title">
        <h1>Players</h1>
        <p className="hint">
          Everyone who has played a counted match. Rating is the 3-dart average over the last 10
          matches.
        </p>
      </div>
      {rows === undefined ? (
        <p className="hint">Loading…</p>
      ) : rows === null ? (
        <p className="error">Couldn't load the stats</p>
      ) : rows.length === 0 ? (
        <p className="hint">No matches played yet.</p>
      ) : (
        <Leaderboard rows={rows} />
      )}
    </StatsFrame>
  );
}

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <>
      <div className="table-scroll stats-table-box">
        <table className="stats-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="name">Player</th>
              <th className="accent" title="3-dart average, last 10 matches">
                Rating
              </th>
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
                <td className={`rank ${i < 3 ? "top" : ""}`}>{i + 1}</td>
                <td className="name">
                  <a href={`/players/${row.playerId}`} className="table-player">
                    <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />
                    {row.name}
                  </a>
                </td>
                <td className="big">{avg(row.rating)}</td>
                <td>{avg(row.average)}</td>
                <td className="muted">{row.matches}</td>
                <td className="muted">{row.matchesWon}</td>
                <td>{row.s180}</td>
                <td>{num(row.highestCheckout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="label narrow-only kiosk:hidden">
        <PixelIcon name="caret" /> Swipe table for more <PixelIcon name="caret" />
      </span>
    </>
  );
}

/** /players/<id>: one player's numbers, their average per evening, tournaments and matches. */
export function ProfilePage({ id }: { id: string }) {
  const profile = useJson<PlayerProfile>(`/api/players/${encodeURIComponent(id)}/stats`);
  return (
    <StatsFrame back={["/players", "Players"]}>
      {profile === undefined ? (
        <p className="hint">Loading…</p>
      ) : profile === null ? (
        <p className="error">No such player</p>
      ) : (
        <Profile profile={profile} />
      )}
    </StatsFrame>
  );
}

function Profile({ profile }: { profile: PlayerProfile }) {
  const t = profile.totals;
  const percent = (part: number, whole: number) =>
    whole === 0 ? "" : ` (${Math.round((part / whole) * 100)}%)`;
  const hero = (
    <section className="profile-hero">
      <span className="profile-photo">
        <Avatar player={{ id: profile.playerId, name: profile.name, photo: profile.photo }} large />
      </span>
      <div>
        {profile.rank !== null && <span className="profile-rank">Rank #{profile.rank}</span>}
        <h1>{profile.name}</h1>
        {profile.since && (
          <span className="label">
            {t.matches} match{t.matches === 1 ? "" : "es"} · since {monthOf(profile.since)}
          </span>
        )}
      </div>
    </section>
  );
  if (t.matches === 0 && profile.tournaments.length === 0) {
    return (
      <>
        {hero}
        <p className="hint">No matches played yet.</p>
      </>
    );
  }
  return (
    <>
      {hero}
      <div className="stat-groups">
        <StatGroup
          title="Average"
          items={[
            { label: "Rating", value: avg(profile.rating), sub: "Last 10 matches", accent: true },
            { label: "3-dart avg", value: avg(t.average), sub: "All time" },
            { label: "First 9", value: avg(t.first9Average), sub: "First 3 visits" },
          ]}
        />
        <StatGroup
          title="Checkouts"
          items={[
            {
              label: "Checkout %",
              value: t.checkoutPercent === null ? "–" : `${t.checkoutPercent.toFixed(0)}%`,
              sub: t.checkoutPercent === null ? "Double out only" : `Of ${t.checkoutAttempts}`,
            },
            { label: "Highest", value: num(t.highestCheckout), sub: "Checkout", accent: true },
            {
              label: "Best leg",
              value: num(t.bestLeg),
              sub: t.bestLeg === 1 ? "Dart" : "Darts",
            },
          ]}
        />
        <StatGroup
          title="Scoring"
          items={[
            { label: "180", value: String(t.s180), sub: "Times", accent: true },
            { label: "140+", value: String(t.s140), sub: "Times" },
            { label: "100+", value: String(t.s100), sub: "Times" },
          ]}
        />
        <StatGroup
          title="Results"
          items={[
            {
              label: "Matches won",
              value: String(t.matchesWon),
              sub: `Of ${t.matches}${percent(t.matchesWon, t.matches)}`,
            },
            { label: "Legs won", value: String(t.legsWon), sub: `Of ${t.legs}` },
            {
              label: "Tournaments",
              value: String(profile.tournamentsWon),
              sub: `Won of ${profile.tournaments.length}`,
              accent: true,
            },
            {
              label: "Best placing",
              value: profile.bestPlacing
                ? place(profile.bestPlacing.from, profile.bestPlacing.to)
                : "–",
              sub: profile.bestPlacing?.tournament ?? "",
            },
          ]}
        />
      </div>

      {t.matches > 0 && (
        <div className="stats-charts">
          {profile.evenings.length > 0 && (
            <section className="stats-section">
              <h2 className="label">Average per evening</h2>
              <AverageChart evenings={profile.evenings} />
            </section>
          )}
          <section className="stats-section">
            <h2 className="label">Where the darts land</h2>
            <Heatmap points={profile.heatmap} />
          </section>
        </div>
      )}

      <div className="stats-lists">
        {profile.tournaments.length > 0 && (
          <section className="stats-section">
            <h2 className="label">Tournaments</h2>
            <ul className="stat-list">
              {profile.tournaments.map((tournament) => (
                <li key={tournament.id}>
                  <div className="stat-list-main">
                    <span>{tournament.name}</span>
                    <span className="stat-list-date">{date(tournament.date)}</span>
                  </div>
                  {tournament.from === 1 && <PixelIcon name="trophy" label="Won" />}
                  <span className={`stat-list-value ${tournament.from === 1 ? "accent" : ""}`}>
                    {place(tournament.from, tournament.to)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile.recent.length > 0 && (
          <section className="stats-section">
            <h2 className="label">Last matches</h2>
            <ul className="stat-list">
              {profile.recent.map((m) => (
                <li key={m.matchId}>
                  <span className={`stat-list-result ${m.won ? "won" : "lost"}`}>
                    {m.won ? "Won" : "Lost"}
                  </span>
                  <div className="stat-list-main">
                    <span>
                      {m.legsFor}–{m.legsAgainst} vs {m.opponents.join(", ")}
                    </span>
                    <span className="stat-list-date">{date(m.date)}</span>
                  </div>
                  <span className="stat-list-value">{avg(m.average)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

interface Stat {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}

function StatGroup({ title, items }: { title: string; items: Stat[] }) {
  return (
    <section className="stat-group">
      <h2 className="label">{title}</h2>
      <dl>
        {items.map((item) => (
          <div key={item.label} className="stat-card">
            <dt>
              <span className="stat-label">{item.label}</span>
              <span className="stat-sub">{item.sub}</span>
            </dt>
            <dd className={item.accent ? "accent" : ""}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** True on a wide screen (the desktop layout). */
function useWide() {
  const query = "(min-width: 760px)";
  const [wide, setWide] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setWide(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return wide;
}

/** A line of the 3-dart average per evening, with the dates below, a value scale, the last one labelled. */
function AverageChart({ evenings }: { evenings: PlayerProfile["evenings"] }) {
  const wide = useWide();
  const points = evenings.flatMap((e) => (e.average === null ? [] : [{ ...e, value: e.average }]));
  if (points.length === 0) return null;
  // Drawn at about its real size, so the text comes out right: a phone's width or the page's.
  // On a wide screen it shares the row with the heatmap: about two thirds of the page.
  const width = wide ? 760 : 358;
  const height = wide ? 300 : 200;
  const font = wide ? 20 : 13;
  const dot = wide ? 10 : 6;
  const pad = wide
    ? { left: 60, right: 30, top: 48, bottom: 40 }
    : { left: 30, right: 16, top: 34, bottom: 26 };
  const values = points.map((p) => p.value);
  // A scale in steps of 5 or 10 around the values, at least 15 tall.
  const step = Math.max(...values) - Math.min(...values) > 30 ? 10 : 5;
  let low = Math.floor(Math.min(...values) / step) * step;
  let high = Math.ceil(Math.max(...values) / step) * step;
  if (high - low < 3 * step) {
    low = Math.max(0, low - step);
    high = low + 3 * step;
  }
  const x = (i: number) =>
    points.length === 1
      ? (pad.left + width - pad.right) / 2
      : pad.left + (i / (points.length - 1)) * (width - pad.left - pad.right);
  const y = (v: number) => pad.top + ((high - v) / (high - low)) * (height - pad.top - pad.bottom);
  const ticks = Array.from({ length: (high - low) / step + 1 }, (_, i) => low + i * step);
  // Every date fits up to about 8 points wide (4 on a phone); beyond that, every n-th one.
  const labelEvery = Math.ceil(points.length / (wide ? 8 : 4));
  const last = points.length - 1;
  const lastPoint = points[last] as (typeof points)[number];
  const tag = `${shortDay(lastPoint.day)} · ${lastPoint.value.toFixed(1)}`;
  const tagWidth = tag.length * font * 0.5 + font;
  const tagX = Math.min(width - tagWidth - 4, Math.max(4, x(last) - tagWidth / 2));

  return (
    <figure className="average-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="3-dart average per evening"
        shapeRendering="crispEdges"
        style={{ fontSize: font }}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              className="chart-grid"
            />
            <text x={pad.left - 12} y={y(tick)} className="axis" textAnchor="end" dy="0.3em">
              {tick}
            </text>
          </g>
        ))}
        <polyline
          className="line"
          points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")}
        />
        {points.map((p, i) => {
          const size = i === last ? dot * 1.4 : dot;
          return (
            <g key={p.day}>
              <rect
                x={x(i) - size / 2}
                y={y(p.value) - size / 2}
                width={size}
                height={size}
                className={i === last ? "dot last" : "dot"}
              >
                <title>
                  {shortDay(p.day)}: {p.value.toFixed(1)} ({p.matches} matches)
                </title>
              </rect>
              {((i % labelEvery === 0 && last - i >= labelEvery / 2) || i === last) && (
                <text x={x(i)} y={height - font * 0.6} className="axis" textAnchor="middle">
                  {shortDay(p.day)}
                </text>
              )}
            </g>
          );
        })}
        <rect x={tagX} y={4} width={tagWidth} height={font * 1.5} className="tag" />
        <text x={tagX + tagWidth / 2} y={4 + font * 1.1} className="tag-text" textAnchor="middle">
          {tag}
        </text>
      </svg>
    </figure>
  );
}
