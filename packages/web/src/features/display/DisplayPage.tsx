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

/** A column of a heading and its cards or table. */
const SECTION = "flex flex-col gap-pu-14";
const H2 = "font-normal text-muted text-pu-18 tracking-pu-3";
const H2_ACCENT = "font-normal text-accent text-pu-18 tracking-pu-3";
/** The group tables and the leaderboard. */
const TABLE = "w-full border-collapse border border-border border-solid bg-panel avatar-pu-44";
const CELL =
  "border-0 border-b border-solid px-pu-10 whitespace-nowrap first:pl-pu-22 last:pr-pu-22";
/** A header cell: right-aligned and grey unless `look` says otherwise; the first is left-aligned. */
const th = (look = "text-right text-muted first:text-left") =>
  `${CELL} h-pu-50 border-border font-normal font-pixel text-pu-13 uppercase ${look}`;
/** A body cell: its size and colour come with it; right-aligned unless it's the player. */
const td = (extra: string) =>
  `${CELL} h-pu-72 border-line-soft ${extra.includes("text-left") ? "" : "text-right first:text-left"} ${extra}`;
/** The gap is 10 real pixels, not projector units: the old admin.css's `.table-player` always won here. */
const TABLE_PLAYER =
  "inline-flex items-center gap-2.5 font-pixel text-pu-20 uppercase tracking-pu-2";
/** A free station: why it's free. */
const IDLE = { muted: "text-muted", warn: "text-warn", danger: "text-danger" };

/** The projector: the tournament with live station scores, or the stations and the leaderboard. */
export function DisplayPage() {
  const { view, connected } = useLive<DisplayView>("/api/display/live");

  return (
    <main className="flex h-screen flex-col gap-pu-30 overflow-hidden px-pu-56 pt-pu-36 pb-pu-44 text-pu-30 [--px:calc(min(100vw,177.78vh)/1920)]">
      {!view ? (
        <p className="m-auto text-muted text-pu-40">{connected ? "Loading…" : "Connecting…"}</p>
      ) : view.tournament?.phase === "finished" ? (
        <Finished view={view} />
      ) : view.tournament ? (
        <Running view={view} />
      ) : (
        <Idle view={view} />
      )}
      {view && !connected && (
        <p className="status status-danger fixed right-pu-24 bottom-pu-16 m-0">Server offline</p>
      )}
    </main>
  );
}

function Header(props: { title: string; detail: string; played?: number; total?: number }) {
  const { title, detail, played, total } = props;
  return (
    <header className="flex items-center gap-pu-32 border-0 border-border border-b border-solid pb-pu-24">
      <Logo width="4.8em" className="flex-none" />
      <div>
        <h1 className="text-pu-40 tracking-pu-4">{title}</h1>
        <p className="mt-pu-6 mb-0 font-pixel text-muted text-pu-18 uppercase tracking-pu-2">
          {detail}
        </p>
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
      <Header title={t.name} detail={PHASES[t.phase]} played={t.played} total={t.total} />
      <div
        className={`grid min-h-0 flex-1 ${knockout ? "grid-cols-[calc(560*var(--px))_minmax(0,1fr)] gap-pu-48" : "grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-pu-40"}`}
      >
        <Fit>
          <section className={SECTION}>
            <h2 className={H2}>Now playing</h2>
            {view.stations.map((s) => (
              <StationCard key={s.id} station={s} />
            ))}
          </section>
          {view.upNext.length > 0 && (
            <section className={SECTION}>
              <h2 className={H2}>Up next</h2>
              {view.upNext.map((m) => (
                <div
                  key={`${m.label}-${m.players.map((p) => p.id).join()}`}
                  className="avatar-pu-40 flex items-center gap-pu-16 border border-line-soft border-solid px-pu-22 py-pu-14 font-pixel text-pu-20 uppercase tracking-pu-2"
                >
                  {m.label && (
                    <span className="w-pu-220 whitespace-nowrap text-accent text-pu-14 tracking-pu-1">
                      {m.label}
                    </span>
                  )}
                  {m.players.map((p, i) => (
                    <span key={p.id} className="inline-flex items-center gap-pu-16">
                      {i > 0 && <span className="text-muted text-pu-15">vs</span>}
                      <Avatar player={p} />
                      <span>{p.name}</span>
                    </span>
                  ))}
                </div>
              ))}
            </section>
          )}
        </Fit>
        <Fit>{knockout ? <Bracket view={view} /> : <Groups view={view} />}</Fit>
      </div>
    </>
  );
}

