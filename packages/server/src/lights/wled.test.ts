import { createWledSim, type WledSim } from "@n4/wled-sim";
import { afterEach, describe, expect, it } from "vitest";
import { createWledClient, WledError } from "./wled.ts";

let sim: WledSim | undefined;
afterEach(async () => {
  await sim?.close();
  sim = undefined;
});

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
