import type { TournamentAdminView, TournamentConfig } from "@n4/server/api";
import { useState } from "react";
import { Avatar } from "../../../components/Avatar.tsx";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { PlayerPicker } from "../../../components/PlayerPicker.tsx";
import { request } from "../../../lib/api.ts";
import { useLive } from "../../../lib/useLive.ts";
import {
  ASIDE,
  COLUMNS,
  CONTROLS,
  CONTROLS_CTA,
  COUNT,
  FIELD,
  HEAD,
  MAIN,
  RULED,
  SECTION,
  SECTION_HEAD,
} from "../ui.ts";
import { TournamentRun } from "./TournamentRun.tsx";

/** The seed list's up and down buttons. */
const SEED_MOVE = "w-11 bg-transparent p-0 text-[21px]";

/** "about 45 min", "about 2 h 30". */
export function formatMinutes(minutes: number) {
  const rounded = Math.max(5, Math.round(minutes / 5) * 5);
  if (rounded < 60) return `about ${rounded} min`;
  const rest = rounded % 60;
  return `about ${Math.floor(rounded / 60)} h${rest ? ` ${String(rest).padStart(2, "0")}` : ""}`;
}

const groupName = (group: number) => String.fromCharCode(65 + group);
const bestOf = (legsToWin: number) => `Best of ${legsToWin * 2 - 1}`;

/** "Saving…" while a change is on its way, "Saved" once the server has it. */
type SaveState = "idle" | "saving" | "saved";

/** Follows the active tournament live and sends changes; the server pushes the fresh view. */
function useTournament() {
  const live = useLive<TournamentAdminView>("/api/admin/tournament/live");
  const [error, setError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>("idle");

  const send = async (method: string, url: string, body?: object) => {
    setSave("saving");
    const message = await request(method, url, body);
    setError(message);
    setSave(message ? "idle" : "saved");
    return message === null;
  };
  return {
    view: live.view,
    error: error ?? (live.failed ? "Couldn't load the tournament" : null),
    save,
    send,
  };
}

export function TournamentAdmin() {
  const { view, error, save, send } = useTournament();
  // After a finished tournament, "New tournament" switches to the create form.
  const [creating, setCreating] = useState(false);
  const finished = view?.tournament?.status === "finished";
  return (
    <div className="flex flex-col gap-7">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!view ? (
        <p className="hint">Loading…</p>
      ) : !view.tournament || (finished && creating) ? (
        <CreateTournament
          send={async (...args) => {
            const ok = await send(...args);
            if (ok) setCreating(false);
            return ok;
          }}
        />
      ) : view.tournament.status === "draft" ? (
        <DraftEditor view={view} send={send} save={save} />
      ) : (
        <TournamentRun view={view} send={send} onNew={() => setCreating(true)} />
      )}
    </div>
  );
}

type Send = (method: string, url: string, body?: object) => Promise<boolean>;

function CreateTournament({ send }: { send: Send }) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const create = () => send("POST", "/api/admin/tournament", { name, playerIds: picked });
  return (
    <>
      <div className={HEAD}>
        <h1>Tournament</h1>
        <p className="hint">One tournament at a time. Set it up here, then the stations play it.</p>
      </div>
      <div className={COLUMNS}>
        <div className={MAIN}>
          <label className={FIELD}>
            Name
            <input
              placeholder="Today's date"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <PlayerPicker
            title="Who's playing?"
            picked={picked}
            onChange={setPicked}
            max={Number.POSITIVE_INFINITY}
          />
        </div>
        <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-[18px] border border-border border-solid bg-panel p-6">
          <span className="label">New tournament</span>
          <div className="flex items-baseline gap-3">
            <span className="text-[72px] text-accent leading-[0.8]">{picked.length}</span>
            <span className="label">Players picked</span>
          </div>
          <p className="hint m-0">
            Format, legs and seeds come next in the draft. Nothing starts until you press Start.
          </p>
          <button
            type="button"
            className="primary cta"
            disabled={picked.length === 0}
            onClick={create}
          >
            Create draft <PixelIcon name="arrow" height="0.9em" />
          </button>
        </aside>
      </div>
    </>
  );
}

