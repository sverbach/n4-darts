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

/** A section of the profile: a heading and its chart or list. */
const SECTION = "flex flex-col gap-2.5";
/** The leaderboard's cells; `look` sets alignment and colour where they differ. */
const CELL =
  "whitespace-nowrap border-0 border-b border-solid px-2 first:pl-4 last:pr-4 kiosk:px-3 kiosk:first:pl-6 kiosk:last:pr-6";
const th = (look = "text-right text-muted first:text-left") =>
  `${CELL} h-11 border-border font-normal font-pixel text-[11px] uppercase kiosk:h-[52px] kiosk:text-[12px] ${look}`;
const td = (look: string) =>
  `${CELL} h-[60px] border-line-soft kiosk:h-[68px] ${look.includes("text-left") ? "" : "text-right first:text-left"} ${look}`;
const NUMBER = "text-[24px] kiosk:text-[26px]";
/** The profile's lists: tournaments and last matches. */
const ROW =
  "flex min-h-16 items-center gap-3.5 border-0 border-line-soft border-b border-solid [&_.pixel-icon]:h-[22px] [&_.pixel-icon]:text-accent";
const ROW_MAIN =
  "flex min-w-0 flex-1 flex-col gap-[3px] font-pixel text-[13px] uppercase tracking-[1px] kiosk:text-[15px]";
const ROW_DATE = "text-[11px] text-muted tracking-normal kiosk:text-[12px]";
const ROW_VALUE = "min-w-12 text-right text-[28px] kiosk:w-[60px] kiosk:text-[32px]";

