import { createWledSim, type WledSim } from "@n4/wled-sim";
import { afterEach, describe, expect, it } from "vitest";
import type { LightDevice, LightsAdminView, StationLights } from "../api.ts";
import { buildApp } from "../app.ts";
import { type Db, openDb } from "../db.ts";
import { createWledClient } from "./wled.ts";

let db: Db | undefined;
let sim: WledSim | undefined;
afterEach(async () => {
  db?.close();
  db = undefined;
  await sim?.close();
  sim = undefined;
});

function setup(path = ":memory:", adminPin?: string) {
  db = openDb(path);
  for (const id of [1, 2]) db.saveStation({ id, name: `Station ${id}`, boardUrl: "http://x" });
  const app = buildApp({ db, adminPin, wled: createWledClient({ timeoutMs: 200 }) });
  const call = async (method: string, url: string, payload?: object) => {
    const res = await app.inject({
      method: method as "GET",
      url: `/api/admin/lights${url}`,
      ...(payload ? { payload } : {}),
    });
    return { status: res.statusCode, body: res.body ? res.json() : null };
  };
  return { app, call };
}

describe("lights configuration", () => {
  it("lists every station, with no lights to begin with", async () => {
    const { call } = setup();
    expect((await call("GET", "")).body).toEqual({
      devices: [],
      stations: [
        {
          stationId: 1,
          name: "Station 1",
          deviceId: null,
          idlePreset: null,
          playingPreset: null,
          events: {},
        },
        {
          stationId: 2,
          name: "Station 2",
          deviceId: null,
          idlePreset: null,
          playingPreset: null,
          events: {},
        },
      ],
    } satisfies LightsAdminView);
  });

  it("adds, renames and removes a device", async () => {
    const { call } = setup();
    const added = await call("POST", "/devices", { name: "Wall", url: "192.168.1.50/" });
    expect(added).toEqual({
      status: 201,
      body: { id: 1, name: "Wall", url: "http://192.168.1.50" },
    });
    expect((await call("PATCH", "/devices/1", { name: "Wall strip" })).body).toMatchObject({
      name: "Wall strip",
    });
    expect((await call("POST", "/devices", { name: "", url: "x" })).status).toBe(400);
    expect((await call("POST", "/devices", { name: "No address", url: "" })).status).toBe(400);

    await call("PUT", "/stations/1", { deviceId: 1, idlePreset: 1 });
    expect((await call("DELETE", "/devices/1")).status).toBe(204);
    const { body } = await call("GET", "");
    expect(body.devices).toEqual([]);
    expect(body.stations[0]).toMatchObject({ deviceId: null, idlePreset: 1 });
    expect((await call("DELETE", "/devices/1")).status).toBe(404);
  });

  it("saves a station's device, base presets and event presets", async () => {
    const { call } = setup();
    const device = (await call("POST", "/devices", { name: "Wall", url: "http://w" }))
      .body as LightDevice;
    const saved = await call("PUT", "/stations/2", {
      deviceId: device.id,
      idlePreset: 1,
      playingPreset: 2,
      events: { gameShot: { preset: 5, seconds: 8 }, s180: { preset: 6, seconds: 5 }, bust: null },
    });
    expect(saved.body).toEqual({
      stationId: 2,
      deviceId: device.id,
      idlePreset: 1,
      playingPreset: 2,
      events: { gameShot: { preset: 5, seconds: 8 }, s180: { preset: 6, seconds: 5 } },
    } satisfies StationLights);

    expect(
      (await call("PUT", "/stations/2", { events: { nope: { preset: 1, seconds: 1 } } })).status,
    ).toBe(400);
    expect(
      (await call("PUT", "/stations/2", { events: { bust: { preset: 1, seconds: 0 } } })).status,
    ).toBe(400);
    expect((await call("PUT", "/stations/2", { idlePreset: 0 })).status).toBe(400);
    expect((await call("PUT", "/stations/2", { deviceId: 99 })).status).toBe(404);
    expect((await call("PUT", "/stations/9", {})).status).toBe(404);
  });

  it("keeps the settings across a restart", async () => {
    const path = `${process.env.TMPDIR ?? "/tmp"}/n4-lights-${Date.now()}.db`;
    let { call } = setup(path);
    await call("POST", "/devices", { name: "Wall", url: "http://w" });
    await call("PUT", "/stations/1", {
      deviceId: 1,
      playingPreset: 2,
      events: { legWon: { preset: 4, seconds: 3 } },
    });
    db?.close();

    ({ call } = setup(path));
    const { body } = await call("GET", "");
    expect(body.devices).toEqual([{ id: 1, name: "Wall", url: "http://w" }]);
    expect(body.stations[0]).toMatchObject({
      deviceId: 1,
      playingPreset: 2,
      events: { legWon: { preset: 4, seconds: 3 } },
    });
  });

  it("tests a device: its name and presets, or why it can't be reached", async () => {
    sim = await createWledSim({ name: "Wall strip", presets: ["Idle", "Party"] });
    const { call } = setup();
    await call("POST", "/devices", { name: "Wall", url: sim.url });
    expect((await call("POST", "/devices/1/test")).body).toMatchObject({
      name: "Wall strip",
      presets: [
        { id: 1, name: "Idle" },
        { id: 2, name: "Party" },
      ],
    });
    sim.setOnline(false);
    const offline = await call("POST", "/devices/1/test");
    expect(offline.status).toBe(502);
    expect(offline.body.error).toMatch(/can't be reached/);
  });

  it("tests an event: its preset starts once", async () => {
    sim = await createWledSim();
    const { call } = setup();
    await call("POST", "/devices", { name: "Wall", url: sim.url });
    await call("PUT", "/stations/1", {
      deviceId: 1,
      events: { gameShot: { preset: 5, seconds: 8 } },
    });

    expect((await call("POST", "/stations/1/test", { event: "gameShot" })).status).toBe(204);
    expect(sim.started).toEqual([5]);
    expect((await call("POST", "/stations/1/test", { event: "bust" })).status).toBe(400);
    expect((await call("POST", "/stations/2/test", { event: "gameShot" })).status).toBe(400);
  });

  it("needs the admin PIN", async () => {
    const { call } = setup(":memory:", "1234");
    expect((await call("GET", "")).status).toBe(401);
  });
});

describe("a lights request that doesn't fit", () => {
  it.each([
    ["no name", { url: "http://w" }, "a device needs a name"],
    ["a blank name", { name: "  ", url: "http://w" }, "a device needs a name"],
    ["no address", { name: "Wall" }, "a device needs an address, e.g. 192.168.1.50"],
    [
      "an address that isn't one",
      { name: "Wall", url: "http://" },
      "a device needs an address, e.g. 192.168.1.50",
    ],
    ["an unknown field", { name: "Wall", url: "http://w", leds: 60 }, /leds/],
  ])("refuses a device with %s, and adds none", async (_, payload, error) => {
    const { call } = setup();

    const res = await call("POST", "/devices", payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(error);
    expect((await call("GET", "")).body.devices).toEqual([]);
  });

  it("cleans up an address: http:// added, no trailing slash", async () => {
    const { call } = setup();

    const res = await call("POST", "/devices", { name: " Wall ", url: " 192.168.1.50/ " });
    expect(res.body).toMatchObject({ name: "Wall", url: "http://192.168.1.50" });
  });

  it.each([
    ["an unknown event", { events: { nope: { preset: 1, seconds: 1 } } }, "no such event: nope"],
    ["events that aren't an object", { events: "bust" }, "events must be an object"],
    [
      "a preset of 0",
      { events: { bust: { preset: 0, seconds: 3 } } },
      "bust's preset must be a preset number from 1 to 250",
    ],
    ["a preset of 251", { idlePreset: 251 }, "idle must be a preset number from 1 to 250"],
    [
      "seconds that aren't whole",
      { events: { s180: { preset: 2, seconds: 1.5 } } },
      "s180 runs from 1 to 600 seconds",
    ],
    [
      "too many seconds",
      { events: { s180: { preset: 2, seconds: 601 } } },
      "s180 runs from 1 to 600 seconds",
    ],
    [
      "an event without seconds",
      { events: { legWon: { preset: 2 } } },
      "legWon runs from 1 to 600 seconds",
    ],
    ["a device id as text", { deviceId: "1" }, "deviceId must be a device's id or null"],
    ["an unknown field", { stationId: 2 }, /stationId/],
  ])(
    "refuses a station's lights with %s, and they stay as they were",
    async (_, payload, error) => {
      const { call } = setup();
      await call("PUT", "/stations/2", {
        idlePreset: 1,
        events: { bust: { preset: 3, seconds: 2 } },
      });

      const res = await call("PUT", "/stations/2", payload);
      expect(res.status).toBe(400);
      expect(res.body.error).toEqual(
        error instanceof RegExp ? expect.stringMatching(error) : error,
      );
      expect((await call("GET", "")).body.stations[1]).toMatchObject({
        idlePreset: 1,
        events: { bust: { preset: 3, seconds: 2 } },
      });
    },
  );

  it("refuses testing an unknown event, or a station id that isn't a number", async () => {
    const { call } = setup();

    const unknown = await call("POST", "/stations/1/test", { event: "confetti" });
    expect(unknown.status).toBe(400);
    expect(unknown.body.error).toBe("no such event: confetti");
    expect((await call("POST", "/stations/one/test", { event: "bust" })).status).toBe(400);
  });
});
