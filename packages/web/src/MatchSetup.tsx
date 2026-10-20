// Choosing players and settings for a new match: shared by the station's quick match and /admin.

import { type InRule, MAX_PLAYERS, type OutRule } from "@n4/engine";
import type { MatchSettingsInput, Player } from "@n4/server/api";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Avatar } from "./Avatar.tsx";

export type SetupSettings = Required<MatchSettingsInput>;

export const defaultSetupSettings: SetupSettings = {
  startScore: 301,
  inRule: "straight",
  outRule: "straight",
  legsToWin: 1,
};

/** Active players, plus a way to add one (open to stations, docs/adr/0004). */
export function usePlayers() {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const load = useCallback(async () => {
    const res = await fetch("/api/players").catch(() => null);
    if (res?.ok) setPlayers(await res.json());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  /** Resolves to the new player, or an error message. */
  const add = async (name: string): Promise<Player | string> => {
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => null);
    if (!res) return "Server not reachable";
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return (body as { error?: string }).error ?? "Couldn't add player";
    await load();
    return body as Player;
  };

  return { players, add };
}

/** Players are picked in throwing order; tapping again removes one. */
export function PlayerPicker(props: { picked: string[]; onChange(picked: string[]): void }) {
  const { picked, onChange } = props;
  const { players, add } = usePlayers();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggle = (playerId: string, current = picked) =>
    onChange(
      current.includes(playerId)
        ? current.filter((p) => p !== playerId)
        : current.length < MAX_PLAYERS
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
    <>
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
                disabled={position < 0 && picked.length >= MAX_PLAYERS}
              >
                {position >= 0 && <span className="pick-number">{position + 1}</span>}
                <Avatar player={p} />
                {p.name}
              </button>
            );
          })}
        </div>
      )}
      <form className="inline-form" onSubmit={submit}>
        <input
          aria-label="New player"
          placeholder="New player"
          value={newName}
          required
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

/** "Best of 5" reads naturally for two players; with more it has to be "first to 3". */
export function legsLabel(legsToWin: number, playerCount: number) {
  if (playerCount === 2 && legsToWin > 1) return `Best of ${legsToWin * 2 - 1}`;
  return `First to ${legsToWin} ${legsToWin === 1 ? "leg" : "legs"}`;
}

export function SettingsFields(props: {
  value: SetupSettings;
  onChange(value: SetupSettings): void;
  playerCount: number;
}) {
  const { value, onChange, playerCount } = props;
  const set = <K extends keyof SetupSettings>(key: K, v: SetupSettings[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="settings">
      <label>
        Start
        <select
          value={value.startScore}
          onChange={(e) => set("startScore", Number(e.target.value))}
        >
          {[301, 501, 701].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        In
        <select value={value.inRule} onChange={(e) => set("inRule", e.target.value as InRule)}>
          <option value="straight">Single</option>
          <option value="double">Double</option>
          <option value="master">Master</option>
          <option value="bull">Bull</option>
        </select>
      </label>
      <label>
        Out
        <select value={value.outRule} onChange={(e) => set("outRule", e.target.value as OutRule)}>
          <option value="straight">Single</option>
          <option value="double">Double</option>
          <option value="master">Master</option>
        </select>
      </label>
      <label>
        Legs
        <select value={value.legsToWin} onChange={(e) => set("legsToWin", Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {legsLabel(n, playerCount)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