function DraftEditor(props: { view: TournamentAdminView; send: Send; save: SaveState }) {
  const { view, send, save } = props;
  const tournament = view.tournament as NonNullable<TournamentAdminView["tournament"]>;
  const { format, legs, x01 } = tournament.config;
  const [name, setName] = useState(tournament.name);
  const patch = (body: object) => send("PATCH", "/api/admin/tournament", body);
  const config = (section: keyof TournamentConfig, values: object) =>
    patch({ config: { [section]: values } });
  const order = view.entrants.map((e) => e.playerId);
  const move = (from: number, to: number) => {
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved as string);
    void patch({ seedOrder: next });
  };
  const nameOf = (id: string) => view.entrants.find((e) => e.playerId === id)?.name ?? "?";

  return (
    <>
      <div className={HEAD}>
        <div className="flex items-center gap-4">
          <span className="match-label">Draft</span>
          {save !== "idle" && (
            <span
              className={`inline-flex items-center gap-1.5 font-pixel kiosk:text-[12px] text-[11px] uppercase ${save === "saved" ? "text-ok before:size-[7px] before:bg-current before:content-['']" : "text-muted"}`}
            >
              {save === "saving" ? "Saving…" : "Saved"}
            </span>
          )}
        </div>
        <h1>Tournament</h1>
        <p className="hint">
          Every change saves right away. Start when the problems list is clear.
        </p>
      </div>
      <div className={COLUMNS}>
        <div className={MAIN}>
          <label className={FIELD}>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name !== tournament.name && patch({ name })}
            />
          </label>

          <section className={SECTION}>
            <h2>
              Players <span className={COUNT}>({view.entrants.length})</span>
            </h2>
            <PlayerPicker
              picked={order}
              onChange={(playerIds) => patch({ playerIds })}
              max={Number.POSITIVE_INFINITY}
            />
          </section>

          <section className={RULED}>
            <h2>Format</h2>
            <div className="settings grid-cols-[repeat(auto-fill,minmax(160px,1fr))]!">
              <label>
                Groups
                <select
                  value={format.groups}
                  onChange={(e) => config("format", { groups: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n === 1 ? "One group" : `${n} groups`}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Advance per group
                <select
                  value={format.advancePerGroup ?? "all"}
                  onChange={(e) =>
                    config("format", {
                      advancePerGroup: e.target.value === "all" ? null : Number(e.target.value),
                    })
                  }
                >
                  <option value="all">Everyone</option>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      Top {n}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Knockout
                <select
                  value={format.elimination}
                  onChange={(e) => config("format", { elimination: e.target.value })}
                >
                  <option value="double">Double elimination</option>
                  <option value="single">Single elimination</option>
                </select>
              </label>
              {format.elimination === "double" && (
                <label>
                  Grand final
                  <select
                    value={format.bracketReset ? "reset" : "single"}
                    onChange={(e) => config("format", { bracketReset: e.target.value === "reset" })}
                  >
                    <option value="reset">With bracket reset</option>
                    <option value="single">One match</option>
                  </select>
                </label>
              )}
            </div>
          </section>

          <section className={RULED}>
            <h2>Legs</h2>
            <div className="settings grid-cols-[repeat(auto-fill,minmax(160px,1fr))]!">
              {(
                [
                  ["groups", "Group matches"],
                  ["winners", format.elimination === "double" ? "Winners bracket" : "Knockout"],
                  ...(format.elimination === "double"
                    ? [["losers", "Losers bracket"] as const]
                    : []),
                  ["final", "Final"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <select
                    value={legs[key]}
                    onChange={(e) => config("legs", { [key]: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {bestOf(n)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <section className={RULED}>
            <h2>Game</h2>
            <div className="settings grid-cols-[repeat(auto-fill,minmax(160px,1fr))]!">
              <label>
                Start
                <select
                  value={x01.startScore}
                  onChange={(e) => config("x01", { startScore: Number(e.target.value) })}
                >
                  {[301, 501, 701].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                In
                <select
                  value={x01.inRule}
                  onChange={(e) => config("x01", { inRule: e.target.value })}
                >
                  <option value="straight">Single</option>
                  <option value="double">Double</option>
                  <option value="master">Master</option>
                  <option value="bull">Bull</option>
                </select>
              </label>
              <label>
                Out
                <select
                  value={x01.outRule}
                  onChange={(e) => config("x01", { outRule: e.target.value })}
                >
                  <option value="straight">Single</option>
                  <option value="double">Double</option>
                  <option value="master">Master</option>
                </select>
              </label>
            </div>
          </section>
        </div>

        <aside className={ASIDE}>
          <section className={SECTION}>
            <div className={SECTION_HEAD}>
              <h2>Seeds</h2>
              <span className="label">By rating</span>
            </div>
            <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
              {view.entrants.map((e, i) => (
                <li
                  key={e.playerId}
                  className="flex min-h-14 items-center gap-3 border border-border border-solid bg-surface pr-1.5 pl-3.5 [--avatar:28px]"
                >
                  <span className="w-6 font-pixel text-[13px] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Avatar player={{ id: e.playerId, name: e.name, photo: e.photo }} />
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[14px] uppercase tracking-[1px]">
                    {e.name}
                  </span>
                  <span className="text-[24px] text-muted">
                    {e.rating === null ? "–" : e.rating.toFixed(1)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Move ${e.name} up`}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                    className={SEED_MOVE}
                  >
                    <PixelIcon name="up" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${e.name} down`}
                    disabled={i === order.length - 1}
                    onClick={() => move(i, i + 1)}
                    className={SEED_MOVE}
                  >
                    <PixelIcon name="down" />
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {view.groups.length > 1 && (
            <section className={SECTION}>
              <h2>Groups preview</h2>
              {view.groups.map((group, g) => (
                <p
                  key={group.join()}
                  className="m-0 border border-line-soft border-solid bg-panel px-3.5 py-3"
                >
                  <span className="match-label">Group {groupName(g)}</span>{" "}
                  {group.map(nameOf).join(", ")}
                </p>
              ))}
            </section>
          )}

          {view.problems.length > 0 ? (
            <ul
              className="m-0 flex list-none flex-col gap-1.5 border border-warn-line border-solid bg-warn-tint p-4 text-warn"
              aria-label="Problems"
            >
              {view.problems.map((p) => (
                <li
                  key={p}
                  className="before:mr-3 before:inline-block before:size-[9px] before:bg-current before:align-[0.1em] before:content-['']"
                >
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            view.estimateMinutes !== null && (
              <p className="m-0 flex items-center gap-3 border border-ok-line border-solid bg-ok-tint p-4 text-[24px] text-text before:inline-block before:size-[9px] before:bg-ok before:align-[0.1em] before:content-['']">
                Takes {formatMinutes(view.estimateMinutes)}.
              </p>
            )
          )}
          <div className={CONTROLS}>
            <button
              type="button"
              className="danger"
              onClick={() =>
                confirm("Throw this draft away?") && send("DELETE", "/api/admin/tournament")
              }
            >
              Discard
            </button>
            <button
              type="button"
              className={CONTROLS_CTA}
              disabled={view.problems.length > 0}
              onClick={() => send("POST", "/api/admin/tournament/start")}
            >
              Start tournament <PixelIcon name="arrow" height="0.9em" />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
