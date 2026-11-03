// The room's lights (wled-lights): which WLED device lights which station, the station's base
// presets, and what each match moment starts. Admin → Lights changes it; the routes are in
// lightsRoutes.ts.

import type {
  EventLight,
  LightDevice,
  LightDeviceTest,
  LightEvent,
  LightsAdminView,
  StationLights,
} from "../api.ts";
import type { Db } from "../db.ts";
import { type WledClient, WledError } from "./wled.ts";

export const LIGHT_EVENTS: LightEvent[] = [
  "matchStart",
  "legWon",
  "gameShot",
  "s180",
  "bust",
  "highCheckout",
];

const MAX_SECONDS = 600;

/** Why a change or a test was refused. */
export class LightsError extends Error {
  readonly reason: "invalid" | "missing" | "unreachable";
  constructor(message: string, reason: LightsError["reason"]) {
    super(message);
    this.reason = reason;
  }
}

const noLights = (stationId: number): StationLights => ({
  stationId,
  deviceId: null,
  idlePreset: null,
  playingPreset: null,
  events: {},
});

function usableName(value: unknown) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) throw new LightsError("a device needs a name", "invalid");
  return name;
}

function usableUrl(value: unknown) {
  const raw = typeof value === "string" ? value.trim() : "";
  const url = /^https?:\/\//.test(raw) ? raw : `http://${raw}`;
  try {
    const parsed = new URL(url);
    if (!raw || !parsed.hostname) throw new Error();
    return url.replace(/\/+$/, "");
  } catch {
    throw new LightsError("a device needs an address, e.g. 192.168.1.50", "invalid");
  }
}

function preset(value: unknown, what: string): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 250) {
    throw new LightsError(`${what} must be a preset number from 1 to 250`, "invalid");
  }
  return value as number;
}

function events(value: unknown): Partial<Record<LightEvent, EventLight>> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object") throw new LightsError("events must be an object", "invalid");
  const out: Partial<Record<LightEvent, EventLight>> = {};
  for (const [event, light] of Object.entries(value as Record<string, unknown>)) {
    if (!LIGHT_EVENTS.includes(event as LightEvent)) {
      throw new LightsError(`no such event: ${event}`, "invalid");
    }
    if (light === null) continue;
    const { preset: p, seconds } = (light ?? {}) as { preset?: unknown; seconds?: unknown };
    const id = preset(p, `${event}'s preset`);
    if (id === null) continue;
    if (
      !Number.isInteger(seconds) ||
      (seconds as number) < 1 ||
      (seconds as number) > MAX_SECONDS
    ) {
      throw new LightsError(`${event} runs from 1 to ${MAX_SECONDS} seconds`, "invalid");
    }
    out[event as LightEvent] = { preset: id, seconds: seconds as number };
  }
  return out;
}

export function createLights(db: Db, wled: WledClient) {
  const device = (id: number): LightDevice => {
    const found = db.lightDevices().find((d) => d.id === id);
    if (!found) throw new LightsError("no such device", "missing");
    return found;
  };

  /** A station's lights; a station without any set up gets the empty set. */
  function ofStation(stationId: number): StationLights {
    return db.stationLights().find((l) => l.stationId === stationId) ?? noLights(stationId);
  }

  async function reach<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error) {
      if (error instanceof WledError) throw new LightsError(error.message, "unreachable");
      throw error;
    }
  }

  return {
    ofStation,

    view(): LightsAdminView {
      return {
        devices: db.lightDevices(),
        stations: db.stationConfigs().map((s) => ({ ...ofStation(s.id), name: s.name })),
      };
    },

    addDevice(input: { name?: unknown; url?: unknown }): LightDevice {
      return db.saveLightDevice({ name: usableName(input.name), url: usableUrl(input.url) });
    },

    updateDevice(id: number, input: { name?: unknown; url?: unknown }): LightDevice {
      const current = device(id);
      return db.saveLightDevice({
        id,
        name: input.name === undefined ? current.name : usableName(input.name),
        url: input.url === undefined ? current.url : usableUrl(input.url),
      });
    },

    removeDevice(id: number) {
      device(id);
      db.deleteLightDevice(id);
    },

    saveStation(stationId: number, input: Partial<Record<keyof StationLights, unknown>>) {
      if (!db.getStationConfig(stationId)) throw new LightsError("no such station", "missing");
      const current = ofStation(stationId);
      const deviceId = input.deviceId === undefined ? current.deviceId : input.deviceId;
      if (deviceId !== null && !Number.isInteger(deviceId)) {
        throw new LightsError("deviceId must be a device's id or null", "invalid");
      }
      if (deviceId !== null) device(deviceId as number);
      const next: StationLights = {
        stationId,
        deviceId: deviceId as number | null,
        idlePreset:
          input.idlePreset === undefined ? current.idlePreset : preset(input.idlePreset, "idle"),
        playingPreset:
          input.playingPreset === undefined
            ? current.playingPreset
            : preset(input.playingPreset, "playing"),
        events: input.events === undefined ? current.events : events(input.events),
      };
      db.saveStationLights(next);
      return next;
    },

    /** Asks the device who it is and which presets it has. */
    async testDevice(id: number): Promise<LightDeviceTest> {
      const { url } = device(id);
      const info = await reach(() => wled.info(url));
      const presets = await reach(() => wled.presets(url));
      return { ...info, presets };
    },

    /** Starts the event's preset on the station's device once. */
    async testEvent(stationId: number, event: unknown) {
      if (!LIGHT_EVENTS.includes(event as LightEvent)) {
        throw new LightsError(`no such event: ${String(event)}`, "invalid");
      }
      const lights = ofStation(stationId);
      if (lights.deviceId === null) throw new LightsError("the station has no device", "invalid");
      const light = lights.events[event as LightEvent];
      if (!light) throw new LightsError("the event has no preset", "invalid");
      const { url } = device(lights.deviceId);
      await reach(() => wled.setPreset(url, light.preset));
    },
  };
}

export type Lights = ReturnType<typeof createLights>;
