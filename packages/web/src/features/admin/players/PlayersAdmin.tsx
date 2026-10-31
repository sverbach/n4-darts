import type { AdminPlayer } from "@n4/server/api";
import { type FormEvent, useState } from "react";
import { ActionMenu } from "../../../components/ActionMenu.tsx";
import { Avatar } from "../../../components/Avatar.tsx";
import { PixelIcon } from "../../../components/PixelIcon.tsx";
import { request } from "../../../lib/api.ts";
import { useLive } from "../../../lib/useLive.ts";
import { PhotoEditor } from "./PhotoEditor.tsx";

/** The player lists: active, and archived (in a collapsible panel). */
const LIST = "m-0 list-none border-0 border-border border-t border-solid";
/** A player: the photo button, the name, the rating and the ⋮ menu. */
const ROW =
  "flex min-h-[76px] items-center gap-4 border-0 border-line-soft border-b border-solid py-2.5 [--avatar:52px]";
/** The rating column, under its one heading. */
const RATING = "w-20 flex-none text-right";
/** The lists' heading row: "Rating" over its column, once. */
function ListHead() {
  return (
    <div className="label flex justify-end gap-4 pt-4 pb-2" title="3-dart average, last 10 matches">
      <span className={RATING}>Rating</span>
      {/* Over the ⋮ column. */}
      <span className="w-11 flex-none" />
    </div>
  );
}

export function PlayersAdmin() {
  // Live: changes from here, from a station or from another device all come through the stream.
  const { view: players, failed } = useLive<AdminPlayer[]>("/api/admin/players/live");
  const [changeError, setChangeError] = useState<string | null>(null);
  const error = changeError ?? (failed ? "Couldn't load players" : null);

  /** Runs a change and shows its error if any. Resolves to success. */
  const change = async (method: string, url: string, body?: object) => {
    const message = await request(method, url, body);
    setChangeError(message);
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
          {active.length === 0 ? <p className="hint">No players yet.</p> : <ListHead />}
          <ul className={`${LIST} p-0`}>
            {active.map((p) => (
              <PlayerRow key={p.id} player={p} change={change} />
            ))}
          </ul>
          {archived.length > 0 && (
            <details className="border border-border border-solid bg-panel">
              <summary className="min-h-[52px] px-4">
                <PixelIcon name="caret" /> Archived ({archived.length})
              </summary>
              <div className="px-4">
                <ListHead />
              </div>
              <ul className={`${LIST} px-4 pt-0 pb-2`}>
                {archived.map((p) => (
                  <PlayerRow key={p.id} player={p} change={change} />
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

function PlayerRow(props: { player: AdminPlayer; change: Change }) {
  const { player, change } = props;
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
      {editingPhoto && <PhotoEditor player={player} onClose={() => setEditingPhoto(false)} />}
      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-pixel text-[16px] uppercase tracking-[1px]">
        {player.name}
      </span>
      <span className={`${RATING} text-[24px]`}>
        {player.rating === null ? "–" : player.rating.toFixed(1)}
      </span>
      <ActionMenu
        label={`Actions for ${player.name}`}
        items={[
          { label: "Rename", run: () => setRenaming(true) },
          {
            label: player.archived ? "Restore" : "Archive",
            run: () => void change("PATCH", url, { archived: !player.archived }),
          },
          {
            label: "Delete",
            danger: true,
            run: () => {
              if (confirm(`Delete ${player.name}?`)) void change("DELETE", url);
            },
          },
        ]}
      />
    </li>
  );
}
