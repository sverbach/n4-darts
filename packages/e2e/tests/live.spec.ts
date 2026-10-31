import { board, expect, test } from "./fixtures.ts";

test("/display and /watch/1 follow the same match live", async ({ browser, page, n4 }) => {
  await n4.quickMatch(1, ["Ann", "Bob"]);
  await page.goto("/display");
  const watch = await browser.newPage({ viewport: page.viewportSize() });
  await watch.goto("/watch/1");

  const card = page.getByRole("link", { name: /Station 1/ });
  await expect(card).toContainText("Ann");
  await expect(card).toContainText("301");
  await expect(watch.getByText("Ann", { exact: true }).first()).toBeVisible();

  await board(1).dart("T20");
  await expect(card).toContainText("241");
  await expect(card).toContainText("T20");
  await expect(watch.getByText("241", { exact: true })).toBeVisible();

  await board(1).dart("S5");
  await expect(card).toContainText("236");
  await expect(watch.getByText("236", { exact: true })).toBeVisible();
  await watch.close();
});

test("a player added at one station shows in /admin and at the other station", async ({
  browser,
  page,
  n4,
}) => {
  const name = `Zed ${Date.now() % 100000}`;
  await n4.login(page);
  await page.goto("/admin/players");
  const other = await browser.newPage({ viewport: page.viewportSize() });
  await other.goto("/station/2");
  const station = await browser.newPage({ viewport: page.viewportSize() });
  await station.goto("/station/1");
  await expect(other.getByRole("button", { name: /Ann/ })).toBeVisible();

  await station.getByLabel("New player").fill(name);
  await station.getByRole("button", { name: "Add" }).click();

  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(other.getByRole("button", { name: new RegExp(name) })).toBeVisible();

  // Renamed in /admin: the stations follow.
  const players = (await (await n4.api.get("/api/admin/players")).json()) as {
    id: string;
    name: string;
  }[];
  const id = players.find((p) => p.name === name)?.id as string;
  await n4.api.patch(`/api/admin/players/${id}`, { data: { name: `${name}b` } });
  await expect(other.getByRole("button", { name: new RegExp(`${name}b`) })).toBeVisible();

  await n4.api.delete(`/api/admin/players/${id}`);
  await other.close();
  await station.close();
});
