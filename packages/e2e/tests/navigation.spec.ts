// Client-side navigation (web-router 02): links change the page without loading a document,
// Back works, and only the current screen keeps live streams open.

import { expect, test } from "./fixtures.ts";

const AGENT = "n4-navigation-test";
test.use({ userAgent: AGENT });

test("links navigate without reloading, Back returns, old streams close", async ({ page, n4 }) => {
  await n4.login(page);
  const documents: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => r.resourceType() === "document" && documents.push(r.url()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await page.getByRole("link", { name: /Admin/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const tabs = page.getByRole("navigation", { name: "Admin sections" });
  for (const tab of ["Players", "Stations", "Matches", "Tournament", "Players"]) {
    await tabs.getByRole("link", { name: tab }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/${tab.toLowerCase()}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  // Only the players tab's stream is open now; the other tabs' closed as they went.
  await expect
    .poll(async () => {
      const view = await (await n4.api.get("/api/admin/diagnostics")).json();
      return (view.streams as { kind: string; userAgent: string }[])
        .filter((s) => s.userAgent === AGENT)
        .map((s) => s.kind);
    })
    .toEqual(["admin players"]);

  await page.getByRole("link", { name: "n4-darts" }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: /Players and stats/ }).click();
  await expect(page.getByRole("heading", { name: "Players" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle("n4-darts");
  await page.goForward();
  await expect(page).toHaveTitle("Players · n4-darts");

  expect(documents).toHaveLength(1);
  expect(errors).toEqual([]);
});
