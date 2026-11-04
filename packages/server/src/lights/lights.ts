// The room's lights (wled-lights): which WLED device lights which station, the station's base
// presets, and what each match moment starts. Admin → Lights changes it; the routes are in
// lightsRoutes.ts.

import type {
  LightDevice,
  LightDeviceChangesInput,
  LightDeviceTest,
  LightEvent,
  LightsAdminView,
  NewLightDeviceInput,
  StationLights,
  StationLightsInput,
} from "../api.ts";
import type { Db } from "../db.ts";
import { type WledClient, WledError } from "./wled.ts";

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

export function createLights(
  db: Db,
  wled: WledClient,
  /** Told when a test started an event's preset, so the base comes back after it. */
  played?: (stationId: number, seconds: number) => void,
) {
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

    addDevice(input: NewLightDeviceInput): LightDevice {
      return db.saveLightDevice(input);
    },

    updateDevice(id: number, input: LightDeviceChangesInput): LightDevice {
      const current = device(id);
      return db.saveLightDevice({
        id,
        name: input.name ?? current.name,
        url: input.url ?? current.url,
      });
    },

    removeDevice(id: number) {
      device(id);
      db.deleteLightDevice(id);
    },

    saveStation(stationId: number, input: StationLightsInput) {
      if (!db.getStationConfig(stationId)) throw new LightsError("no such station", "missing");
      const current = ofStation(stationId);
      const deviceId = input.deviceId === undefined ? current.deviceId : input.deviceId;
      if (deviceId !== null) device(deviceId);
      const next: StationLights = {
        stationId,
        deviceId,
        idlePreset: input.idlePreset === undefined ? current.idlePreset : input.idlePreset,
        playingPreset:
          input.playingPreset === undefined ? current.playingPreset : input.playingPreset,
        events: input.events ?? current.events,
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

    /** Starts the event's preset on the station's device, as if it had happened. */
    async testEvent(stationId: number, event: LightEvent) {
      const lights = ofStation(stationId);
      if (lights.deviceId === null) throw new LightsError("the station has no device", "invalid");
      const light = lights.events[event];
      if (!light) throw new LightsError("the event has no preset", "invalid");
      const { url } = device(lights.deviceId);
      await reach(() => wled.setPreset(url, light.preset));
      played?.(stationId, light.seconds);
    },
  };
}

export type Lights = ReturnType<typeof createLights>;
