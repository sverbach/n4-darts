import type { TournamentAdminView, TournamentConfig } from "@n4/server/api";
import { useCallback, useEffect, useState } from "react";
import { request } from "./adminApi.ts";
import { PlayerPicker } from "./MatchSetup.tsx";

/** "about 45 min", "about 2 h 30". */
export function formatMinutes(minutes: number) {
  const rounded = Math.max(5, Math.round(minutes / 5) * 5);
  if (rounded < 60) return `about ${rounded} min`;
  const rest = rounded % 60;
  return `about ${Math.floor(rounded / 60)} h${rest ? ` ${String(rest).padStart(2, "0")}` : ""}`;
}

const groupName = (group: number) => String.fromCharCode(65 + group);
const bestOf = (legsToWin: number) => `Best of ${legsToWin * 2 - 1}`;

/** Loads the active tournament and sends changes; every change answers with the fresh view. */
function useTournament() {
  const [view, setView] = useState<TournamentAdminView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/tournament").catch(() => null);
    if (!res?.ok) return setError("Couldn't load the tournament");
    setView(await res.json());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const send = async (method: string, url: string, body?: object) => {
    const message = await request(method, url, body);
    setError(message);
    await load();
    return message === null;
  };
  return { view, error, send, load };
}

export function TournamentAdmin() {
  const { view, error, send, load } = useTournament();
  return (
    <div className="tournament-admin">
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!view ? (
        <p className="hint">Loading…</p>
      ) : !view.tournament ? (
        <CreateTournament send={send} />
      ) : view.tournament.status === "draft" ? (
        <DraftEditor view={view} send={send} />
      ) : (
        <RunningTournament view={view} send={send} reload={load} />
      )}
    </div>
  );
}

type Send = (method: string, url: string, body?: object) => Promise<boolean>;

function CreateTournament({ send }: { send: Send }) {
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <div className="new-match">
      <h2>New tournament</h2>
      <input
        aria-label="Tournament name"
        placeholder="Name (default: today's date)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <p className="hint">Who's playing?</p>
      <PlayerPicker picked={picked} onChange={setPicked} />
      <button
        type="button"
        className="primary"
        disabled={picked.length === 0}
        onClick={() => send("POST", "/api/admin/tournament", { name, playerIds: picked })}
      >
        Create draft
      </button>
    </div>
  );
}

function DraftEditor({ view, send }: { view: TournamentAdminView; send: Send }) {
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
    <div className="draft">
      <h2>Draft</h2>
      <input
        aria-label="Tournament name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name !== tournament.name && patch({ name })}
      />

      <h2>Players ({view.entrants.length})</h2>
      <PlayerPicker picked={order} onChange={(playerIds) => patch({ playerIds })} />

      <h2>Format</h2>
      <div className="settings">
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

      <h2>Legs</h2>
      <div className="settings">
        {(
          [
            ["groups", "Group matches"],
            ["winners", format.elimination === "double" ? "Winners bracket" : "Knockout"],
            ...(format.elimination === "double" ? [["losers", "Losers bracket"] as const] : []),
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

      <h2>Game</h2>
      <div className="settings">
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
          <select value={x01.inRule} onChange={(e) => config("x01", { inRule: e.target.value })}>
            <option value="straight">Single</option>
            <option value="double">Double</option>
            <option value="master">Master</option>
            <option value="bull">Bull</option>
          </select>
        </label>
        <label>
          Out
          <select value={x01.outRule} onChange={(e) => config("x01", { outRule: e.target.value })}>
            <option value="straight">Single</option>
            <option value="double">Double</option>
            <option value="master">Master</option>
          </select>
        </label>
      </div>

      <h2>Seeds</h2>
      <ol className="lineup-list seeds">
        {view.entrants.map((e, i) => (
          <li key={e.playerId}>
            <span className="lineup-position">{i + 1}</span>
            <span className="lineup-name">{e.name}</span>
            <span className="player-row-rating">
              {e.rating === null ? "–" : e.rating.toFixed(1)}
            </span>
            <button
              type="button"
              aria-label={`Move ${e.name} up`}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Move ${e.name} down`}
              disabled={i === order.length - 1}
              onClick={() => move(i, i + 1)}
            >
              ↓
            </button>
          </li>
        ))}
      </ol>

      {view.groups.length > 1 && (
        <>
          <h2>Groups</h2>
          {view.groups.map((group, g) => (
            <p key={group.join()} className="group-preview">
              <strong>Group {groupName(g)}:</strong> {group.map(nameOf).join(", ")}
            </p>
          ))}
        </>
      )}

      {view.problems.length > 0 ? (
        <ul className="problems">
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
          className="ghost danger"
          onClick={() =>
            confirm("Throw this draft away?") && send("DELETE", "/api/admin/tournament")
          }
        >
          Discard
        </button>
        <button
          type="button"
          className="primary"
          disabled={view.problems.length > 0}
          onClick={() => send("POST", "/api/admin/tournament/start")}
        >
          Start tournament
        </button>
      </div>
    </div>
  );
}

function RunningTournament(props: { view: TournamentAdminView; send: Send; reload(): void }) {
  const tournament = props.view.tournament as NonNullable<TournamentAdminView["tournament"]>;
  return (
    <div>
      <h2>{tournament.name}</h2>
      <p className="hint">{tournament.status === "running" ? "Running" : "Finished"}</p>
    </div>
  );
}
