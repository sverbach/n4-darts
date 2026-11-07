// Every page and state as a screenshot (tailwind ticket 01), compared against the baseline in
// visual.spec.ts-snapshots/: the safety net while the styles move to Tailwind. Runs on its own
// server with fixed players (playwright.visual.config.ts): `pnpm --filter @n4/e2e visual`, and
// `-- --update-snapshots` to take a new baseline.
//
// One story, in order: three finished matches, a quick match on station 1, then a tournament on
// station 1 while station 2 is busy (so the scheduler only uses station 1). Every dart is fixed, the
// browser's clock is pinned, and what the server stamps with the real time (dates, times, the
// duration estimate, the diagnostics' numbers) is overwritten with fixed text right before each
// screenshot, so the layout around it is still compared. Nothing depends on class names, which
// the migration changes.

import type { StationView, TournamentAdminView } from "@n4/server/api";
import {
  type APIRequestContext,
  type Browser,
  expect,
  type Locator,
  type Page,
  request,
  test,
} from "@playwright/test";
import { BASE_URL, PIN, WLED_PORT } from "../src/ports.ts";
import { board } from "./fixtures.ts";

const PHONE = { width: 390, height: 844 };
const KIOSK = { width: 1440, height: 900 };
const PROJECTOR = { width: 1920, height: 1080 };
const SMALL_PROJECTOR = { width: 1280, height: 720 };
const PAGES = { phone: PHONE, kiosk: KIOSK };
const SCREENS = { ...PAGES, "1080p": PROJECTOR, "720p": SMALL_PROJECTOR };
const BIG_SCREENS = { kiosk: KIOSK, "1080p": PROJECTOR, "720p": SMALL_PROJECTOR };

/** The seeded players (playwright.visual.config.ts). */
const ID = { Ann: "p-ann", Bob: "p-bob", Cid: "p-cid", Dee: "p-dee", Eve: "p-eve", Fay: "p-fay" };
/** A Saturday evening; only the browser's clock, the server keeps the real time. */
const NOW = new Date("2026-11-07T19:30:00+01:00");

let api: APIRequestContext;
let browser: Browser;
let page: Page;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser: b }) => {
  browser = b;
  api = await request.newContext({ baseURL: BASE_URL });
  expect((await api.post("/api/admin/login", { data: { pin: PIN } })).ok()).toBe(true);
  page = await loggedIn();
});

test.afterAll(async () => {
  await page.close();
  await api.dispose();
});

/** A page logged in to /admin, with the clock pinned. */
async function loggedIn() {
  const context = await browser.newContext();
  const cookies = (await api.storageState()).cookies.map((c) => ({
    ...c,
    sameSite: "Lax" as const,
  }));
  await context.addCookies(cookies);
  const p = await context.newPage();
  await p.clock.setFixedTime(NOW);
  return p;
}

// --- Driving the server and the boards -----------------------------------------------------------

async function station(id: number) {
  return (await (await api.get(`/api/stations/${id}`)).json()) as StationView;
}

async function command(id: number, body: object) {
  const res = await api.post(`/api/stations/${id}/commands`, { data: body });
  expect(res.ok(), await res.text()).toBe(true);
}

const dartsInVisit = async (id: number) =>
  (await station(id)).match?.state.currentVisit?.darts.length ?? 0;

/** Throws darts one by one, each counted before the next. */
async function throwDarts(id: number, darts: string[]) {
  for (const dart of darts) {
    const before = await dartsInVisit(id);
    await board(id).dart(dart);
    await expect.poll(() => dartsInVisit(id)).toBe(before + 1);
  }
}

/** Pulls the darts out: the visit ends. */
async function takeout(id: number) {
  await board(id).takeout();
  await expect.poll(async () => (await station(id)).match?.state.currentVisit ?? null).toBeNull();
}

/** A quick match of 101 single out, set up and (unless `start` is false) started. */
async function quickMatch(id: number, players: (keyof typeof ID)[], start = true) {
  await command(id, {
    type: "quickMatch",
    playerIds: players.map((p) => ID[p]),
    settings: { startScore: 101 },
  });
  if (start) await command(id, { type: "startMatch" });
}

