import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { throwFor } from "@n4/board-sim";
import { checkoutRoute, type Segment } from "@n4/engine";
import type { StationView, TournamentAdminView, X01MatchView } from "@n4/server/api";
import {
  type APIRequestContext,
  type Browser,
  expect,
  type Page,
  request,
  test,
} from "@playwright/test";
import { BASE_URL, BOARD_PORTS, PIN } from "../src/ports.ts";

const IMAGES = fileURLToPath(new URL("../../../docs/images/", import.meta.url));
const KIOSK = { width: 1440, height: 900 };
const PROJECTOR = { width: 1920, height: 1200 };

/** How far a player's darts land from where they aim, in board units (the double ring is at 0.95). */
const SKILL: Record<string, number> = {
  Ann: 0.042,
  Bob: 0.055,
  Cid: 0.065,
  Dee: 0.075,
  Eve: 0.05,
  Fay: 0.085,
  Gus: 0.095,
  Hal: 0.07,
};
const NAMES = Object.keys(SKILL);
const ID = (name: string) => `p-${name.toLowerCase()}`;

let api: APIRequestContext;
let browser: Browser;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser: b }) => {
  browser = b;
  api = await request.newContext({ baseURL: BASE_URL });
  expect((await api.post("/api/admin/login", { data: { pin: PIN } })).ok()).toBe(true);
});

test.afterAll(async () => {
  await api.dispose();
});

async function newPage(size: { width: number; height: number }) {
  const context = await browser.newContext({ viewport: size });
  const cookies = (await api.storageState()).cookies.map((c) => ({
    ...c,
    sameSite: "Lax" as const,
  }));
  await context.addCookies(cookies);
  return context.newPage();
}

async function shoot(p: Page, name: string) {
  await p.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await p.screenshot({ path: join(IMAGES, `${name}.png`) });
}

// --- The board and the station ---------------------------------------------------------------------

async function station(id: number) {
  return (await (await api.get(`/api/stations/${id}`)).json()) as StationView;
}

async function x01(id: number) {
  const match = (await station(id)).match;
  return match?.settings.mode === "x01" ? (match as X01MatchView) : null;
}

async function command(id: number, body: object) {
  const res = await api.post(`/api/stations/${id}/commands`, { data: body });
  expect(res.ok(), await res.text()).toBe(true);
}

async function sim(id: number, path: string, body?: object) {
  const res = await fetch(`http://localhost:${BOARD_PORTS[id - 1]}/sim/${path}`, {
    method: "POST",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`board ${id} ${path}: ${res.status}`);
}

const FAST = { intervals: [10, 20, 50], timeout: 10_000 };

const gauss = () =>
  Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());

const nameOf = ({ number, multiplier }: Segment) => {
  if (number === 25) return multiplier === 2 ? "BULL" : "25";
  return `${["", "S", "D", "T"][multiplier]}${number}`;
};

/** Where a player aims: the checkout route's next dart when there is one, else something sensible. */
function aim(remaining: number, dartsLeft: number) {
  const route = checkoutRoute(remaining, dartsLeft, "double");
  if (route?.[0]) return nameOf(route[0]);
  if (remaining <= 40) return remaining % 2 ? "S1" : `D${remaining / 2}`;
  if (remaining <= 60) return `S${remaining - 40}`;
  return remaining % 2 && remaining < 100 ? "T19" : "T20";
}

/** One dart by `player` at what they aim for, landing with their scatter. */
async function throwDart(id: number, player: string) {
  const match = await x01(id);
  if (match?.state.phase !== "throwing") return false;
  const thrower = match.state.players[match.state.currentPlayer];
  const visit = match.state.currentVisit?.darts.filter((d) => !d.ignored).length ?? 0;
  const target = throwFor(aim(thrower?.remaining ?? 501, 3 - visit)).coords;
  const spread = SKILL[player] ?? 0.08;
  const coords = { x: target.x + gauss() * spread, y: target.y + gauss() * spread };
  const before = match.state.currentVisit?.darts.length ?? 0;
  await sim(id, "dart", { coords });
  await expect
    .poll(async () => {
      const now = await x01(id);
      return (
        (now?.state.currentVisit?.darts.length ?? 0) > before || now?.state.phase !== "throwing"
      );
    }, FAST)
    .toBe(true);
  return true;
}

const throwerName = (match: X01MatchView) =>
  match.players[match.state.currentPlayer]?.name ?? "Hal";

/** The current player's visit: up to three darts, then the takeout (unless the match is won). */
async function playVisit(id: number) {
  for (let i = 0; i < 3; i++) {
    const match = await x01(id);
    if (match?.state.phase !== "throwing") break;
    await throwDart(id, throwerName(match));
  }
  if ((await x01(id))?.state.phase === "awaitingTakeout") {
    await sim(id, "takeout");
    await expect.poll(async () => (await x01(id))?.state.phase, FAST).not.toBe("awaitingTakeout");
  }
}

async function playMatch(id: number) {
  while ((await x01(id))?.state.phase !== "matchWon") await playVisit(id);
}

/** A 501 double out between two players on station 1, played out and closed. Returns its id. */
async function quickMatch(a: string, b: string) {
  await command(1, {
    type: "quickMatch",
    playerIds: [ID(a), ID(b)],
    settings: { startScore: 501, outRule: "double" },
  });
  await command(1, { type: "startMatch" });
  const id = (await x01(1))?.id as string;
  await playMatch(1);
  await command(1, { type: "closeMatch" });
  return id;
}

// --- The database ----------------------------------------------------------------------------------

