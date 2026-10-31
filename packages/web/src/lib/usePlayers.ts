import type { Player } from "@n4/server/api";
import { call } from "./api.ts";
import { useLive } from "./useLive.ts";

/**
 * Active players, followed live, plus a way to add one (open to stations, docs/adr/0004). A new
 * player arrives through the stream, here and in every other open list.
 */
export function usePlayers() {
  const { view: players } = useLive<Player[]>("/api/players/live");

  /** Resolves to the new player, or an error message. */
  const add = async (name: string): Promise<Player | string> => {
    const result = await call<Player>("POST", "/api/players", { name });
    return result.data ?? result.error ?? "Couldn't add player";
  };

  return { players, add };
}
