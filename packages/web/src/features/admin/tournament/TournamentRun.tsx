import type {
  QueueEntryView,
  TournamentAdminView,
  TournamentProgress,
  TournamentStationView,
} from "@n4/server/api";
import { useState } from "react";
import { ActionMenu } from "../../../components/ActionMenu.tsx";
import { Awards } from "../../../components/Awards.tsx";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { Progress } from "../../../components/Progress.tsx";
import { BracketRows, GroupTables, Placings } from "../../../components/TournamentResults.tsx";
import { usePlayers } from "../../../lib/usePlayers.ts";
import {
  CARD_DETAIL,
  CARD_LIST,
  CARD_MAIN,
  CARD_NAME,
  COUNT,
  cardActions,
  cardRow,
  cardTitle,
  EVEN_COLUMNS,
  runState,
  SECTION,
  STATUS_SMALL,
} from "../ui.ts";

type Send = (method: string, url: string, body?: object) => Promise<boolean>;

const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" });
const PHASES = { groups: "Group phase", knockout: "Knockout", finished: "Finished" };

export function TournamentRun(props: { view: TournamentAdminView; send: Send; onNew(): void }) {
  const { view, send, onNew } = props;
  const tournament = view.tournament as NonNullable<TournamentAdminView["tournament"]>;
  const progress = view.progress as TournamentProgress;
  const live = tournament.status === "running";
  const withdrawn = (playerId: string) =>
    view.entrants.some((e) => e.playerId === playerId && e.withdrawn);

  const base = "/api/admin/tournament";
  const bracketSection = (
    <section className={SECTION}>
      <h2>Knockout</h2>
      <BracketRows bracket={progress.bracket} />
    </section>
  );
  const groupsSection = (
    <section className={SECTION}>
      <h2>Groups</h2>
      {live && progress.phase === "groups" && <LateArrival view={view} send={send} base={base} />}
      <GroupTables
        groups={progress.groups}
        withdrawn={withdrawn}
        actions={
          live
            ? (row) =>
                withdrawn(row.playerId) ? (
                  <span className="label no-underline">Out</span>
                ) : (
                  <ActionMenu
                    label={`Actions for ${row.name}`}
                    items={[
                      {
                        label: "Withdraw",
                        danger: true,
                        run: () => {
                          if (
                            confirm(
                              `Withdraw ${row.name}? Their remaining matches become walkovers.`,
                            )
                          ) {
                            void send("POST", `${base}/withdraw`, { playerId: row.playerId });
                          }
                        },
                      },
                    ]}
                  />
                )
            : undefined
        }
      />
    </section>
  );
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
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
            className="m-0! [--px:1px] [&>div]:w-[min(260px,70vw)]!"
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
              <Placings placings={progress.placings} />
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
        <div className="grid kiosk:grid-cols-2 items-start gap-6 kiosk:[grid-template-areas:'stations_queue'_'groups_queue']">
          <div className="flex min-w-0 flex-col gap-6 kiosk:[grid-area:stations]">
            <section className={SECTION}>
              <h2>Stations</h2>
              <p className="hint m-0">
                Pause keeps a station out of the tournament. Send back returns a waiting match to
                the queue; Hold keeps a match out until you release it.
              </p>
              <ul className={CARD_LIST}>
                {progress.stations.map((s) => (
                  <StationRow key={s.id} station={s} send={send} base={base} />
                ))}
              </ul>
            </section>
          </div>
          <div className="kiosk:row-span-2 flex min-w-0 flex-col gap-6 kiosk:[grid-area:queue]">
            <section className={SECTION}>
              <h2>
                Queue <span className={COUNT}>({progress.queue.length})</span>
              </h2>
              {progress.queue.length === 0 ? (
                <p className="hint">Nothing waiting.</p>
              ) : (
                QUEUE_GROUPS.map(({ title, has }) => {
                  const entries = progress.queue.filter(has);
                  if (entries.length === 0) return null;
                  return (
                    <div key={title} className="flex flex-col gap-2">
                      <h3>
                        {title} ({entries.length})
                      </h3>
                      <ul className={CARD_LIST}>
                        {entries.map((q) => (
                          <QueueRow
                            key={q.matchId}
                            entry={q}
                            stations={progress.stations}
                            send={send}
                            base={base}
                          />
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </section>
          </div>
          <div className="min-w-0 kiosk:[grid-area:groups]">
            {progress.bracket.length > 0 ? bracketSection : groupsSection}
          </div>
        </div>
      )}

      {!live && progress.bracket.length > 0 && bracketSection}

      {(!live || progress.bracket.length > 0) && groupsSection}

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

function StationMatchLine({ match }: { match: NonNullable<TournamentStationView["match"]> }) {
  const name = "font-pixel text-[13px] uppercase tracking-[1px]";
  if (match.winner)
    return (
      <span>
        <span className={name}>{match.winner}</span> won
      </span>
    );
  if (!match.remaining) {
    return (
      <span>
        <span className={name}>{match.players.join(" vs ")}</span> · waiting to start
      </span>
    );
  }
  return (
    <span>
      {match.players.map((player, i) => (
        <span key={player}>
          {i > 0 && <span className="text-muted"> · </span>}
          <span className={name}>{player}</span> {match.remaining?.[i]}
        </span>
      ))}
    </span>
  );
}

function StationRow(props: { station: TournamentStationView; send: Send; base: string }) {
  const { station, send, base } = props;
  const match = station.match;
  const status = station.paused
    ? { text: "Paused", tone: "warn" }
    : !station.boardOnline
      ? { text: "Board offline", tone: "danger" }
      : null;
  return (
    <li className={cardRow()}>
      <div className={CARD_MAIN}>
        <div className={cardTitle()}>
          <span className={CARD_NAME}>{station.name}</span>
          {status && (
            <span className={`status status-${status.tone} ${STATUS_SMALL}`}>{status.text}</span>
          )}
        </div>
        {match ? (
          <span className={CARD_DETAIL}>
            {match.label && <span className="match-label">{match.label}</span>}{" "}
            <StationMatchLine match={match} />
          </span>
        ) : (
          !station.paused && <span className={`status ${STATUS_SMALL} self-start`}>Free</span>
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

const QUEUE_GROUPS: { title: string; has(entry: QueueEntryView): boolean }[] = [
  { title: "Ready", has: (e) => !e.held && e.ready },
  { title: "Waiting for players", has: (e) => !e.held && !e.ready },
  { title: "Held", has: (e) => e.held },
];

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
  const target =
    open.find((s) => s.id === entry.pinnedStation) ??
    (entry.pinnedStation === null ? open[0] : undefined);
  return (
    <li className="flex flex-col gap-3 border border-border border-solid bg-panel p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {entry.label && <span className="match-label">{entry.label}</span>}
        <span className="font-pixel text-[16px] uppercase tracking-[1px]">
          {entry.players.map((p) => p.name).join(" vs ")}
        </span>
      </div>
      <div className="grid grid-cols-2 kiosk:grid-cols-[auto_minmax(0,1fr)_auto] gap-2">
        <button
          type="button"
          className="min-h-11 text-[11px]"
          onClick={() => send("POST", `${url}/hold`, { held: !entry.held })}
        >
          {entry.held ? "Release" : "Hold"}
        </button>
        <select
          aria-label={`Station for ${entry.label || entry.players.map((p) => p.name).join(" vs ")}`}
          className="kiosk:order-none order-first col-span-full kiosk:col-auto min-h-11 text-[20px]"
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
        <button
          type="button"
          className="min-h-11 text-[11px]"
          disabled={!target || !entry.ready}
          title={
            !entry.ready
              ? "Waiting for players: one of them is still playing"
              : target
                ? `Play now on ${target.name}`
                : "No station is free"
          }
          onClick={() => target && send("POST", `${url}/play-now`, { station: target.id })}
        >
          Play now
        </button>
      </div>
    </li>
  );
}

function LateArrival(props: { view: TournamentAdminView; send: Send; base: string }) {
  const { view, send, base } = props;
  const { players } = usePlayers();
  const [late, setLate] = useState("");
  const inIt = new Set(view.entrants.map((e) => e.playerId));
  const available = players?.filter((p) => !inIt.has(p.id)) ?? [];
  if (available.length === 0) return null;
  return (
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
  );
}
