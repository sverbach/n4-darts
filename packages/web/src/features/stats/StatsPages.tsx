import type { LeaderboardRow, PlayerProfile } from "@n4/server/api";
import { Link } from "wouter";
import { Avatar, isHiddenPlayer } from "../../components/Avatar.tsx";
import { LineChart } from "../../components/charts/LineChart.tsx";
import { dayDate } from "../../components/charts/scales.ts";
import { PixelIcon } from "../../components/PixelIcon.tsx";
import { average, count, legScore, NONE, placing } from "../../lib/format.ts";
import { usePublicSite } from "../../lib/publicSite.ts";
import { useFetch } from "../../lib/useFetch.ts";
import {
  date,
  monthOf,
  ROW,
  ROW_DATE,
  ROW_MAIN,
  ROW_VALUE,
  SECTION,
  StatsFrame,
  shortDay,
} from "./frame.tsx";
import { Heatmap } from "./Heatmap.tsx";

const RATING_MATCHES = 10;

/** The leaderboard's cells; `look` sets alignment and colour where they differ. */
const CELL =
  "whitespace-nowrap border-0 border-b border-solid px-2 first:pl-4 last:pr-4 kiosk:px-3 kiosk:first:pl-6 kiosk:last:pr-6";
const th = (look = "text-right text-muted first:text-left") =>
  `${CELL} h-11 border-border font-normal font-pixel text-[11px] uppercase kiosk:h-[52px] kiosk:text-[12px] ${look}`;
const td = (look: string) =>
  `${CELL} h-[60px] border-line-soft kiosk:h-[68px] ${look.includes("text-left") ? "" : "text-right first:text-left"} ${look}`;
const NUMBER = "text-[24px] kiosk:text-[26px]";