/** The first player wins a 101: 60, the other 3, then 1 and a double 20. */
async function playOut(id: number) {
  await throwDarts(id, ["S20", "S20", "S20"]);
  await takeout(id);
  await throwDarts(id, ["S1", "S1", "S1"]);
  await takeout(id);
  await throwDarts(id, ["S1", "D20"]);
  await expect.poll(async () => (await station(id)).match?.state.phase).toBe("matchWon");
}

async function tournament() {
  return (await (await api.get("/api/admin/tournament")).json()) as TournamentAdminView;
}

/** Plays the tournament match on station 1 (40 single out: the first player's D20 wins it). */
async function playTournamentMatch() {
  await expect
    .poll(async () => (await station(1)).match?.state.phase, { timeout: 10_000 })
    .toBe("notStarted");
  await command(1, { type: "startMatch" });
  await throwDarts(1, ["D20"]);
  await expect.poll(async () => (await station(1)).match?.state.phase).toBe("matchWon");
  await command(1, { type: "closeMatch" });
}

// --- Screenshots ---------------------------------------------------------------------------------

type Sizes = Record<string, { width: number; height: number }>;

/** Opens `path` and waits until `ready` shows. */
async function open(p: Page, path: string, ready: (p: Page) => Locator) {
  await p.goto(path);
  await expect(ready(p).first()).toBeVisible();
}

const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";
/** [pattern, replacement]: the text the server stamps with the real time, made fixed. */
type Rule = [string, string];
const STAMPS: Rule[] = [
  [`\\b\\d{1,2} ${MONTH} \\d{4}\\b`, "07 Nov 2026"],
  [`\\b${MONTH} \\d{4}\\b`, "Nov 2026"],
  [`\\b\\d{2} ${MONTH}\\b`, "07 Nov"],
  ["\\b\\d{1,2}:\\d{2}\\b", "19:30"],
  ["about \\d+ (?:min|h(?: \\d{2})?)", "about 1 h 30"],
];
/** The diagnostics' numbers all change: every digit becomes 0. */
const DIGITS: Rule[] = [["\\d", "0"]];
const NUMBERS: Rule[] = [["\\d+", "0"]];

/** Rewrites the page's text by `rules`, just for the screenshot (the next render undoes it). */
async function freeze(p: Page, rules: Rule[]) {
  await p.evaluate((rules) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      let text = node.nodeValue ?? "";
      for (const [pattern, replacement] of rules)
        text = text.replace(new RegExp(pattern, "g"), replacement);
      if (text !== node.nodeValue) node.nodeValue = text;
    }
  }, rules);
}

/** Screenshots the page as it is at every size, after fonts and layout have settled. */
async function shoot(
  p: Page,
  name: string,
  sizes: Sizes,
  extra: Rule[] = [],
  mask: (p: Page) => Locator[] = () => [],
) {
  for (const [label, size] of Object.entries(sizes)) {
    await p.setViewportSize(size);
    await p.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await freeze(p, [...STAMPS, ...extra]);
    // Soft: a run reports every screenshot that differs, not just the first.
    await expect
      .soft(p)
      .toHaveScreenshot(`${name}-${label}.png`, { fullPage: true, mask: mask(p) });
  }
}

// --- The story -----------------------------------------------------------------------------------

test("before any tournament: three finished matches", async () => {
  for (const players of [
    ["Ann", "Bob"],
    ["Cid", "Dee"],
    ["Bob", "Dee"],
  ] as const) {
    await quickMatch(2, [...players]);
    await playOut(2);
    await command(2, { type: "closeMatch" });
  }

  await open(page, "/", (p) => p.getByRole("link", { name: /Station 1/ }));
  await shoot(page, "home", PAGES);

  await open(page, "/players", (p) => p.getByRole("link", { name: /Ann/ }));
  await shoot(page, "players", PAGES);

  await open(page, `/players/${ID.Ann}`, (p) => p.getByText(/since/));
  await shoot(page, "profile", PAGES);
});