/** Moves matches `days` into the past, as if they were played on an earlier evening. */
function backdate(matchIds: string[], days: number) {
  const db = new DatabaseSync(join(process.env.N4_E2E_DATA_DIR as string, "n4-darts.db"));
  db.exec("pragma busy_timeout = 5000");
  const shift = `-${days} days`;
  for (const id of matchIds) {
    db.prepare(
      "update match_events set at = strftime('%Y-%m-%dT%H:%M:%fZ', at, ?) where match_id = ?",
    ).run(shift, id);
    db.prepare(
      "update matches set created_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at, ?), closed_at = strftime('%Y-%m-%dT%H:%M:%fZ', closed_at, ?) where id = ?",
    ).run(shift, shift, id);
  }
  db.close();
}

// --- The story -------------------------------------------------------------------------------------

test("three earlier evenings", async () => {
  const pairs = [
    ["Ann", "Bob"],
    ["Cid", "Dee"],
    ["Eve", "Fay"],
    ["Gus", "Hal"],
    ["Ann", "Eve"],
    ["Bob", "Cid"],
  ];
  for (const [weeks, offset] of [
    [3, 0],
    [2, 2],
    [1, 4],
  ] as const) {
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      const [a, b] = pairs[(offset + i) % pairs.length] as [string, string];
      ids.push(await quickMatch(a, b));
    }
    backdate(ids, weeks * 7);
  }
});

test("tonight: a 501 on station 1", async () => {
  await command(1, {
    type: "quickMatch",
    playerIds: [ID("Ann"), ID("Bob")],
    settings: { startScore: 501, outRule: "double" },
  });
  await command(1, { type: "startMatch" });
  const matchId = (await x01(1))?.id as string;

  const kiosk = await newPage(KIOSK);
  let shot = false;
  while ((await x01(1))?.state.phase !== "matchWon") {
    const match = (await x01(1)) as X01MatchView;
    if (match.state.phase === "throwing") {
      await throwDart(1, throwerName(match));
      const now = (await x01(1)) as X01MatchView;
      const thrower = now.state.players[now.state.currentPlayer];
      const darts = now.state.currentVisit?.darts.length ?? 0;
      if (
        !shot &&
        now.state.phase === "throwing" &&
        darts === 1 &&
        (thrower?.remaining ?? 501) <= 120
      ) {
        await kiosk.goto("/station/1");
        await expect(kiosk.getByText("Tap a dart to correct it")).toBeVisible();
        await shoot(kiosk, "station");
        shot = true;
      }
    } else if (match.state.phase === "awaitingTakeout") {
      await sim(1, "takeout");
      await expect.poll(async () => (await x01(1))?.state.phase, FAST).not.toBe("awaitingTakeout");
    }
  }

  const watch = await newPage(PROJECTOR);
  await watch.goto("/watch/1");
  await expect(watch.getByText("Game shot")).toBeVisible();
  await shoot(watch, "caller");
  await watch.close();
  await command(1, { type: "closeMatch" });

  await kiosk.goto(`/matches/${matchId}`);
  await expect(kiosk.getByText("Head-to-head")).toBeVisible();
  await shoot(kiosk, "stats");
  await kiosk.close();
});

async function tournament() {
  return (await (await api.get("/api/admin/tournament")).json()) as TournamentAdminView;
}

/** One step on each station: start a match, play a visit, take out, or close a won match. */
async function step() {
  for (const id of [1, 2]) {
    const match = await x01(id);
    if (!match) continue;
    if (match.state.phase === "notStarted") await command(id, { type: "startMatch" });
    else if (match.state.phase === "matchWon") await command(id, { type: "closeMatch" });
    else await playVisit(id);
  }
}

test("tonight: the tournament", async () => {
  const created = await api.post("/api/admin/tournament", {
    data: {
      name: "Saturday night",
      playerIds: NAMES.map(ID),
      config: {
        format: { groups: 2, advancePerGroup: 2, elimination: "single" },
        legs: { groups: 1, winners: 1, losers: 1, final: 1 },
        x01: { startScore: 301, outRule: "double" },
      },
    },
  });
  expect(created.ok(), await created.text()).toBe(true);
  expect((await api.post("/api/admin/tournament/start")).ok()).toBe(true);

  let projected = false;
  while ((await tournament()).tournament?.status === "running") {
    await step();
    const progress = (await tournament()).progress;
    if (!projected && progress?.phase === "groups" && progress.played >= 6) {
      const both = await Promise.all([x01(1), x01(2)]);
      if (both.every((m) => m?.state.phase === "throwing" && !m.state.currentVisit)) {
        for (const [i, m] of both.entries()) await throwDart(i + 1, throwerName(m as X01MatchView));
        const display = await newPage(PROJECTOR);
        await display.goto("/display");
        await expect(display.getByText(/Group/).first()).toBeVisible();
        await shoot(display, "projector");
        await display.close();
        projected = true;
      }
    }
  }
  expect(projected).toBe(true);

  const kiosk = await newPage(KIOSK);
  const id = (await tournament()).tournament?.id;
  await kiosk.goto(id ? `/tournaments/${id}` : "/tournaments");
  await expect(kiosk.getByText("Champion")).toBeVisible();
  await shoot(kiosk, "tournament");

  await kiosk.goto(`/players/${ID("Ann")}`);
  await expect(kiosk.getByRole("heading", { name: "Ann" })).toBeVisible();
  await kiosk.evaluate(() => window.scrollTo(0, 0));
  await shoot(kiosk, "public-profile");
  await kiosk.close();
});
