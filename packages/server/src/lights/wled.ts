// Talks to a WLED light controller on the LAN through its JSON API (docs/adr/0009): what it is,
// its presets, and starting one. Every call gives up after a short timeout.

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
      const info = (await ask(url, "/json/info")) as { name?: unknown; ver?: unknown };
      if (typeof info?.name !== "string") throw new WledError(`${url} isn't a WLED device`);
      return { name: info.name, version: String(info.ver ?? "") };
    },

    /** Saved presets by id; WLED's empty slot 0 and playlists without a name are left out. */
    async presets(url: string): Promise<WledPreset[]> {
      const all = (await ask(url, "/presets.json")) as Record<string, { n?: unknown }>;
      return Object.entries(all ?? {})
        .map(([id, preset]) => ({ id: Number(id), name: preset?.n }))
        .filter((p): p is WledPreset => p.id > 0 && typeof p.name === "string")
        .sort((a, b) => a.id - b.id);
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
