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
        <div className="flex flex-wrap gap-2 kiosk:gap-2.5">
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
                className="kiosk:min-h-[60px] gap-2 kiosk:gap-3 kiosk:pr-4 pr-3 kiosk:pl-2 pl-1.5 kiosk:text-[16px] text-[12px] [--avatar:28px] kiosk:[--avatar:40px] aria-pressed:pr-2.5 kiosk:aria-pressed:pr-3.5"
              >
                <Avatar player={p} />
                <span className="pick-name">{p.name}</span>
                {position >= 0 && (
                  <span className="inline-grid h-5 kiosk:h-[26px] kiosk:min-w-[26px] min-w-5 place-items-center bg-accent font-bold kiosk:text-[13px] text-[11px] text-accent-text">
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
