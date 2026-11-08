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
  numbered?: boolean;
}) {
  const { picked, onChange, title, max = MAX_PLAYERS, numbered = true } = props;
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
    <div className="flex flex-col gap-3">
      {title && (
        <div className="label flex justify-between gap-3">
          <span>{title}</span>
          <span>
            <span className="text-text">{picked.length}</span>
            {Number.isFinite(max) && ` / ${max}`} picked
          </span>
        </div>
      )}
      {!players ? (
        <p className="hint">Loading players…</p>
      ) : (
        <div className="kiosk:gap-2.5 flex flex-wrap gap-2">
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
                className="kiosk:min-h-[60px] kiosk:gap-3 kiosk:pr-4 kiosk:pl-2 kiosk:text-[16px] kiosk:[--avatar:40px] kiosk:aria-pressed:pr-3 gap-2 pr-3 pl-1.5 text-[12px] [--avatar:28px] aria-pressed:pr-2.5"
              >
                <Avatar player={p} />
                <span>{p.name}</span>
                {numbered && position >= 0 && (
                  <span className="kiosk:h-[26px] kiosk:min-w-[26px] bg-accent kiosk:text-[13px] text-accent-text inline-grid h-5 min-w-5 place-items-center text-[11px] font-bold">
                    {position + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <form className="inline-form kiosk:max-w-[560px]" onSubmit={submit}>
        <input
          aria-label="New player"
          placeholder="New player name"
          value={newName}
          required
          onChange={(e) => setNewName(e.target.value)}
          className="kiosk:min-h-14"
        />
        <button type="submit" className="kiosk:min-h-14">
          + Add
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
