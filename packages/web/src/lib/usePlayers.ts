import type { Player } from "@n4/server/api";
import { useLive } from "./useLive.ts";

/**
 * Active players, followed live, plus a way to add one (open to stations, docs/adr/0004). A new
 * player arrives through the stream, here and in every other open list.
 */
export function usePlayers() {
  const { view: players } = useLive<Player[]>("/api/players/live");

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
    return body as Player;
  };

  return { players, add };
}
