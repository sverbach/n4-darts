import type { Page } from "@playwright/test";
import { board, expect, test } from "./fixtures.ts";

declare global {
  interface Window {
    played: string[];
  }
}

async function recordCalls(page: Page) {
  await page.addInitScript(() => {
    window.played = [];
    const urls = new WeakMap<ArrayBuffer, string>();
    const buffers = new WeakMap<AudioBuffer, string>();
    const arrayBuffer = Response.prototype.arrayBuffer;
    Response.prototype.arrayBuffer = async function () {
      const data = await arrayBuffer.call(this);
      urls.set(data, new URL(this.url).pathname);
      return data;
    };
    const decode = BaseAudioContext.prototype.decodeAudioData;
    BaseAudioContext.prototype.decodeAudioData = async function (
      this: BaseAudioContext,
      data: ArrayBuffer,
    ) {
      const url = urls.get(data);
      const buffer = await decode.call(this, data);
      if (url) buffers.set(buffer, url);
      return buffer;
    } as typeof decode;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.played.push((this.buffer && buffers.get(this.buffer)) ?? "?");
      return start.apply(this, args);
    };
  });
}

const played = (page: Page) => page.evaluate(() => window.played);

test("the station calls the visit with sound on, and nothing with it off", async ({ page, n4 }) => {
  const board1 = board(1);
  await recordCalls(page);
  await n4.quickMatch(1, ["Ann", "Bob"]);
  await page.goto("/station/1");
  const visit = page.getByRole("region", { name: "Current visit" });
  await expect(visit.getByText("Ann to throw")).toBeVisible();

  await page.getByRole("button", { name: "Board menu" }).click();
  await page.getByRole("menuitem", { name: "Turn sound on" }).click();
  for (const dart of ["T20", "S20", "S5"]) await board1.dart(dart);
  await board1.takeout();
  await expect.poll(() => played(page)).toEqual(["/callouts/default/85.mp3"]);

  await page.getByRole("button", { name: "Board menu" }).click();
  await page.getByRole("menuitem", { name: "Turn sound off" }).click();
  for (const dart of ["S1", "S1", "S1"]) await board1.dart(dart);
  await board1.takeout();
  await expect(visit.getByText("Ann to throw")).toBeVisible();
  await page.waitForTimeout(500);
  expect(await played(page)).toEqual(["/callouts/default/85.mp3"]);
});

test("/watch remembers sound on, and plays after a tap", async ({ page, n4 }) => {
  const board1 = board(1);
  await recordCalls(page);
  await n4.quickMatch(1, ["Ann", "Bob"], { startScore: 40 });
  await page.goto("/watch/1");
  await expect(page.getByText("Ann to throw")).toBeVisible();

  const speaker = page.getByRole("button", { name: "Sound" });
  await expect(speaker).toHaveAttribute("aria-pressed", "false");
  await speaker.click();
  await expect(speaker).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  const prompt = page.getByRole("button", { name: "Tap to turn sound on" });
  await expect(prompt).toBeVisible();
  await page.locator("main").click();
  await expect(prompt).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sound" })).toHaveAttribute("aria-pressed", "true");

  await board1.dart("S20");
  await board1.dart("D10");
  await expect.poll(() => played(page)).toEqual(["/callouts/default/matchshot.mp3"]);
});

test("an uploaded pack is used for its calls, the default voice for the rest", async ({
  page,
  n4,
}) => {
  const { readFileSync } = await import("node:fs");
  const { zipSync } = await import("fflate");
  const admin = (await (await n4.api.get("/api/admin/callouts")).json()) as {
    packs: { id: string }[];
  };
  for (const pack of admin.packs) await n4.api.delete(`/api/admin/callouts/${pack.id}`);

  const recording = readFileSync(
    new URL("../../web/public/callouts/default/180.mp3", import.meta.url),
  );
  const zip = zipSync({ "Test Voice/60.mp3": recording, "Test Voice/gameon.mp3": recording });

  await n4.login(page);
  await page.goto("/admin/sound");
  await page.getByLabel("Voice pack (zip)").setInputFiles({
    name: "Test Voice.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(zip),
  });
  await page.getByRole("button", { name: "Upload pack" }).click();
  const voices = page.getByRole("list", { name: "Voices" });
  const card = voices.getByRole("listitem").filter({ hasText: "Test Voice" });
  await expect(card).toContainText("1 of 184 calls");
  await card.getByRole("button", { name: "Use" }).click();
  await expect(card.getByText("In use")).toBeVisible();

  const board1 = board(1);
  await recordCalls(page);
  await n4.quickMatch(1, ["Ann", "Bob"]);
  await page.goto("/station/1");
  await page.getByRole("button", { name: "Board menu" }).click();
  await page.getByRole("menuitem", { name: "Turn sound on" }).click();
  for (const dart of ["S20", "S20", "S20"]) await board1.dart(dart);
  await board1.takeout();
  await expect
    .poll(() => played(page))
    .toEqual([expect.stringMatching(/^\/api\/callouts\/.+\/60\.mp3$/)]);
  for (const dart of ["S1", "S1", "S1"]) await board1.dart(dart);
  await board1.takeout();
  await expect.poll(() => played(page)).toHaveLength(2);
  expect((await played(page))[1]).toBe("/callouts/default/3.mp3");

  await page.goto("/admin/sound");
  page.once("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "Delete" }).click();
  await expect(card).toHaveCount(0);
  await expect(
    voices.getByRole("listitem").filter({ hasText: "Default voice" }).getByText("In use"),
  ).toBeVisible();
});
