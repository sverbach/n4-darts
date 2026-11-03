import { afterEach, describe, expect, it } from "vitest";
import { createWledSim, type WledSim } from "./sim.ts";

let sim: WledSim | undefined;
afterEach(async () => {
  await sim?.close();
  sim = undefined;
});

describe("wled-sim", () => {
  it("answers info and presets, and starts a preset", async () => {
    sim = await createWledSim({ name: "Test", presets: ["Idle", "Party"] });
    expect(await (await fetch(`${sim.url}/json/info`)).json()).toMatchObject({ name: "Test" });
    expect(await (await fetch(`${sim.url}/presets.json`)).json()).toEqual({
      "0": {},
      "1": { n: "Idle", on: true, bri: 128 },
      "2": { n: "Party", on: true, bri: 128 },
    });

    const res = await fetch(`${sim.url}/json/state`, { method: "POST", body: '{"ps":2}' });
    expect(res.ok).toBe(true);
    expect(sim.preset).toBe(2);
    expect(sim.started).toEqual([2]);
  });

  it("refuses an unknown preset", async () => {
    sim = await createWledSim({ presets: ["Idle"] });
    const res = await fetch(`${sim.url}/json/state`, { method: "POST", body: '{"ps":5}' });
    expect(res.status).toBe(400);
    expect(sim.preset).toBeNull();
  });

  it("drops every request while offline", async () => {
    sim = await createWledSim();
    sim.setOnline(false);
    await expect(fetch(`${sim.url}/json/info`)).rejects.toThrow();
    sim.setOnline(true);
    expect((await fetch(`${sim.url}/json/info`)).ok).toBe(true);
  });
});
