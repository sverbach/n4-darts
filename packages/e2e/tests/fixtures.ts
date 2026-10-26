// Shared setup: an API client logged in as admin, players to pick, and both stations and the
// tournament cleared before each test (the tests share one server).

import type { StationView, TournamentAdminView } from "@n4/server/api";
import { type APIRequestContext, test as base, expect, type Page } from "@playwright/test";
import { BOARD_PORTS, PIN } from "../src/ports.ts";

export const PLAYERS = ["Ann", "Bob", "Cid"];

/** One simulated board: throw darts at it and pull them out. */
export function board(station: number) {
  const url = `http://localhost:${BOARD_PORTS[station - 1]}/sim`;
  const post = async (path: string, body?: object) => {
    const res = await fetch(`${url}/${path}`, {
      method: "POST",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`board ${station} ${path}: ${res.status}`);
  };
  return {
    /** S20, D20, T20, 25, BULL, M17 (off the board). */
    dart: (name: string) => post("dart", { name }),
    takeout: () => post("takeout"),
  };
}

export interface N4 {
  api: APIRequestContext;
  /** Player ids by name. */
  players: Record<string, string>;
  station(id: number): Promise<StationView>;
  command(id: number, command: object): Promise<void>;
  /** Sets up a quick match between `names` on a station and starts it. */
  quickMatch(id: number, names: string[], settings?: object): Promise<void>;
  /** Logs the browser in to /admin. */
  login(page: Page): Promise<void>;
}

export const test = base.extend<{ n4: N4 }>({
  n4: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL: baseURL as string });
    expect((await api.post("/api/admin/login", { data: { pin: PIN } })).ok()).toBe(true);

    const existing = (await (await api.get("/api/players")).json()) as {
      id: string;
      name: string;
    }[];
    const players: Record<string, string> = {};
    for (const name of PLAYERS) {
      const found = existing.find((p) => p.name === name);
      players[name] = found
        ? found.id
        : ((await (await api.post("/api/players", { data: { name } })).json()) as { id: string })
            .id;
    }

    const station = async (id: number) =>
      (await (await api.get(`/api/stations/${id}`)).json()) as StationView;
    const command = async (id: number, command: object) => {
      const res = await api.post(`/api/stations/${id}/commands`, { data: command });
      expect(res.ok(), await res.text()).toBe(true);
    };

    // A clean slate: no tournament on show, nothing on the stations, empty boards.
    const tournament = async () =>
      ((await (await api.get("/api/admin/tournament")).json()) as TournamentAdminView).tournament;
    if ((await tournament())?.status === "draft") await api.delete("/api/admin/tournament");
    if ((await tournament())?.status === "running") await api.post("/api/admin/tournament/end");
    if (await tournament()) {
      // A finished tournament stays on show (in /admin and on /display) until the next one is
      // created; an empty draft hides it, and drafts don't touch the stations or /display.
      await api.post("/api/admin/tournament", { data: { playerIds: [] } });
    }
    for (const id of [1, 2]) {
      const match = (await station(id)).match;
      if (match) {
        await command(id, {
          type: match.state.phase === "matchWon" ? "closeMatch" : "abandonMatch",
        });
      }
      await board(id).takeout();
    }

    await use({
      api,
      players,
      station,
      command,
      async quickMatch(id, names, settings = {}) {
        const playerIds = names.map((n) => players[n] as string);
        await command(id, { type: "quickMatch", playerIds, settings });
        await command(id, { type: "startMatch" });
      },
      async login(page) {
        await page
          .context()
          .addCookies(
            (await api.storageState()).cookies.map((c) => ({ ...c, sameSite: "Lax" as const })),
          );
      },
    });
    await api.dispose();
  },
});

export { expect };
