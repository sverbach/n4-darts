import type { AdminPlayer } from "@n4/server/api";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Avatar } from "../../../components/Avatar.tsx";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { request } from "../../../lib/api.ts";
import { PhotoEditor } from "./PhotoEditor.tsx";

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
    <div className="players-admin">
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
          <ul className="player-list">
            {active.map((p) => (
              <PlayerRow key={p.id} player={p} change={change} reload={load} />
            ))}
          </ul>
          {archived.length > 0 && (
            <details className="archived">
              <summary>
                <PixelIcon name="caret" /> Archived ({archived.length})
              </summary>
              <ul className="player-list">
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
    <form className="inline-form add-player" onSubmit={submit}>
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
      <li className="player-row">
        <Avatar player={player} />
        <form className="inline-form rename" onSubmit={submit}>
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
    <li className="player-row">
      <button
        type="button"
        className="avatar-button"
        aria-label={`Photo of ${player.name}`}
        onClick={() => setEditingPhoto(true)}
      >
        <Avatar player={player} />
        <span className="avatar-badge">
          <PixelIcon name="dots" />
        </span>
      </button>
      {editingPhoto && (
        <PhotoEditor player={player} onClose={() => setEditingPhoto(false)} onChanged={reload} />
      )}
      <div className="player-row-text">
        <span className="player-row-name">{player.name}</span>
        <span className="label" title="3-dart average, last 10 matches">
          Rating{" "}
          <span className="player-row-rating">
            {player.rating === null ? "–" : player.rating.toFixed(1)}
          </span>
        </span>
      </div>
      <div className="player-row-actions">
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