test("the organiser's area", async () => {
  const anonymous = await browser.newPage();
  await anonymous.clock.setFixedTime(NOW);
  await open(anonymous, "/admin", (p) => p.getByText("Enter the PIN to unlock"));
  await shoot(anonymous, "admin-pin", PAGES);
  await anonymous.close();

  await open(page, "/admin/players", (p) => p.getByRole("button", { name: "Photo of Ann" }));
  await shoot(page, "admin-players", PAGES);
  await page.getByRole("button", { name: "Photo of Ann" }).click();
  await expect(page.getByRole("dialog", { name: "Photo of Ann" })).toBeVisible();
  await shoot(page, "admin-players-photo", PAGES);

  await open(page, "/admin/stations", (p) => p.getByRole("button", { name: "Board menu" }));
  await shoot(page, "admin-stations", PAGES);
  await page.getByRole("button", { name: "Board menu" }).first().click();
  await expect(page.getByRole("menu")).toBeVisible();
  await shoot(page, "admin-stations-menu", PAGES);

  const row = (p: Page) => p.getByRole("link", { name: /^Ann.* vs Bob/ });
  await open(page, "/admin/matches", row);
  await shoot(page, "admin-matches", PAGES);

  await open(page, "/admin/sound", (p) => p.getByRole("list", { name: "Voices" }));
  await shoot(page, "admin-sound", PAGES);

  await api.post("/api/admin/lights/devices", {
    data: { name: "Wall strip", url: `localhost:${WLED_PORT}` },
  });
  await api.put("/api/admin/lights/stations/1", {
    data: {
      deviceId: 1,
      idlePreset: 1,
      playingPreset: 2,
      events: { gameShot: { preset: 5, seconds: 8 }, s180: { preset: 6, seconds: 5 } },
    },
  });
  await open(page, "/admin/lights", (p) => p.getByText("Test strip · 9 presets"));
  await shoot(page, "admin-lights", PAGES);

  await open(page, "/admin/diagnostics", (p) => p.getByRole("table").first());
  await shoot(page, "admin-diagnostics", PAGES, DIGITS);
});

test("a quick match on station 1", async () => {
  const watch = await loggedIn();
  const display = await loggedIn();

  await open(page, "/station/1", (p) => p.getByRole("heading", { name: "New match" }));
  await shoot(page, "station-new-match", PAGES);
  await page.getByRole("button", { name: /^Ann/ }).click();
  await page.getByRole("button", { name: /^Bob/ }).click();
  await shoot(page, "station-new-match-picked", PAGES);

  await quickMatch(1, ["Ann", "Bob"], false);
  await open(page, "/station/1", (p) => p.getByRole("button", { name: "Move Ann down" }));
  await shoot(page, "station-lineup", PAGES);

  await command(1, { type: "startMatch" });
  await throwDarts(1, ["S20", "S20"]);
  await open(page, "/station/1", (p) => p.getByRole("button", { name: /Correct dart 2/ }));
  await shoot(page, "station-visit", PAGES);
  await open(watch, "/watch/1", (p) => p.getByText("S20").nth(1));
  await shoot(watch, "watch-visit", BIG_SCREENS);
  await open(display, "/display", (p) => p.getByText("S20").nth(1));
  await shoot(display, "display-no-tournament", SCREENS);

  await page.getByRole("button", { name: /Correct dart 1/ }).click();
  await expect(page.getByRole("dialog", { name: "Correct S20" })).toBeVisible();
  await shoot(page, "station-correcting", PAGES);
  await page.reload();

  await throwDarts(1, ["S20"]);
  await takeout(1);
  await throwDarts(1, ["S1", "S1", "S1"]);
  await takeout(1);
  await throwDarts(1, ["S1", "D20"]);
  await open(page, "/station/1", (p) => p.getByText("Game shot"));
  await shoot(page, "station-game-shot", PAGES);
  await open(watch, "/watch/1", (p) => p.getByText("Game shot"));
  await shoot(watch, "watch-game-shot", BIG_SCREENS);
  await command(1, { type: "closeMatch" });

  await watch.close();
  await display.close();
});

