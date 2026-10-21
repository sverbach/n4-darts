import type { TournamentAdminView, TournamentConfig } from "@n4/server/api";
import { useState } from "react";
import { Avatar } from "./Avatar.tsx";
import { request } from "./adminApi.ts";
import { PlayerPicker } from "./MatchSetup.tsx";
import { PixelIcon } from "./PixelIcon.tsx";
import { TournamentRun } from "./TournamentRun.tsx";
import { useLive } from "./useLive.ts";

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
    <div className="tournament-admin">
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
      <div className="admin-head">
        <h1>Tournament</h1>
        <p className="hint">One tournament at a time. Set it up here, then the stations play it.</p>
      </div>
      <div className="admin-columns">
        <div className="admin-main">
          <label className="field">
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
        <aside className="admin-aside panel create-summary">
          <span className="label">New tournament</span>
          <div className="create-count">
            <span>{picked.length}</span>
            <span className="label">Players picked</span>
          </div>
          <p className="hint">
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
      <div className="admin-head">
        <div className="admin-head-tags">
          <span className="match-label">Draft</span>
          {save !== "idle" && (
            <span className={`save-state ${save}`}>{save === "saving" ? "Saving…" : "Saved"}</span>
          )}
        </div>
        <h1>Tournament</h1>
        <p className="hint">
          Every change saves right away. Start when the problems list is clear.
        </p>
      </div>
      <div className="admin-columns">
        <div className="admin-main">
          <label className="field">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name !== tournament.name && patch({ name })}
            />
          </label>

          <section className="admin-section">
            <h2>
              Players <span className="count">({view.entrants.length})</span>
            </h2>
            <PlayerPicker
              picked={order}
              onChange={(playerIds) => patch({ playerIds })}
              max={Number.POSITIVE_INFINITY}
            />
          </section>

          <section className="admin-section ruled">
            <h2>Format</h2>
            <div className="settings wide">
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

          <section className="admin-section ruled">
            <h2>Legs</h2>
            <div className="settings wide">
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

          <section className="admin-section ruled">
            <h2>Game</h2>
            <div className="settings wide">
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

        <aside className="admin-aside">
          <section className="admin-section">
            <div className="admin-section-head">
              <h2>Seeds</h2>
              <span className="label">By rating</span>
            </div>
            <ol className="seed-list">
              {view.entrants.map((e, i) => (
                <li key={e.playerId}>
                  <span className="seed-position">{String(i + 1).padStart(2, "0")}</span>
                  <Avatar player={{ id: e.playerId, name: e.name, photo: e.photo }} />
                  <span className="seed-name">{e.name}</span>
                  <span className="seed-rating">
                    {e.rating === null ? "–" : e.rating.toFixed(1)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Move ${e.name} up`}
                    disabled={i === 0}
                    onClick={() => move(i, i - 1)}
                  >
                    <PixelIcon name="up" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${e.name} down`}
                    disabled={i === order.length - 1}
                    onClick={() => move(i, i + 1)}
                  >
                    <PixelIcon name="down" />
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {view.groups.length > 1 && (
            <section className="admin-section">
              <h2>Groups preview</h2>
              {view.groups.map((group, g) => (
                <p key={group.join()} className="group-preview">
                  <span className="match-label">Group {groupName(g)}</span>{" "}
                  {group.map(nameOf).join(", ")}
                </p>
              ))}
            </section>
          )}

          {view.problems.length > 0 ? (
            <ul className="problems" aria-label="Problems">
              {view.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : (
            view.estimateMinutes !== null && (
              <p className="estimate">Takes {formatMinutes(view.estimateMinutes)}.</p>
            )
          )}
          <div className="controls">
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
              className="primary cta"
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
