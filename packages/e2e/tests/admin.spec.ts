import { PIN } from "../src/ports.ts";
import { board, expect, test } from "./fixtures.ts";

test("the PIN screen unlocks /admin", async ({ page, n4: _ }) => {
  await page.goto("/admin");
  await expect(page.getByText("Enter PIN to unlock")).toBeVisible();

  await page.getByLabel("PIN").fill("0000");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByRole("alert")).toHaveText("Wrong PIN");

  await page.getByLabel("PIN").fill(PIN);
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByRole("navigation", { name: "Admin sections" })).toBeVisible();
});

test("a small tournament: create, start, play one match, correct a dart", async ({ page, n4 }) => {
  test.setTimeout(60_000);
  await n4.login(page);

  // Create and start it in /admin. An earlier test's tournament may be on show: start a new one.
  await n4.api.delete("/api/admin/tournament");
  await page.goto("/admin/tournament");
  const newTournament = page.getByRole("button", { name: "New tournament" });
  const name = page.getByLabel("Name");
  await expect(newTournament.or(name)).toBeVisible();
  if (await newTournament.isVisible()) await newTournament.click();
  await name.fill("E2E night");
  for (const name of ["Ann", "Bob", "Cid"]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
  }
  await page.getByRole("button", { name: "Create draft" }).click();
  await page.getByRole("button", { name: "Start tournament" }).click();
  await expect(page.getByRole("img", { name: /^0 of \d+ matches played/ })).toBeVisible();

  // The scheduler puts the first match on a station; play it there (301, single out).
  let on = 0;
  await expect(async () => {
    on = (await n4.station(1)).match ? 1 : (await n4.station(2)).match ? 2 : 0;
    expect(on).toBeGreaterThan(0);
  }).toPass();
  const station = await page.context().newPage();
  await station.goto(`/station/${on}`);
  await station.getByRole("button", { name: "Start" }).click();
  const visit = station.getByRole("region", { name: "Current visit" });
  await expect(visit.getByText(/to throw/)).toBeVisible();
  const board1 = board(on);
  const visits = [
    ["T20", "T20", "T20"],
    ["M17", "M17", "M17"],
    ["T20", "T20", "S1"],
  ];
  for (const [i, darts] of visits.entries()) {
    for (const dart of darts) await board1.dart(dart);
    if (i < visits.length - 1) {
      await expect(visit.getByText("Remove darts")).toBeVisible();
      await board1.takeout();
    }
  }
  await expect(station.getByRole("heading", { name: "Game shot" })).toBeVisible();
  await station.getByRole("button", { name: "Done" }).click();
  await board1.takeout();
  await station.close();

  await expect(page.getByRole("img", { name: /1 of \d+ matches played/ }).first()).toBeVisible();

  // Correct one of the loser's misses in the match detail: the result stands.
  await page.goto("/admin/matches");
  await page.getByRole("button", { name: / vs / }).first().click();
  const misses = page.getByRole("button", { name: "Correct Miss" });
  await expect(misses).toHaveCount(3);
  await misses.first().click();
  const picker = page.getByRole("dialog", { name: "Correct Miss" });
  await picker.getByRole("button", { name: "Single" }).click();
  await picker.getByRole("button", { name: "1", exact: true }).click();
  await expect(misses).toHaveCount(2);
});