/** The stats pages' frame: a back link and the logo, then the page. */
function StatsFrame(props: { back: [string, string]; children: ReactNode }) {
  const [href, text] = props.back;
  return (
    <div className="min-h-[100dvh]">
      <header className="border-0 border-border border-b border-solid">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between kiosk:px-8 px-4 kiosk:py-3 py-2">
          <a className="back" href={href}>
            <PixelIcon name="back" height="0.7em" /> {text}
          </a>
          <Logo width="72px" />
        </div>
      </header>
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 kiosk:gap-9 kiosk:px-8 px-4 kiosk:pt-10 pt-6 kiosk:pb-12 pb-10">
        {props.children}
      </main>
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
      <div className="flex flex-col gap-2">
        <h1 className="kiosk:text-[40px]">Players</h1>
        <p className="hint m-0">
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
      <div className="table-scroll border border-border border-solid bg-panel">
        <table className="w-full kiosk:min-w-[860px] min-w-[560px] border-collapse [--avatar:32px] kiosk:[--avatar:40px]">
          <thead>
            <tr>
              <th className={th()}>#</th>
              <th className={th("w-full text-left text-muted")}>Player</th>
              <th className={th("text-right text-accent")} title="3-dart average, last 10 matches">
                Rating
              </th>
              <th className={th()} title="3-dart average, all matches">
                Avg
              </th>
              <th className={th()} title="Matches played">
                M
              </th>
              <th className={th()} title="Matches won">
                W
              </th>
              <th className={th()}>180s</th>
              <th className={th()} title="Highest checkout">
                HC
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.playerId}>
                <td
                  className={td(
                    `font-pixel kiosk:text-[14px] text-[12px] ${i < 3 ? "text-accent" : "text-muted"}`,
                  )}
                >
                  {i + 1}
                </td>
                <td className={td(`w-full text-left ${NUMBER}`)}>
                  <a
                    href={`/players/${row.playerId}`}
                    className="inline-flex min-h-11 items-center gap-3 kiosk:gap-3.5 font-pixel kiosk:text-[16px] text-[13px] uppercase tracking-[1px] no-underline"
                  >
                    <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />
                    {row.name}
                  </a>
                </td>
                <td className={td("kiosk:text-[32px] text-[30px] text-accent")}>
                  {avg(row.rating)}
                </td>
                <td className={td(NUMBER)}>{avg(row.average)}</td>
                <td className={td(`text-muted ${NUMBER}`)}>{row.matches}</td>
                <td className={td(`text-muted ${NUMBER}`)}>{row.matchesWon}</td>
                <td className={td(NUMBER)}>{row.s180}</td>
                <td className={td(NUMBER)}>{num(row.highestCheckout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Meant for phones only, but always shown: the old sheets let it through on wide screens too (kept as is). */}
      <span className="label flex justify-center gap-2 [&>.pixel-icon:first-child]:[transform:scaleX(-1)]">
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
    <section className="flex items-center gap-5 kiosk:gap-8">
      {/* The photo in a framed square with a corner block. */}
      <span className="relative flex-none border-[3px] border-accent border-solid kiosk:p-2 p-1.5 [--avatar:96px] kiosk:[--avatar:138px] after:absolute after:-right-[3px] after:-bottom-[3px] after:size-3.5 kiosk:after:size-[18px] after:bg-accent after:content-[''] [&_.avatar]:flex">
        <Avatar player={{ id: profile.playerId, name: profile.name, photo: profile.photo }} large />
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        {profile.rank !== null && (
          <span className="font-pixel kiosk:text-[13px] text-[11px] text-accent uppercase tracking-[2px]">
            Rank #{profile.rank}
          </span>
        )}
        <h1 className="wrap-anywhere kiosk:text-[56px] text-[34px] kiosk:tracking-[5px] tracking-[3px]">
          {profile.name}
        </h1>
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
      <div className="flex kiosk:grid kiosk:grid-cols-4 flex-col gap-5">
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
        <div className="grid grid-cols-[minmax(0,1fr)] kiosk:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] kiosk:items-start gap-6 kiosk:gap-8 kiosk:[&>:only-child]:col-start-2">
          {profile.evenings.length > 0 && (
            <section className={SECTION}>
              <h2 className="label font-normal">Average per evening</h2>
              <AverageChart evenings={profile.evenings} />
            </section>
          )}
          <section className={SECTION}>
            <h2 className="label font-normal">Where the darts land</h2>
            <Heatmap points={profile.heatmap} />
          </section>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] kiosk:grid-cols-2 gap-6 kiosk:gap-8">
        {profile.tournaments.length > 0 && (
          <section className={SECTION}>
            <h2 className="label font-normal">Tournaments</h2>
            <ul className="m-0 list-none border-0 border-border border-t border-solid p-0">
              {profile.tournaments.map((tournament) => (
                <li key={tournament.id} className={ROW}>
                  <div className={ROW_MAIN}>
                    <span>{tournament.name}</span>
                    <span className={ROW_DATE}>{date(tournament.date)}</span>
                  </div>
                  {tournament.from === 1 && <PixelIcon name="trophy" label="Won" />}
                  <span className={`${ROW_VALUE} ${tournament.from === 1 ? "text-accent" : ""}`}>
                    {place(tournament.from, tournament.to)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile.recent.length > 0 && (
          <section className={SECTION}>
            <h2 className="label font-normal">Last matches</h2>
            <ul className="m-0 list-none border-0 border-border border-t border-solid p-0">
              {profile.recent.map((m) => (
                <li key={m.matchId} className={ROW}>
                  <span
                    className={`kiosk:w-[52px] w-11 font-pixel kiosk:text-[12px] text-[11px] uppercase ${m.won ? "text-ok" : "text-danger"}`}
                  >
                    {m.won ? "Won" : "Lost"}
                  </span>
                  <div className={ROW_MAIN}>
                    <span>
                      {m.legsFor}–{m.legsAgainst} vs {m.opponents.join(", ")}
                    </span>
                    <span className={ROW_DATE}>{date(m.date)}</span>
                  </div>
                  <span className={ROW_VALUE}>{avg(m.average)}</span>
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
    <section className="flex flex-col gap-2">
      <h2 className="label">{title}</h2>
      <dl className="m-0 kiosk:flex grid grid-cols-2 kiosk:flex-col gap-2 kiosk:gap-2.5">
        {items.map((item) => (
          // On a phone: the label, the number, the sub-label below it. On a wide screen: label and
          // sub-label on the left, the number on the right.
          <div
            key={item.label}
            className="flex kiosk:min-h-0 min-h-[92px] kiosk:flex-row flex-col kiosk:items-end justify-between gap-1.5 border border-border border-solid bg-panel kiosk:px-4 px-3 kiosk:py-3.5 py-2.5"
          >
            <dt className="kiosk:flex contents kiosk:flex-col kiosk:gap-1">
              <span className="font-pixel kiosk:text-[12px] text-[11px] text-muted uppercase">
                {item.label}
              </span>
              <span className="order-3 font-pixel kiosk:text-faint text-[11px] text-muted uppercase">
                {item.sub}
              </span>
            </dt>
            <dd
              className={`order-2 m-0 kiosk:text-[48px] text-[40px] kiosk:leading-[0.8] leading-[0.85] ${item.accent ? "text-accent" : ""}`}
            >
              {item.value}
            </dd>
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
    <figure className="m-0 border border-border border-solid bg-panel px-0 pt-3 pb-1">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="3-dart average per evening"
        className="block h-auto w-full font-text"
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
              className="stroke-line-soft"
            />
            <text x={pad.left - 12} y={y(tick)} className="fill-muted" textAnchor="end" dy="0.3em">
              {tick}
            </text>
          </g>
        ))}
        <polyline
          className="fill-none stroke-3 stroke-accent"
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
                className={i === last ? "fill-text" : "fill-accent"}
              >
                <title>
                  {shortDay(p.day)}: {p.value.toFixed(1)} ({p.matches} matches)
                </title>
              </rect>
              {((i % labelEvery === 0 && last - i >= labelEvery / 2) || i === last) && (
                <text x={x(i)} y={height - font * 0.6} className="fill-muted" textAnchor="middle">
                  {shortDay(p.day)}
                </text>
              )}
            </g>
          );
        })}
        <rect x={tagX} y={4} width={tagWidth} height={font * 1.5} className="fill-accent" />
        <text
          x={tagX + tagWidth / 2}
          y={4 + font * 1.1}
          className="fill-accent-text uppercase"
          textAnchor="middle"
        >
          {tag}
        </text>
      </svg>
    </figure>
  );
}
