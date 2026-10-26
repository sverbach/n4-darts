import { expect, test } from "./fixtures.ts";

test("End match from the board menu ends a running match", async ({ page, n4 }) => {
  await n4.quickMatch(1, ["Ann", "Bob"]);
  await page.goto("/station/1");
  await expect(page.getByText("Ann to throw")).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Board menu" }).click();
  await page.getByRole("menuitem", { name: "End match" }).click();

  await expect(page.getByRole("heading", { name: "New match" })).toBeVisible();
  expect((await n4.station(1)).match).toBeNull();
});

test("Cancel match from the board menu drops a match that hasn't started", async ({ page, n4 }) => {
  await n4.command(1, { type: "quickMatch", playerIds: [n4.players.Ann, n4.players.Bob] });
  await page.goto("/station/1");
  await expect(page.getByRole("heading", { name: "Ann vs Bob" })).toBeVisible();

  await page.getByRole("button", { name: "Board menu" }).click();
  await page.getByRole("menuitem", { name: "Cancel match" }).click();

  await expect(page.getByRole("heading", { name: "New match" })).toBeVisible();
  expect((await n4.station(1)).match).toBeNull();
});
