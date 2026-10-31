import { MAX_PLAYERS } from "@n4/engine";
import { type FormEvent, useState } from "react";
import { usePlayers } from "../lib/usePlayers.ts";
import { Avatar } from "./Avatar.tsx";

/**
 * Players are picked in order; tapping again removes one. `title` heads it with a count; `max`
 * caps it (a match's player limit unless given, e.g. none for a tournament).
 */
export function PlayerPicker(props: {
  picked: string[];
  onChange(picked: string[]): void;
  title?: string;
  max?: number;
}) {
  const { picked, onChange, title, max = MAX_PLAYERS } = props;
  const { players, add } = usePlayers();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggle = (playerId: string, current = picked) =>
    onChange(
      current.includes(playerId)
        ? current.filter((p) => p !== playerId)
        : current.length < max
          ? [...current, playerId]
          : current,
    );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await add(newName);
    if (typeof result === "string") return setError(result);
    setError(null);
    setNewName("");
    toggle(result.id);
  };

  return (
    <div className="player-picker-wrap">
      {title && (
        <div className="player-picker-head label">
          <span>{title}</span>
          <span>
            <span className="player-picker-count">{picked.length}</span>
            {Number.isFinite(max) && ` / ${max}`} picked
          </span>
        </div>
      )}
      {!players ? (
        <p className="hint">Loading players…</p>
      ) : (
        <div className="player-picker">
          {players.length === 0 && <p className="hint left">No players yet: add the first one.</p>}
          {players.map((p) => {
            const position = picked.indexOf(p.id);
            return (
              <button
                type="button"
                key={p.id}
                aria-pressed={position >= 0}
                onClick={() => toggle(p.id)}
                disabled={position < 0 && picked.length >= max}
              >
                <Avatar player={p} />
                <span className="pick-name">{p.name}</span>
                {position >= 0 && <span className="pick-number">{position + 1}</span>}
              </button>
            );
          })}
        </div>
      )}
      <form className="inline-form" onSubmit={submit}>
        <input
          aria-label="New player"
          placeholder="New player name"
          value={newName}
          required
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit">+ Add</button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
