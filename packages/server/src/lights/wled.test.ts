import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createWledSim, type WledSim } from "@n4/wled-sim";
import { afterEach, describe, expect, it } from "vitest";
import { createWledClient, WledError } from "./wled.ts";

let sim: WledSim | undefined;
let standIn: Server | undefined;
afterEach(async () => {
  await sim?.close();
  sim = undefined;
  await new Promise((resolve) => (standIn ? standIn.close(resolve) : resolve(null)));
  standIn = undefined;
});

/** A device that answers each path with the given JSON, whatever it is. */
async function answering(answers: Record<string, unknown>): Promise<string> {
  standIn = createServer((req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(answers[req.url ?? ""] ?? null));
  });
  await new Promise<void>((resolve) => standIn?.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(standIn.address() as AddressInfo).port}`;
}

describe("the WLED client", () => {
  it("reads the device's name and its presets", async () => {
    sim = await createWledSim({ name: "Room lights", presets: ["Idle", "Party"] });
    const wled = createWledClient();
    expect(await wled.info(sim.url)).toMatchObject({ name: "Room lights" });
    expect(await wled.presets(`${sim.url}/`)).toEqual([
      { id: 1, name: "Idle" },
      { id: 2, name: "Party" },
    ]);
  });

  it("starts a preset", async () => {
    sim = await createWledSim();
    await createWledClient().setPreset(sim.url, 5);
    expect(sim.preset).toBe(5);
  });

  it("gives up on a device that's too slow", async () => {
    sim = await createWledSim();
    sim.setDelay(500);
    const wled = createWledClient({ timeoutMs: 100 });
    await expect(wled.info(sim.url)).rejects.toThrow(/didn't answer within 0.1 s/);
  });

  it("says when a device can't be reached", async () => {
    sim = await createWledSim();
    sim.setOnline(false);
    const error = await createWledClient()
      .setPreset(sim.url, 1)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(WledError);
    expect(String(error)).toMatch(/can't be reached/);
  });

  it("says when a preset doesn't exist", async () => {
    sim = await createWledSim({ presets: ["Idle"] });
    await expect(createWledClient().setPreset(sim.url, 9)).rejects.toThrow(/answered 400/);
  });
});

describe("what a device answers", () => {
  it.each([
    ["info without a name", { ver: "0.15.0" }],
    ["info that isn't an object", ["Room lights"]],
    ["info with a name that isn't text", { name: 5 }],
  ])("isn't a WLED device with %s", async (_, info) => {
    const url = await answering({ "/json/info": info });
    await expect(createWledClient().info(url)).rejects.toThrow(`${url} isn't a WLED device`);
  });

  it("gives an empty version when the device doesn't say", async () => {
    const url = await answering({ "/json/info": { name: "Wall" } });
    expect(await createWledClient().info(url)).toEqual({ name: "Wall", version: "" });
    const odd = await answering({ "/json/info": { name: "Wall", ver: 15 } });
    expect((await createWledClient().info(odd)).version).toBe("");
  });

  it.each([
    ["a list", [{ n: "Idle" }]],
    ["text", "presets"],
    ["nothing", null],
  ])("isn't a WLED device with presets as %s", async (_, presets) => {
    const url = await answering({ "/presets.json": presets });
    await expect(createWledClient().presets(url)).rejects.toThrow(`${url} isn't a WLED device`);
  });

  it("keeps only the named presets, by id", async () => {
    const url = await answering({
      "/presets.json": {
        "0": {},
        "3": { n: "Party", on: true },
        "1": { n: "Idle" },
        "2": { playlist: { ps: [1, 3] } },
        x: { n: "Not an id" },
        "4": "Broken",
        "5": { n: 7 },
      },
    });
    expect(await createWledClient().presets(url)).toEqual([
      { id: 1, name: "Idle" },
      { id: 3, name: "Party" },
    ]);
  });
});