test("Around the Clock on station 1", async () => {
  const watch = await loggedIn();
  const display = await loggedIn();
  await command(1, {
    type: "quickMatch",
    playerIds: [ID.Ann, ID.Bob, ID.Cid],
    settings: { mode: "aroundTheClock" },
  });
  await command(1, { type: "startMatch" });
  await throwDarts(1, ["S1", "D2", "M5"]);
  await takeout(1);
  await throwDarts(1, ["S1"]);

  await open(page, "/station/1", (p) => p.getByRole("img", { name: "Aim at 2" }));
  await shoot(page, "station-around-the-clock", PAGES);
  await open(watch, "/watch/1", (p) => p.getByRole("img", { name: "Aim at 2" }));
  await shoot(watch, "watch-around-the-clock", BIG_SCREENS);
  await open(display, "/display", (p) => p.getByText("Bob"));
  await shoot(display, "display-around-the-clock", SCREENS);

  await takeout(1);
  await throwDarts(1, ["M1", "M1", "M1"]);
  await takeout(1);
  const rest = [...Array.from({ length: 18 }, (_, i) => `S${i + 3}`), "25"];
  for (let i = 0; i < rest.length; i += 3) {
    await throwDarts(1, rest.slice(i, i + 3));
    if (i + 3 >= rest.length) break;
    await takeout(1);
    for (let other = 0; other < 2; other++) {
      await throwDarts(1, ["M1", "M1", "M1"]);
      await takeout(1);
    }
  }
  await open(page, "/station/1", (p) => p.getByText("Game shot"));
  await shoot(page, "station-around-the-clock-won", PAGES);
  await open(watch, "/watch/1", (p) => p.getByText("Game shot"));
  await shoot(watch, "watch-around-the-clock-won", BIG_SCREENS);
  await command(1, { type: "closeMatch" });

  await watch.close();
  await display.close();
});

test("High Score on station 1, into sudden death", async () => {
  const watch = await loggedIn();
  await command(1, {
    type: "quickMatch",
    playerIds: [ID.Ann, ID.Bob, ID.Cid],
    settings: { mode: "highScore", rounds: 1 },
  });
  await command(1, { type: "startMatch" });
  await throwDarts(1, ["T20", "S20", "S5"]);
  await takeout(1);
  await throwDarts(1, ["S1", "S1", "M1"]);
  await takeout(1);
  await throwDarts(1, ["T20", "S5", "S20"]);
  await takeout(1);
  await throwDarts(1, ["T20"]);

  await open(page, "/station/1", (p) => p.getByText(/Sudden death/).first());
  await shoot(page, "station-high-score-sudden-death", PAGES);
  await open(watch, "/watch/1", (p) => p.getByText(/Sudden death/).first());
  await shoot(watch, "watch-high-score-sudden-death", BIG_SCREENS);

  await throwDarts(1, ["S1", "S1"]);
  await takeout(1);
  await throwDarts(1, ["S1", "S1", "S1"]);
  await open(page, "/station/1", (p) => p.getByText("Game shot"));
  await shoot(page, "station-high-score-won", PAGES);
  await command(1, { type: "closeMatch" });

  await watch.close();
});

test("Golf on station 1, 18 holes", async () => {
  const watch = await loggedIn();
  await command(1, {
    type: "quickMatch",
    playerIds: [ID.Ann, ID.Bob, ID.Cid, ID.Dee, ID.Eve, ID.Fay],
    settings: { mode: "golf", holes: 18, course: "inOrder" },
  });
  await command(1, { type: "startMatch" });
  const hole1 = [["T1"], ["S1", "D1"], ["M1", "M1", "M1"], ["S1"], ["D1", "T1"], ["S20", "S1"]];
  for (const darts of hole1) {
    await throwDarts(1, darts);
    await takeout(1);
  }
  await throwDarts(1, ["S2", "D2"]);

  await open(page, "/station/1", (p) => p.getByRole("img", { name: /Hole 2/ }));
  await shoot(page, "station-golf", PAGES);
  await open(watch, "/watch/1", (p) => p.getByRole("img", { name: /Hole 2/ }));
  await shoot(watch, "watch-golf", BIG_SCREENS);
  await command(1, { type: "abandonMatch" });

  await watch.close();
});

