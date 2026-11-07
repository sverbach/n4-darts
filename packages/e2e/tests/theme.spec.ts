import { expect, test } from "./fixtures.ts";

test("the theme star moves on to the next theme, and the choice stays after a reload", async ({
  page,
}) => {
  await page.goto("/players");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme");

  await page.getByRole("button", { name: /^Theme: Unit violet/ }).click();
  await expect(html).toHaveAttribute("data-theme", "cyan");
  await expect(page.getByRole("status").filter({ hasText: "Terminal cyan" })).toBeAttached();

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "cyan");
  await expect(page.getByRole("button", { name: /^Theme: Terminal cyan/ })).toBeVisible();
});
