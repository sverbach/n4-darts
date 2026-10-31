import type { AdminPlayer } from "@n4/server/api";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Avatar } from "../../../components/Avatar.tsx";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { request } from "../../../lib/api.ts";
import { PhotoEditor } from "./PhotoEditor.tsx";

/** The player lists: active, and archived (in a collapsible panel). */
const LIST = "m-0 list-none border-0 border-border border-t border-solid";
/** A player: the photo button, name and rating, and actions; wrapping on a phone. */
const ROW =
  "flex min-h-[76px] flex-wrap items-center gap-x-4 gap-y-3 border-0 border-line-soft border-b border-solid py-2.5 [--avatar:52px]";

export function PlayersAdmin() {
  const [players, setPlayers] = useState<AdminPlayer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/players").catch(() => null);
    if (!res?.ok) return setError("Couldn't load players");
    setPlayers(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Runs a change, shows its error if any, and reloads the list. Resolves to success. */
  const change = async (method: string, url: string, body?: object) => {
    const message = await request(method, url, body);
    setError(message);
    await load();
    return message === null;
  };

  const active = players?.filter((p) => !p.archived) ?? [];
  const archived = players?.filter((p) => p.archived) ?? [];

  return (
    <div>
      <AddPlayer onAdd={(name) => change("POST", "/api/admin/players", { name })} />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!players ? (
        <p className="hint">Loading…</p>
      ) : (
        <>
          {active.length === 0 && <p className="hint">No players yet.</p>}
          <ul className={`${LIST} p-0`}>
            {active.map((p) => (
              <PlayerRow key={p.id} player={p} change={change} reload={load} />
            ))}
          </ul>
          {archived.length > 0 && (
            <details className="border border-border border-solid bg-panel">
              <summary className="min-h-[52px] px-4">
                <PixelIcon name="caret" /> Archived ({archived.length})
              </summary>
              <ul className={`${LIST} px-4 pt-0 pb-2`}>
                {archived.map((p) => (
                  <PlayerRow key={p.id} player={p} change={change} reload={load} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}

function AddPlayer({ onAdd }: { onAdd: (name: string) => Promise<boolean> }) {
  const [name, setName] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await onAdd(name)) setName("");
  };
  return (
    <form
      className="inline-form max-w-[460px] [&_button]:min-h-[52px] [&_input]:min-h-[52px]"
      onSubmit={submit}
    >
      <input
        aria-label="New player"
        placeholder="New player name"
        value={name}
        required
        onChange={(e) => setName(e.target.value)}
      />
      <button type="submit" className="primary">
        + Add
      </button>
    </form>
  );
}

type Change = (method: string, url: string, body?: object) => Promise<boolean>;

function PlayerRow(props: { player: AdminPlayer; change: Change; reload(): void }) {
  const { player, change, reload } = props;
  const [renaming, setRenaming] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [name, setName] = useState(player.name);
  const url = `/api/admin/players/${player.id}`;

  if (renaming) {
    const submit = async (e: FormEvent) => {
      e.preventDefault();
      if (await change("PATCH", url, { name })) setRenaming(false);
    };
    return (
      <li className={ROW}>
        <Avatar player={player} />
        <form
          className="inline-form max-w-[560px] flex-[1_1_280px] flex-wrap [&_input]:flex-[1_1_200px] [&_input]:border-2 [&_input]:border-accent"
          onSubmit={submit}
        >
          <input
            aria-label="Name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="primary">
            Save
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setName(player.name);
              setRenaming(false);
            }}
          >
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className={ROW}>
      <button
        type="button"
        className="relative min-h-0 border-0 bg-transparent p-0"
        aria-label={`Photo of ${player.name}`}
        onClick={() => setEditingPhoto(true)}
      >
        <Avatar player={player} />
        <span className="absolute -right-1 -bottom-1 flex size-[18px] items-center justify-center bg-accent text-accent-text [&_.pixel-icon]:h-auto [&_.pixel-icon]:w-3">
          <PixelIcon name="dots" />
        </span>
      </button>
      {editingPhoto && (
        <PhotoEditor player={player} onClose={() => setEditingPhoto(false)} onChanged={reload} />
      )}
      <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[16px] uppercase tracking-[1px]">
          {player.name}
        </span>
        <span className="label" title="3-dart average, last 10 matches">
          Rating{" "}
          <span className="text-text">
            {player.rating === null ? "–" : player.rating.toFixed(1)}
          </span>
        </span>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        <button type="button" onClick={() => setRenaming(true)}>
          Rename
        </button>
        <button type="button" onClick={() => change("PATCH", url, { archived: !player.archived })}>
          {player.archived ? "Restore" : "Archive"}
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => {
            if (confirm(`Delete ${player.name}?`)) void change("DELETE", url);
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
