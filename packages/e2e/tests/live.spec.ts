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