/** /players: everyone with a counted match, best rating first. */
export function LeaderboardPage() {
  // Read once: the stats pages don't follow live, by design (VIEW-01).
  const { data: rows, error } = useFetch<LeaderboardRow[]>("/api/players/stats");
  return (
    <StatsFrame back={usePublicSite() ? null : ["/", "Home"]}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4">
          <h1 className="kiosk:text-[40px]">Players</h1>
          <Link className="back" href="/tournaments">
            Tournaments <PixelIcon name="arrow" height="0.7em" />
          </Link>
        </div>
        <p className="hint m-0">
          Everyone who has played a counted match. Rating is the 3-dart average over the last 10
          matches.
        </p>
      </div>
      {error ? (
        <p className="error" role="alert">
          Couldn't load the stats: {error}
        </p>
      ) : !rows ? (
        <p className="hint">Loading…</p>
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
    <div className="scroll-x border border-border border-solid">
      <table className="w-full kiosk:min-w-[860px] border-collapse [--avatar:32px] kiosk:[--avatar:40px]">
        <thead>
          <tr>
            <th className={th()}>#</th>
            <th className={th("w-full text-left text-muted")}>Player</th>
            <th className={th("text-right text-muted")} title="3-dart average, last 10 matches">
              Rating
            </th>
            <th className={`${th()} max-kiosk:hidden`} title="3-dart average, all matches">
              Avg
            </th>
            <th className={th()} title="Matches played">
              M
            </th>
            <th className={`${th()} max-kiosk:hidden`} title="Matches won">
              W
            </th>
            <th className={`${th()} max-kiosk:hidden`}>180s</th>
            <th className={th()} title="Highest checkout">
              High out
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.playerId}>
              <td className={td(`font-pixel kiosk:text-[13px] text-[12px] text-muted`)}>{i + 1}</td>
              <td className={td(`w-full text-left ${NUMBER}`)}>
                {isHiddenPlayer(row.playerId) ? (
                  <span className={`${PLAYER_CELL} text-muted`}>
                    <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />
                    {row.name}
                  </span>
                ) : (
                  <Link href={`/players/${row.playerId}`} className={`${PLAYER_CELL} no-underline`}>
                    <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />
                    {row.name}
                  </Link>
                )}
              </td>
              <td className={td("kiosk:text-[32px] text-[28px] text-text")}>
                {average(row.rating)}
              </td>
              <td
                className={td(
                  `max-kiosk:hidden ${NUMBER} ${row.matches <= 10 ? "text-muted" : ""}`,
                )}
                title={row.matches <= 10 ? "The same as the rating until 10 matches" : undefined}
              >
                {average(row.average)}
              </td>
              <td className={td(NUMBER)}>{row.matches}</td>
              <td className={td(`max-kiosk:hidden ${NUMBER}`)}>{row.matchesWon}</td>
              <td className={td(`max-kiosk:hidden ${NUMBER}`)}>{row.s180}</td>
              <td className={td(NUMBER)}>{count(row.highestCheckout)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** /players/<id>: one player's numbers, their average per day, tournaments and matches. */
export function ProfilePage({ id }: { id: string }) {
  const {
    data: profile,
    error,
    status,
  } = useFetch<PlayerProfile>(`/api/players/${encodeURIComponent(id)}/stats`);
  return (
    <StatsFrame back={["/players", "Players"]}>
      {error ? (
        <p className="error" role="alert">
          {status === 404 ? "No such player" : `Couldn't load the stats: ${error}`}
        </p>
      ) : !profile ? (
        <p className="hint">Loading…</p>
      ) : (
        <Profile profile={profile} />
      )}
    </StatsFrame>
  );
}

function Profile({ profile }: { profile: PlayerProfile }) {
  const t = profile.totals;
  const percent = (part: number, whole: number) =>
    whole === 0 ? "" : `${Math.round((part / whole) * 100)}%`;
  const hero = (
    <section className="flex items-center gap-4 kiosk:gap-6">
      <span className="flex-none [--avatar:96px] kiosk:[--avatar:138px] [&_.avatar]:flex">
        <Avatar player={{ id: profile.playerId, name: profile.name, photo: profile.photo }} large />
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <h1 className="wrap-anywhere kiosk:text-[56px] text-[32px] kiosk:tracking-[5px] tracking-[3px]">
          {profile.name}
        </h1>
        {(profile.rank !== null || profile.since) && (
          <span className="label">
            {[
              profile.rank !== null && `Rank #${profile.rank}`,
              profile.since &&
                `${t.matches} match${t.matches === 1 ? "" : "es"} · since ${monthOf(profile.since)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
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
      <div className="flex kiosk:grid kiosk:grid-cols-4 flex-col gap-6 kiosk:gap-4">
        <StatGroup
          title="Average"
          items={[
            {
              label: "Rating",
              value: average(profile.rating),
              sub: t.matches > RATING_MATCHES ? "Last 10 matches" : "All matches",
            },
            ...(t.matches > RATING_MATCHES
              ? [{ label: "3-dart avg", value: average(t.average), sub: "All time" }]
              : []),
            { label: "First 9", value: average(t.first9Average), sub: "First 3 visits" },
          ]}
        />
        <StatGroup
          title="Checkouts"
          items={[
            {
              label: "Checkout %",
              value: t.checkoutPercent === null ? NONE : `${t.checkoutPercent.toFixed(0)}%`,
              sub:
                t.checkoutPercent === null ? "Double out only" : `Of ${t.checkoutAttempts} darts`,
            },
            { label: "High out", value: count(t.highestCheckout) },
            {
              label: "Best leg",
              value: count(t.bestLeg),
              sub: t.bestLeg === null ? "" : t.bestLeg === 1 ? "Dart" : "Darts",
            },
          ]}
        />
        <StatGroup
          title="Scoring"
          items={[
            { label: "180s", value: String(t.s180) },
            { label: "140+", value: String(t.s140) },
            { label: "100+", value: String(t.s100) },
          ]}
        />
        <StatGroup
          title="Results"
          items={[
            {
              label: "Matches won",
              value: String(t.matchesWon),
              sub: percent(t.matchesWon, t.matches),
            },
            { label: "Legs won", value: String(t.legsWon), sub: `Of ${t.legs}` },
            {
              label: "Tournaments won",
              value: String(profile.tournamentsWon),
              sub: `Of ${profile.tournaments.length}`,
            },
          ]}
        />
      </div>

      {t.matches > 0 && (
        <div className="grid grid-cols-[minmax(0,1fr)] kiosk:grid-cols-4 kiosk:items-stretch gap-6 kiosk:gap-4 kiosk:[&>:first-child:not(:only-child)]:col-span-3 kiosk:[&>:only-child]:col-start-4">
          {profile.days.length > 0 && (
            <section className={SECTION}>
              <h2 className="label font-normal">Average per day</h2>
              <AverageChart days={profile.days} />
            </section>
          )}
          <section className={SECTION}>
            <h2 className="label font-normal">Where the darts land</h2>
            <Heatmap points={profile.heatmap} />
          </section>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] kiosk:grid-cols-4 gap-6 kiosk:gap-4 kiosk:[&>*]:col-span-2 kiosk:[&>:only-child]:col-span-4">
        {profile.tournaments.length > 0 && (
          <section className={SECTION}>
            <h2 className="label font-normal">Tournaments</h2>
            <ul className="m-0 list-none border-0 border-border border-t border-solid p-0">
              {profile.tournaments.map((tournament) => (
                <li key={tournament.id}>
                  <Link href={`/tournaments/${tournament.id}`} className={`${ROW} no-underline`}>
                    <div className={ROW_MAIN}>
                      <span>{tournament.name}</span>
                      <span className={ROW_DATE}>{date(tournament.date)}</span>
                    </div>
                    {tournament.from === 1 && <PixelIcon name="trophy" label="Won" />}
                    <span className={ROW_VALUE}>{placing(tournament.from, tournament.to)}</span>
                  </Link>
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
                <li key={m.matchId}>
                  <Link href={`/matches/${m.matchId}`} className={`${ROW} no-underline`}>
                    <span
                      className={`kiosk:w-[52px] w-11 font-pixel kiosk:text-[12px] text-[11px] uppercase ${m.won ? "text-text" : "text-muted"}`}
                    >
                      {m.won ? "Won" : "Lost"}
                    </span>
                    <div className={ROW_MAIN}>
                      <span>
                        {legScore([m.legsFor, m.legsAgainst])} vs {m.opponents.join(", ")}
                      </span>
                      <span className={ROW_DATE}>{date(m.date)}</span>
                    </div>
                    <span className={ROW_VALUE}>{average(m.average)}</span>
                  </Link>
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
  sub?: string;
}

function StatGroup({ title, items }: { title: string; items: Stat[] }) {
  const columns =
    items.length === 4 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <section className="flex flex-col gap-2">
      <h2 className="label">{title}</h2>
      <dl className={`m-0 grid ${columns} kiosk:flex kiosk:flex-1 kiosk:flex-col gap-2`}>
        {items.map((item) => (
          // On a phone: the label, the number, the sub-label below it. On a wide screen: label and
          // sub-label on the left, the number on the right.
          <div
            key={item.label}
            className="flex kiosk:min-h-0 min-h-[92px] kiosk:flex-1 kiosk:flex-row flex-col kiosk:items-stretch kiosk:justify-between gap-2 border border-border border-solid bg-panel kiosk:px-4 px-3 kiosk:py-3 py-2"
          >
            <dt className="kiosk:flex contents kiosk:flex-col kiosk:justify-between kiosk:gap-1.5">
              <span className="font-pixel kiosk:text-[12px] text-[11px] text-muted uppercase">
                {item.label}
              </span>
              {item.sub && (
                <span className="order-3 kiosk:mt-0 mt-auto font-pixel text-[11px] text-muted uppercase">
                  {item.sub}
                </span>
              )}
            </dt>
            <dd className="order-2 m-0 kiosk:self-end kiosk:text-[48px] text-[32px] kiosk:leading-[0.8] leading-[0.85]">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const PLAYER_CELL =
  "inline-flex min-h-11 items-center gap-3 kiosk:gap-3 font-pixel kiosk:text-[16px] text-[13px] uppercase tracking-[1px]";

/** True on a wide screen (the desktop layout). */

function AverageChart({ days }: { days: PlayerProfile["days"] }) {
  const points = days.flatMap((d) =>
    d.average === null
      ? []
      : [
          {
            key: d.day,
            x: dayDate(d.day),
            y: d.average,
            axisLabel: shortDay(d.day),
            tooltip: `${date(`${d.day}T12:00:00`)} · ${d.average.toFixed(1)} avg · ${d.matches} ${d.matches === 1 ? "match" : "matches"}`,
          },
        ],
  );
  if (points.length === 0) return null;
  if (points.length === 1) {
    const only = points[0] as (typeof points)[number];
    return (
      <p className="m-0 flex flex-1 items-center gap-3 border border-border border-solid bg-panel p-4">
        <span className="text-[48px] leading-[0.85]">{only.y.toFixed(1)}</span>
        <span className="label">{only.axisLabel}</span>
      </p>
    );
  }
  return <LineChart points={points} label="3-dart average per day" format={(v) => v.toFixed(1)} />;
}
