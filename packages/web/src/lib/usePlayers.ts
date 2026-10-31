import type { Player } from "@n4/server/api";
import { useCallback, useEffect, useState } from "react";

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