test("Killer on station 1", async () => {
  const watch = await loggedIn();
  await command(1, {
    type: "quickMatch",
    playerIds: [ID.Ann, ID.Bob, ID.Cid],
    settings: { mode: "killer", lives: 3 },
  });
  await command(1, { type: "startMatch" });
  const state = (await station(1)).match?.state;
  const numbers = state?.mode === "killer" ? state.players.map((p) => p.number) : [];
  const [ann, bob, cid] = numbers as [number, number, number];
  await throwDarts(1, [`T${ann}`, `D${bob}`, `S${cid}`]);
  await takeout(1);
  await throwDarts(1, [`S${bob}`]);

  const drawn = (p: Page) => [p.getByRole("img", { name: /Charge up|Doubles of/ })];
  await open(page, "/station/1", (p) => p.getByText(/Charge 1\/3/));
  await shoot(page, "station-killer", PAGES, NUMBERS, drawn);
  await open(watch, "/watch/1", (p) => p.getByText(/Charge 1\/3/));
  await shoot(watch, "watch-killer", BIG_SCREENS, NUMBERS, drawn);
  await command(1, { type: "abandonMatch" });

  await watch.close();
});

test("Cricket on station 1", async () => {
  const watch = await loggedIn();
  await command(1, {
    type: "quickMatch",
    playerIds: [ID.Ann, ID.Bob, ID.Cid],
    settings: { mode: "cricket" },
  });
  await command(1, { type: "startMatch" });
  for (const darts of [
    ["T20", "T20", "S19"],
    ["T20", "D18", "M3"],
    ["S17", "25", "BULL"],
    ["T19", "S20", "S16"],
  ]) {
    await throwDarts(1, darts);
    await takeout(1);
  }
  await throwDarts(1, ["T18"]);

  await open(page, "/station/1", (p) => p.getByRole("table", { name: "Cricket marks" }));
  await shoot(page, "station-cricket", PAGES);
  await open(watch, "/watch/1", (p) => p.getByRole("table", { name: "Cricket marks" }));
  await shoot(watch, "watch-cricket", BIG_SCREENS);
  await command(1, { type: "abandonMatch" });

  await watch.close();
});

test("Random Checkout on station 1", async () => {
  const watch = await loggedIn();
  await command(1, {
    type: "quickMatch",
    playerIds: [ID.Ann, ID.Bob, ID.Cid],
    settings: { mode: "randomCheckout", difficulty: "beginner", rounds: 10 },
  });
  await command(1, { type: "startMatch" });
  const state = (await station(1)).match?.state;
  const target = state?.mode === "randomCheckout" ? state.target : 0;
  // Beginner is single out, so Ann finishes with singles.
  await throwDarts(1, target <= 20 ? [`S${target}`] : ["S20", `S${target - 20}`]);
  await takeout(1);
  await throwDarts(1, ["M3", "M3", "M3"]);
  await takeout(1);
  await throwDarts(1, ["S1"]);

  const drawn = (p: Page) => [
    p.getByRole("region", { name: "Checkout" }),
    p.getByRole("img", { name: /Aim at|Check out/ }),
  ];
  await open(page, "/station/1", (p) => p.getByText("✓ Checked out"));
  await shoot(page, "station-random-checkout", PAGES, [], drawn);
  await open(watch, "/watch/1", (p) => p.getByText("✓ Checked out"));
  await shoot(watch, "watch-random-checkout", BIG_SCREENS, [], drawn);
  await command(1, { type: "abandonMatch" });

  await watch.close();
});

test("Bermuda on station 1", async () => {
  const watch = await loggedIn();
  await command(1, {
    type: "quickMatch",
    playerIds: [ID.Ann, ID.Bob, ID.Cid],
    settings: { mode: "bermuda" },
  });
  await command(1, { type: "startMatch" });
  for (const darts of [
    ["T12", "S12", "M5"],
    ["S12", "M9", "M9"],
    ["D12", "S5", "S12"],
    ["S13", "T13", "M6"],
    ["M3", "M3", "M3"],
  ]) {
    await throwDarts(1, darts);
    await takeout(1);
  }
  await throwDarts(1, ["S13"]);

  await open(page, "/station/1", (p) => p.getByText("Halved"));
  await shoot(page, "station-bermuda", PAGES);
  await open(watch, "/watch/1", (p) => p.getByText("Halved"));
  await shoot(watch, "watch-bermuda", BIG_SCREENS);
  await command(1, { type: "abandonMatch" });

  await watch.close();
});

