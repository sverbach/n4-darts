import { WLED_PORT } from "../src/ports.ts";
import { expect, test } from "./fixtures.ts";

const wledState = async () =>
  (await (await fetch(`http://localhost:${WLED_PORT}/sim/state`)).json()) as { preset: number };

test("Admin → Lights: add a device, test it, map an event, test that", async ({ page, n4 }) => {
  const name = `Strip ${test.info().project.name}`;
  await n4.login(page);
  await page.goto("/admin/lights");

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Address").fill(`localhost:${WLED_PORT}`);
  await page.getByRole("button", { name: "Add device" }).click();

  const device = page.getByRole("listitem").filter({ hasText: name });
  await device.getByRole("button", { name: "Test connection" }).click();
  await expect(device.getByText("Test strip · 9 presets")).toBeVisible();

  const station = page.getByRole("listitem").filter({ hasText: "Station 1" });
  await station.getByLabel("Device").selectOption({ label: name });
  await station.getByLabel("Game shot preset").selectOption({ label: "5 · Game shot" });
  await expect(station.getByLabel("Game shot seconds")).toHaveValue("5");

  await station
    .getByRole("listitem", { name: "Game shot" })
    .getByRole("button", { name: "Test" })
    .click();
  await expect.poll(async () => (await wledState()).preset).toBe(5);
});