function Finished({ view }: { view: DisplayView }) {
  const t = view.tournament as NonNullable<DisplayView["tournament"]>;
  const champion = view.placings?.find((p) => p.from === 1);
  // The champion has the big panel; the list carries on from second place.
  const rest = view.placings?.filter((p) => p !== champion) ?? [];
  return (
    <>
      <Header title={t.name} detail={t.endedEarly ? "Ended early" : "Finished"} />
      <Fit
        className="flex-1"
        inner="grid h-full grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)] gap-pu-48"
      >
        {champion && (
          <section
            className="avatar-pu-268 flex flex-col items-center justify-center gap-pu-28 border-2 border-accent border-solid bg-panel p-pu-40"
            aria-label="Champion"
          >
            <span className="font-pixel text-accent text-pu-22 uppercase tracking-pu-8">
              Champion
            </span>
            <span className="avatar-frame text-pu-26">
              <Avatar player={champion} large />
            </span>
            <p className="m-0 text-center font-bold font-pixel text-pu-64 uppercase tracking-pu-8">
              {champion.name}
            </p>
          </section>
        )}
        {rest.length > 0 && (
          <section className={SECTION}>
            <h2 className={H2}>Final placings</h2>
            <ol className="avatar-pu-56 m-0 list-none border-0 border-border border-t border-solid p-0">
              {rest.map((p) => (
                <li
                  key={p.id}
                  className="flex h-pu-96 items-center gap-pu-22 border-0 border-line-soft border-b border-solid"
                >
                  <span className="w-pu-160 whitespace-nowrap text-muted text-pu-56">
                    {place(p.from, p.to)}
                  </span>
                  <Avatar player={p} />
                  <span className="font-pixel text-pu-28 uppercase tracking-pu-3">{p.name}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {view.awards && view.awards.length > 0 && (
          <section className={SECTION}>
            <h2 className={H2}>Awards</h2>
            <Awards awards={view.awards} projector />
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
      <header className="flex items-center justify-between gap-pu-32">
        <Logo width="7.2em" className="flex-none" />
        <span className="font-pixel text-muted text-pu-18 uppercase tracking-pu-3">
          Darts evening · {today()}
        </span>
      </header>
      {view.leaderboard.length === 0 ? (
        <Fit className="flex-1">
          <section className="grid grid-cols-[repeat(auto-fill,minmax(calc(560*var(--px)),1fr))] gap-pu-14">
            <h2 className={`${H2} col-span-full`}>Stations</h2>
            {cards}
          </section>
        </Fit>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-pu-40">
          <Fit>
            <section className={SECTION}>
              <h2 className={H2}>Stations</h2>
              {cards}
            </section>
          </Fit>
          <Fit>
            <section className={SECTION}>
              <h2 className={H2}>Leaderboard</h2>
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
    <table className={TABLE}>
      <thead>
        <tr>
          <th className={th()}>#</th>
          <th className={th("w-full text-left text-muted")}>Player</th>
          <th className={th("text-right text-accent")}>Rating</th>
          <th className={th()}>M</th>
          <th className={th()}>180s</th>
          <th className={th()}>High out</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.playerId}>
            <td className={td(`font-pixel text-pu-15 ${i < 3 ? "text-accent" : "text-muted"}`)}>
              {i + 1}
            </td>
            <td className={td("w-full text-left text-pu-34")}>
              <span className={TABLE_PLAYER}>
                <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />
                {row.name}
              </span>
            </td>
            <td className={td("text-accent text-pu-40")}>
              {row.rating === null ? "–" : row.rating.toFixed(1)}
            </td>
            <td className={td("text-muted text-pu-34")}>{row.matches}</td>
            <td className={td("text-pu-34")}>{row.s180}</td>
            <td className={td("text-pu-34")}>{row.highestCheckout ?? "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Groups({ view }: { view: DisplayView }) {
  return (
    <div className="flex flex-col gap-pu-28">
      {view.groups.map((group) => (
        <section key={group.name} className={SECTION}>
          <h2 className={H2_ACCENT}>{group.name}</h2>
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={th()}>#</th>
                <th className={th("w-full text-left text-muted")}>Player</th>
                <th className={th()}>P</th>
                <th className={th()}>W</th>
                <th className={th()}>L</th>
                <th className={th()}>Legs</th>
                <th className={th()}>+/−</th>
                <th className={th("text-right text-accent")}>Pts</th>
                <th className={th()}>Avg</th>
              </tr>
            </thead>
            <tbody>
              {group.table.map((row, i) => (
                <tr key={row.playerId}>
                  <td className={td("font-pixel text-muted text-pu-15")}>{i + 1}</td>
                  <td className={td("w-full text-left text-pu-34")}>
                    <span className={TABLE_PLAYER}>
                      <Avatar player={{ id: row.playerId, name: row.name, photo: row.photo }} />
                      {row.name}
                    </span>
                  </td>
                  <td className={td("text-pu-34")}>{row.played}</td>
                  <td className={td("text-pu-34")}>{row.won}</td>
                  <td className={td("text-pu-34")}>{row.lost}</td>
                  <td className={td("text-muted text-pu-34")}>
                    {row.legsFor}–{row.legsAgainst}
                  </td>
                  <td className={td("text-pu-34")}>
                    {row.legDiff > 0 ? `+${row.legDiff}` : row.legDiff}
                  </td>
                  <td className={td("text-accent text-pu-40")}>{row.points}</td>
                  <td className={td("text-muted text-pu-34")}>
                    {row.average === null ? "–" : row.average.toFixed(1)}
                  </td>
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
    <div className="flex flex-col gap-pu-26">
      {rows.map((row) => (
        <section key={row.title} className={SECTION}>
          <h2 className={H2_ACCENT}>{row.title}</h2>
          <div className="flex gap-pu-28">
            {row.columns.map((column) => (
              <div
                key={`${column.section}-${column.name}`}
                className="flex w-pu-330 min-w-0 flex-col gap-pu-14"
              >
                <h3 className="text-muted text-pu-13 tracking-pu-2">{column.name}</h3>
                <div className="flex flex-1 flex-col justify-around gap-pu-14">
                  {column.matches.map((m) => (
                    <MatchCard key={m.slot} match={m} round={column.name} projector />
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
  const border =
    !match && idle.tone === "warn"
      ? "border-warn-line"
      : !match && idle.tone === "danger"
        ? "border-danger-line"
        : "border-border";
  const card = `flex border border-solid ${border} bg-panel text-text no-underline hover:text-accent`;
  const name = `font-pixel text-accent uppercase tracking-pu-2 ${large ? "text-pu-24" : "text-pu-22"}`;

  if (match?.phase === "notStarted" || !match) {
    return (
      <a
        className={`${card} flex-row items-center justify-between gap-pu-16 ${large ? "px-pu-24 py-pu-22" : "px-pu-22 py-pu-16"}`}
        href={`/watch/${station.id}`}
      >
        <span className={name}>{station.name}</span>
        {match ? (
          <span className="font-pixel text-pu-20 uppercase tracking-pu-2">
            <span className="text-muted text-pu-15">Next · </span>
            {match.players.map((p, i) => (
              <span key={p.id}>
                {i > 0 && <span className="text-accent"> vs </span>}
                {p.name}
              </span>
            ))}
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-pu-10 font-pixel text-pu-18 uppercase tracking-pu-2 before:h-pu-10 before:w-pu-10 before:bg-current before:content-[''] ${IDLE[idle.tone as keyof typeof IDLE]}`}
          >
            {idle.text}
          </span>
        )}
      </a>
    );
  }
  return (
    <a className={`${card} flex-col`} href={`/watch/${station.id}`}>
      <div className="flex items-center justify-between gap-pu-16 border-0 border-line-soft border-b border-solid px-pu-22 py-pu-12">
        <span className={name}>{station.name}</span>
        {match.label && (
          <span className="font-pixel text-muted text-pu-15 uppercase tracking-pu-2">
            {match.label}
          </span>
        )}
      </div>
      <Score card={match} large={large ?? false} />
    </a>
  );
}

function Score({ card, large }: { card: ScoreCard; large: boolean }) {
  const total = card.visit.reduce((sum, d) => sum + (d.ignored ? 0 : d.score), 0);
  return (
    <>
      {card.players.map((p, i) => (
        <div
          key={p.id}
          className={`grid items-center gap-pu-16 border-0 border-line-soft border-b border-solid ${large ? "avatar-pu-52 h-pu-76 grid-cols-[calc(56*var(--px))_minmax(0,1fr)_calc(120*var(--px))_calc(140*var(--px))] px-pu-24" : "avatar-pu-46 h-pu-68 grid-cols-[calc(48*var(--px))_minmax(0,1fr)_calc(100*var(--px))_calc(120*var(--px))] px-pu-22"} ${card.throwing === i ? "bg-accent-tint" : ""} ${card.winner === i ? "text-ok" : card.throwing === i ? "text-accent" : ""}`}
        >
          <Avatar player={p} />
          <span
            className={`overflow-hidden text-ellipsis whitespace-nowrap font-pixel uppercase tracking-pu-2 ${large ? "text-pu-24" : "text-pu-22"}`}
          >
            {p.name}
          </span>
          <span className="text-right font-pixel text-muted text-pu-14 uppercase">
            {card.legsToWin > 1 ? `Legs ${p.legsWon}` : ""}
          </span>
          <span className={`text-right leading-[0.8] ${large ? "text-pu-68" : "text-pu-60"}`}>
            {card.winner === i ? "Won" : p.remaining}
          </span>
        </div>
      ))}
      {card.throwing !== null && (
        <div className="flex items-center gap-pu-10 px-pu-22 py-pu-12">
          <span className="mr-pu-6 font-pixel text-muted text-pu-13 uppercase">Visit</span>
          {[0, 1, 2].map((i) => {
            const dart = card.visit[i];
            return (
              <span
                key={`dart-${i}`}
                className={`inline-flex h-pu-46 min-w-pu-88 items-center justify-center border text-pu-34 ${dart ? `border-border border-solid bg-surface ${dart.ignored ? "text-muted line-through" : ""}` : "border-faint border-dashed bg-transparent text-faint"}`}
              >
                {dart ? dartLabel(dart.segment) : "—"}
              </span>
            );
          })}
          <span className="ml-auto font-pixel text-muted text-pu-13 uppercase">
            Total{" "}
            <span className="align-middle font-text text-pu-44 text-text">
              {String(total).padStart(3, "0")}
            </span>
          </span>
        </div>
      )}
    </>
  );
}

/** Shrinks its content to fit the box, so nothing on the projector needs scrolling. */
function Fit({
  className = "",
  inner = "flex flex-col gap-pu-28",
  children,
}: {
  className?: string;
  /** The content's layout: a column by default. */
  inner?: string;
  children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    if (!outer.current || !innerRef.current) return;
    // The transform doesn't change layout sizes, so these are the unscaled ones.
    const height = innerRef.current.scrollHeight;
    const width = innerRef.current.scrollWidth;
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
    <div ref={outer} className={`min-h-0 min-w-0 overflow-hidden ${className}`}>
      <div
        ref={innerRef}
        className={`origin-top-left ${inner}`}
        style={{ transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