test("a tournament on station 1, station 2 busy", async () => {
  const display = await loggedIn();
  // A running quick match of two players outside the tournament keeps station 2 out of it.
  await quickMatch(2, ["Eve", "Fay"]);

  const created = await api.post("/api/admin/tournament", {
    data: {
      name: "Visual night",
      playerIds: [ID.Ann, ID.Bob, ID.Cid, ID.Dee],
      config: {
        format: { elimination: "single" },
        legs: { groups: 1, winners: 1, losers: 1, final: 1 },
        x01: { startScore: 40 },
      },
    },
  });
  expect(created.ok(), await created.text()).toBe(true);
  await open(page, "/admin/tournament", (p) => p.getByRole("button", { name: "Start tournament" }));
  await shoot(page, "admin-tournament-draft", PAGES);

  await api.post("/api/admin/tournament/start");
  await expect.poll(async () => (await station(1)).match?.label ?? null).not.toBeNull();
  await open(page, "/admin/tournament", (p) =>
    p.getByRole("img", { name: /of \d+ matches played/ }),
  );
  await shoot(page, "admin-tournament-groups", PAGES);
  await open(display, "/display", (p) => p.getByText(/Group/).first());
  await shoot(display, "display-groups", SCREENS);

  while ((await tournament()).progress?.phase === "groups") await playTournamentMatch();
  await expect.poll(async () => (await station(1)).match?.state.phase).toBe("notStarted");
  await open(page, "/admin/tournament", (p) => p.getByText(/Knockout/).first());
  await shoot(page, "admin-tournament-knockout", PAGES);
  await open(display, "/display", (p) => p.getByText(/final/i).first());
  await shoot(display, "display-knockout", SCREENS);

  while ((await tournament()).tournament?.status === "running") await playTournamentMatch();
  await open(page, "/admin/tournament", (p) => p.getByText("Champion").first());
  await shoot(page, "admin-tournament-finished", PAGES);
  await open(display, "/display", (p) => p.getByText(/Champion/i).first());
  await shoot(display, "display-finished", SCREENS);

  await open(page, "/tournaments", (p) => p.getByRole("link", { name: /Visual night/ }));
  await shoot(page, "tournaments", PAGES);
  await page.getByRole("link", { name: /Visual night/ }).click();
  await expect(page.getByRole("heading", { name: "Visual night" })).toBeVisible();
  await shoot(page, "tournament", PAGES);
  await page
    .getByRole("link", { name: /Ann.*Cid|Cid.*Ann/ })
    .last()
    .click();
  await expect(page.getByText(/Leg 1/)).toBeVisible();
  await shoot(page, "match", PAGES);

  await display.close();
});

test("Daylight: the station, /watch and a profile on the light theme", async () => {
  const watch = await loggedIn();
  for (const p of [page, watch]) {
    await p.goto(BASE_URL);
    await p.evaluate(() => localStorage.setItem("n4-theme", "daylight"));
  }
  await quickMatch(1, ["Ann", "Bob"]);
  await throwDarts(1, ["T20", "S20"]);

  await open(page, "/station/1", (p) => p.getByRole("button", { name: /Correct dart 2/ }));
  await shoot(page, "daylight-station-visit", PAGES);
  await open(watch, "/watch/1", (p) => p.getByText("S20").first());
  await shoot(watch, "daylight-watch-visit", BIG_SCREENS);
  await open(page, `/players/${ID.Ann}`, (p) => p.getByRole("heading", { name: "Ann" }));
  await shoot(page, "daylight-profile", PAGES);

  await command(1, { type: "abandonMatch" });
  await page.evaluate(() => localStorage.removeItem("n4-theme"));
  await watch.close();
});
