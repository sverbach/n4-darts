import type { TournamentAdminView } from "@n4/server/api";
import type { Page } from "@playwright/test";
import { PUBLIC_PIN, PUBLIC_URL } from "../src/ports.ts";
import { board, expect, test } from "./fixtures.ts";

/** What the public site may ask the server for. */
const PUBLIC_API = [
  /^\/api\/public\/(session|login)$/,
  /^\/api\/players\/stats$/,
  /^\/api\/players\/[^/]+\/(stats|photo)$/,
  /^\/api\/tournaments(\/[^/]+)?$/,
  /^\/api\/matches\/[^/]+$/,
];
/** Links that lead into the room's pages. */
const ROOM_LINK = /^\/(admin|station|watch|display)?(\/|$)/;

async function roomLinks(page: Page) {
  const hrefs = await page
    .locator("a[href]")
    .evaluateAll((links) => links.map((a) => new URL((a as HTMLAnchorElement).href).pathname));
  return hrefs.filter((href) => ROOM_LINK.test(href));
}

test("the public site: log in, then a profile, a tournament and a match", async ({
  browser,
  n4,
}) => {
  test.setTimeout(90_000);

  // A finished tournament in the room: Ann, Bob and Cid, every match won by its first dart.
  const name = `Public night ${test.info().project.name}`;
  await n4.api.delete("/api/admin/tournament");
  await n4.api.post("/api/admin/tournament", {
    data: {
      name,
      playerIds: ["Ann", "Bob", "Cid"].map((name) => n4.players[name]),
      config: {
        format: { elimination: "single" },
        legs: { groups: 1, winners: 1, losers: 1, final: 1 },
        x01: { startScore: 40 },
      },
    },
  });
  await n4.api.post("/api/admin/tournament/start");
  const status = async () =>
    ((await (await n4.api.get("/api/admin/tournament")).json()) as TournamentAdminView).tournament
      ?.status;
  while ((await status()) === "running") {
    for (const id of [1, 2]) {
      const match = (await n4.station(id)).match;
      if (match?.state.phase !== "notStarted") continue;
      await n4.command(id, { type: "startMatch" });
      await board(id).dart("D20");
      await expect.poll(async () => (await n4.station(id)).match?.state.phase).toBe("matchWon");
      await n4.command(id, { type: "closeMatch" });
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // A phone outside the room.
  const context = await browser.newContext({ baseURL: PUBLIC_URL });
  const page = await context.newPage();
  const asked: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) asked.push(url.pathname);
  });

  await page.goto("/admin");
  await page.getByLabel("Enter the group's password").fill("wrong");
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.getByRole("alert")).toHaveText("Wrong password");
  await page.getByLabel("Enter the group's password").fill(PUBLIC_PIN);
  await page.getByRole("button", { name: "Open" }).click();

  await expect(page).toHaveURL(/\/players$/);
  await expect(page.getByRole("heading", { name: "Players" })).toBeVisible();
  expect(await roomLinks(page)).toEqual([]);

  await page.getByRole("link", { name: /Ann/ }).first().click();
  await expect(page.getByRole("heading", { name: "Ann" })).toBeVisible();
  expect(await roomLinks(page)).toEqual([]);

  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  expect(await roomLinks(page)).toEqual([]);

  await page.locator('a[href^="/matches/"]').first().click();
  await expect(page.getByText(/Leg 1/)).toBeVisible();
  expect(await roomLinks(page)).toEqual([]);

  await page.goto("/station/1");
  await expect(page).toHaveURL(/\/players$/);

  expect(asked.filter((path) => !PUBLIC_API.some((allowed) => allowed.test(path)))).toEqual([]);
  await context.close();
});
