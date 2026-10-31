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
import {
  badge,
  CARD_DETAIL,
  CARD_LIST,
  CARD_MAIN,
  CARD_NAME,
  COUNT,
  cardActions,
  cardRow,
  cardTitle,
  EVEN_COLUMNS,
  MAIN,
  runState,
  SECTION,
  STATUS_SMALL,
  TABLE_PANEL,
} from "../ui.ts";

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
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1>{tournament.name}</h1>
            {live ? (
              <span className={runState(true)}>Running</span>
            ) : (
              <span className={runState(false)}>
                {progress.endedEarly ? "Ended early" : "Finished"}
              </span>
            )}
          </div>
          {/* While it runs, the squares count the matches; the line says the phase and the end. */}
          <p className="hint m-0">
            {live
              ? [
                  PHASES[progress.phase],
                  progress.expectedEnd && `ends around ${time(progress.expectedEnd)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : `${progress.played} of ${progress.total} matches played`}
          </p>
        </div>
        {live ? (
          <Progress
            played={progress.played}
            total={progress.total}
            className="m-0! w-[min(320px,100%)]! [--px:1px]"
          />
        ) : (
          <button type="button" className="primary cta" onClick={onNew}>
            New tournament <PixelIcon name="arrow" height="0.9em" />
          </button>
        )}
      </header>

      {(progress.placings || (progress.awards && progress.awards.length > 0)) && (
        <div className={EVEN_COLUMNS}>
          {progress.placings && (
            <section className={SECTION}>
              <h2>Final placings</h2>
              {champion && (
                <div className="flex items-center gap-5 border-2 border-accent border-solid bg-accent-tint px-5 kiosk:py-[22px] py-[18px] [--avatar:64px] kiosk:[--avatar:88px]">
                  <Avatar player={champion} large />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="match-label">Champion</span>
                    <span className="wrap-anywhere font-bold font-pixel kiosk:text-[30px] text-[22px] uppercase tracking-[3px]">
                      {champion.name}
                    </span>
                  </div>
                </div>
              )}
              <ol className="m-0 list-none border-0 border-border border-t border-solid p-0">
                {progress.placings
                  .filter((p) => p !== champion)
                  .map((p) => (
                    <li
                      key={p.id}
                      className="flex min-h-[60px] items-center gap-4 border-0 border-line-soft border-b border-solid [--avatar:36px]"
                    >
                      <span className="min-w-14 whitespace-nowrap text-[32px] text-muted">
                        {place(p.from, p.to)}
                      </span>
                      <Avatar player={p} />
                      <span className="font-pixel text-[16px] uppercase tracking-[1px]">
                        {p.name}
                      </span>
                    </li>
                  ))}
              </ol>
            </section>
          )}
          {progress.awards && progress.awards.length > 0 && (
            <section className={SECTION}>
              <h2>Awards</h2>
              <Awards awards={progress.awards} />
            </section>
          )}
        </div>
      )}

      {live && (
        <div className={EVEN_COLUMNS}>
          <div className={MAIN}>
            <section className={SECTION}>
              <h2>Stations</h2>
              <ul className={CARD_LIST}>
                {progress.stations.map((s) => (
                  <StationRow key={s.id} station={s} send={send} base={base} />
                ))}
              </ul>
            </section>
            <section className={SECTION}>
              <h2>
                Queue <span className={COUNT}>({progress.queue.length})</span>
              </h2>
              {progress.queue.length === 0 ? (
                <p className="hint">Nothing waiting.</p>
              ) : (
                <ul className={CARD_LIST}>
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
          <div className={MAIN}>
            <Roster view={view} send={send} base={base} groupPhase={progress.phase === "groups"} />
          </div>
        </div>
      )}

      {progress.bracket.length > 0 && (
        <section className={SECTION}>
          <h2>Knockout</h2>
          <BracketRows bracket={progress.bracket} />
        </section>
      )}

      <section className={SECTION}>
        <h2>Groups</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,480px),1fr))] gap-x-6 gap-y-[18px]">
          {progress.groups.map((group) => (
            <div key={group.name} className="flex min-w-0 flex-col gap-2">
              {progress.groups.length > 1 && <span className="match-label">{group.name}</span>}
              <div className={`table-scroll ${TABLE_PANEL}`}>
                <table className="group-table [--avatar:30px] [&_td:first-child]:pl-3.5 [&_td:first-child]:text-left [&_td:last-child]:pr-3.5 [&_td]:h-[52px] [&_td]:text-[24px] [&_th:first-child]:pl-3.5 [&_th:first-child]:text-left [&_th:last-child]:pr-3.5">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th className="name">Player</th>
                      <th>P</th>
                      <th>W</th>
                      <th>L</th>
                      <th>Legs</th>
                      <th>+/−</th>
                      <th className="text-accent!">Pts</th>
                      <th>Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.table.map((row, i) => (
                      <tr key={row.playerId}>
                        <td className="font-pixel text-[12px]! text-muted">{i + 1}</td>
                        <td className="name">
                          <span className="inline-flex items-center gap-2.5">
                            <Avatar
                              player={{ id: row.playerId, name: row.name, photo: row.photo }}
                            />
                            {row.name}
                          </span>
                        </td>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.lost}</td>
                        <td className="text-muted">
                          {row.legsFor}:{row.legsAgainst}
                        </td>
                        <td>{row.legDiff > 0 ? `+${row.legDiff}` : row.legDiff}</td>
                        <td className="points">{row.points}</td>
                        <td className="text-muted">
                          {row.average === null ? "–" : row.average.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <details className="border border-line-soft border-solid">
                <summary className="px-3.5">
                  <PixelIcon name="caret" /> Matches ({group.fixtures.length})
                </summary>
                <ul>
                  {group.fixtures.map((f) => (
                    <li key={f.slot}>
                      <span className="font-pixel text-[13px] uppercase">
                        {f.players[0]} <span className="text-muted">vs</span> {f.players[1]}
                      </span>
                      <span
                        className={
                          f.legs ? "text-[24px]" : "font-pixel text-[11px] text-muted uppercase"
                        }
                      >
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
        <div className="border-0 border-border border-t border-solid pt-6">
          <button
            type="button"
            className="danger min-h-[52px] px-6"
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
        <div key={row.title} className="flex flex-col gap-2.5">
          {row.title && <span className="match-label">{row.title}</span>}
          <div className="flex gap-6 overflow-x-auto pb-2">
            {row.columns.map((column) => (
              <div
                key={`${column.section}-${column.name}`}
                className="flex w-[260px] flex-none flex-col gap-3"
              >
                <h3 className="text-[11px]">{column.name}</h3>
                <div className="flex flex-1 flex-col justify-around gap-3">
                  {column.matches.map((m) => (
                    <MatchCard key={m.slot} match={m} round={column.name} />
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
    <li className={cardRow()}>
      <div className={CARD_MAIN}>
        <div className={cardTitle()}>
          <span className={CARD_NAME}>{station.name}</span>
          <span className={`status status-${tone} ${STATUS_SMALL}`}>{status}</span>
        </div>
        {match ? (
          <span className={CARD_DETAIL}>
            {match.label && <span className="match-label">{match.label}</span>}{" "}
            {match.players.join(" vs ")}: {match.summary}
          </span>
        ) : (
          <span className={`${CARD_DETAIL} hint`}>
            {station.paused ? "Paused for the tournament" : "Free"}
          </span>
        )}
      </div>
      <div className={cardActions()}>
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
  const [label, tone] = entry.held
    ? ["Held", "warn"]
    : entry.ready
      ? ["Ready", "ok"]
      : ["Waiting for players", ""];
  return (
    <li className="flex flex-col gap-3 border border-border border-solid bg-panel px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="match-label">{entry.label}</span>
        <span className="mt-0 mr-auto mb-0 ml-2 font-pixel text-[15px] uppercase tracking-[1px]">
          {entry.players.map((p) => p.name).join(" vs ")}
        </span>
        <span className={badge(tone as "" | "ok" | "warn")}>{label}</span>
        {pinnedTo && <span className={badge()}>Only {pinnedTo.name}</span>}
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] kiosk:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <button
          type="button"
          className="min-h-11 text-[11px]"
          onClick={() => send("POST", `${url}/hold`, { held: !entry.held })}
        >
          {entry.held ? "Release" : "Hold"}
        </button>
        <select
          aria-label={`Pin ${entry.label} to a station`}
          className="min-h-11 text-[20px]"
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
          // On a phone "Play now on…" gets its own line.
          className="col-span-full kiosk:col-auto min-h-11 text-[20px]"
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
    <section className={SECTION}>
      <h2>
        Players <span className={COUNT}>({view.entrants.length})</span>
      </h2>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-6 gap-y-0 border-0 border-border border-t border-solid p-0">
        {view.entrants.map((e) => (
          <li
            key={e.playerId}
            className="flex min-h-14 items-center gap-3 border-0 border-line-soft border-b border-solid [--avatar:32px]"
          >
            <Avatar player={{ id: e.playerId, name: e.name, photo: e.photo }} />
            <span
              className={`min-w-0 flex-1 font-pixel text-[14px] uppercase tracking-[1px] ${e.withdrawn ? "text-muted line-through" : ""}`}
            >
              {e.name}
            </span>
            {e.withdrawn ? (
              <span className="label">Withdrawn</span>
            ) : (
              <button
                type="button"
                className="ghost min-h-9 px-3 text-[10px]"
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
        <div className="inline-form max-w-[420px]">
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
