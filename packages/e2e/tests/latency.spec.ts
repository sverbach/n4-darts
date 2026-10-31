// Dart to screen (perf-tests ticket 02): with the station, /display and /watch/1 open, every dart
// has to show on the station page within 150 ms, and it mustn't grow over the match (the same
// rules as the server load test, packages/server/src/testing/load/load.test.ts).

import { board, expect, test } from "./fixtures.ts";

const DARTS = 300;
const BLOCK = 50;
const MAX_MS = 150;
const GROWTH = 4;
/** Below this a median is noise. */
const NOISE_MS = 5;

declare global {
  interface Window {
    /** When the visit's dart tiles changed, and how many darts it then showed. */
    tiles: { at: number; darts: number }[];
  }
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

test("darts reach the station page quickly, all match long", async ({
  browser,
  page,
  n4,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "measured once, on the kiosk's layout");
  test.setTimeout(90_000);
  // 701, and only singles: nobody finishes, so every visit is three darts and a takeout.
  await n4.quickMatch(1, ["Ann", "Bob"], { startScore: 701 });
  const others = [await browser.newPage(), await browser.newPage()];
  await others[0]?.goto("/display");
  await others[1]?.goto("/watch/1");

  await page.goto("/station/1");
  const visit = page.getByRole("region", { name: "Current visit" });
  await expect(visit.getByText("Ann to throw")).toBeVisible();
  // Records each change of the dart tiles, as the page renders it.
  await page.evaluate(() => {
    window.tiles = [];
    const region = document.querySelector('[aria-label="Current visit"]') as Element;
    const count = () => region.querySelectorAll('[aria-label^="Correct dart"]').length;
    let last = count();
    new MutationObserver(() => {
      const darts = count();
      if (darts === last) return;
      last = darts;
      window.tiles.push({ at: Date.now(), darts });
    }).observe(region, { subtree: true, childList: true, attributes: true });
  });

  const board1 = board(1);
  const times: number[] = [];
  for (let n = 0; n < DARTS; n++) {
    const inVisit = (n % 3) + 1;
    const from = await page.evaluate(() => window.tiles.length);
    const thrownAt = Date.now();
    await board1.dart("S1");
    const shownAt = await page
      .waitForFunction(
        ([from, darts]) => window.tiles.slice(from).find((t) => t.darts === darts)?.at,
        [from, inVisit] as const,
        { timeout: 5000 },
      )
      .then((handle) => handle.jsonValue());
    times.push((shownAt as number) - thrownAt);
    // Already failed: stop here rather than throw hundreds more slow darts.
    if ((shownAt as number) - thrownAt > MAX_MS) break;
    if (inVisit === 3) {
      await board1.takeout();
      await expect(visit.getByRole("button", { name: /Correct dart/ })).toHaveCount(0);
    }
  }
  for (const other of others) await other.close();

  const blocks = [];
  for (let i = 0; i < times.length; i += BLOCK) {
    const block = times.slice(i, i + BLOCK);
    blocks.push(
      `darts ${i + 1}–${i + block.length}: median ${median(block)} ms, slowest ${Math.max(...block)} ms`,
    );
  }
  const report = `\n${blocks.join("\n")}`;
  await testInfo.attach("latency", { body: report, contentType: "text/plain" });
  console.log(`dart to station page:${report}`);

  expect(Math.max(...times), report).toBeLessThan(MAX_MS);
  const first = median(times.slice(0, BLOCK));
  const last = median(times.slice(-BLOCK));
  expect(last, report).toBeLessThanOrEqual(GROWTH * Math.max(first, NOISE_MS));
});
