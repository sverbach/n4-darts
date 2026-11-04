// Talks to a WLED light controller on the LAN through its JSON API (docs/adr/0009): what it is,
// its presets, and starting one. Every call gives up after a short timeout, and what the device
// answers is parsed before it's used (docs/adr/0010).

import { z } from "zod";

export interface WledInfo {
  name: string;
  version: string;
}

export interface WledPreset {
  id: number;
  name: string;
}

/** A device that didn't answer, or answered with something else than expected. */
export class WledError extends Error {}

const DEFAULT_TIMEOUT_MS = 2000;

/** `GET /json/info`: WLED sends much more; only these two are used. */
const InfoAnswer = z.looseObject({ name: z.string(), ver: z.string().optional().catch(undefined) });

/** `GET /presets.json`: preset id to preset; `n` is its name. */
const PresetsAnswer = z.record(z.string(), z.unknown());
const NamedPreset = z.looseObject({ n: z.string() });
const PresetId = z.coerce.number().int().min(1);

export function createWledClient(options: { timeoutMs?: number } = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function ask(url: string, path: string, init: RequestInit = {}): Promise<unknown> {
    const base = url.replace(/\/+$/, "");
    let res: Response;
    try {
      res = await fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      throw new WledError(
        timedOut
          ? `${base} didn't answer within ${timeoutMs / 1000} s`
          : `${base} can't be reached`,
      );
    }
    if (!res.ok) throw new WledError(`${base} answered ${res.status}`);
    try {
      return await res.json();
    } catch {
      throw new WledError(`${base} isn't a WLED device`);
    }
  }

  return {
    async info(url: string): Promise<WledInfo> {
      const info = InfoAnswer.safeParse(await ask(url, "/json/info"));
      if (!info.success) throw new WledError(`${url} isn't a WLED device`);
      return { name: info.data.name, version: info.data.ver ?? "" };
    },

    /** Saved presets by id; WLED's empty slot 0 and playlists without a name are left out. */
    async presets(url: string): Promise<WledPreset[]> {
      const all = PresetsAnswer.safeParse(await ask(url, "/presets.json"));
      if (!all.success) throw new WledError(`${url} isn't a WLED device`);
      const presets: WledPreset[] = [];
      for (const [key, value] of Object.entries(all.data)) {
        const id = PresetId.safeParse(key);
        const preset = NamedPreset.safeParse(value);
        if (id.success && preset.success) presets.push({ id: id.data, name: preset.data.n });
      }
      return presets.sort((a, b) => a.id - b.id);
    },

    async setPreset(url: string, id: number): Promise<void> {
      await ask(url, "/json/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ps: id }),
      });
    },
  };
}

export type WledClient = ReturnType<typeof createWledClient>;
