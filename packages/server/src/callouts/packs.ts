import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { unzipSync } from "fflate";
import type { CalloutPackView, CalloutsAdminView, CallPack } from "../api.ts";

export const CALL_KEYS: readonly string[] = [
  ...Array.from({ length: 181 }, (_, n) => String(n)),
  "gameshot",
  "matchshot",
  "busted",
];

export const MAX_PACK_BYTES = 50 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 200 * 1024 * 1024;
const DEFAULT_URL = "/callouts/default";
const FILE = /^(\d{1,3}|gameshot|matchshot|busted)(?:\+[^/]*)?\.(mp3|wav)$/i;
const STORED = /^[a-z0-9]+(?:\+\d+)?\.(?:mp3|wav)$/;
const ID = /^[0-9a-f-]{36}$/;
const KNOWN = new Set(CALL_KEYS);

export class PackError extends Error {
  readonly reason: "invalid" | "missing" | "unavailable";
  constructor(message: string, reason: "invalid" | "missing" | "unavailable") {
    super(message);
    this.reason = reason;
  }
}

interface StoredPack {
  name: string;
  uploadedAt: string;
  files: Record<string, string[]>;
}

export interface CalloutPacks {
  admin(): CalloutsAdminView;
  add(name: string, zip: Uint8Array): CalloutPackView;
  remove(id: string): void;
  activate(id: string | null): void;
  pack(): CallPack;
  file(id: string, name: string): { data: Buffer; type: string } | null;
}

function callKey(path: string): { key: string; ext: string } | null {
  const match = FILE.exec(path.split("/").at(-1) ?? "");
  if (!match) return null;
  const key = (match[1] as string).toLowerCase();
  const normalized = /^\d+$/.test(key) ? String(Number(key)) : key;
  if (!KNOWN.has(normalized)) return null;
  return { key: normalized, ext: (match[2] as string).toLowerCase() };
}

function unpack(zip: Uint8Array): Map<string, { ext: string; data: Uint8Array }[]> {
  let total = 0;
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zip, {
      filter: (file) => {
        if (file.name.startsWith("__MACOSX/") || !callKey(file.name)) return false;
        total += file.originalSize;
        if (total > MAX_UNPACKED_BYTES)
          throw new PackError("The pack is too big unpacked.", "invalid");
        return true;
      },
    });
  } catch (error) {
    if (error instanceof PackError) throw error;
    throw new PackError("That isn't a zip file.", "invalid");
  }
  const calls = new Map<string, { ext: string; data: Uint8Array }[]>();
  for (const path of Object.keys(entries).sort()) {
    const call = callKey(path) as { key: string; ext: string };
    const data = entries[path] as Uint8Array;
    if (data.length === 0) continue;
    calls.set(call.key, [...(calls.get(call.key) ?? []), { ext: call.ext, data }]);
  }
  return calls;
}

function packName(name: string): string {
  const trimmed = name
    .replace(/\.zip$/i, "")
    .replace(/\p{Cc}/gu, "")
    .trim()
    .slice(0, 80);
  return trimmed || "Uploaded pack";
}

export function createCalloutPacks(dir: string | undefined): CalloutPacks {
  const activeFile = dir && join(dir, "active.json");

  const read = (id: string): StoredPack | null => {
    if (!dir || !ID.test(id)) return null;
    try {
      return JSON.parse(readFileSync(join(dir, id, "pack.json"), "utf8")) as StoredPack;
    } catch {
      return null;
    }
  };

  const ids = (): string[] =>
    dir && existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && read(entry.name))
          .map((entry) => entry.name)
      : [];

  const active = (): string | null => {
    if (!activeFile) return null;
    try {
      const id = (JSON.parse(readFileSync(activeFile, "utf8")) as { id: string | null }).id;
      return id && read(id) ? id : null;
    } catch {
      return null;
    }
  };

  const view = (id: string, pack: StoredPack): CalloutPackView => ({
    id,
    name: pack.name,
    uploadedAt: pack.uploadedAt,
    keys: Object.keys(pack.files).length,
    files: Object.values(pack.files).reduce((sum, files) => sum + files.length, 0),
    missing: CALL_KEYS.filter((key) => !pack.files[key]),
  });

  return {
    admin() {
      const packs = ids()
        .map((id) => view(id, read(id) as StoredPack))
        .sort((a, b) => a.uploadedAt.localeCompare(b.uploadedAt));
      return { active: active(), uploads: Boolean(dir), packs };
    },

    add(name, zip) {
      if (!dir)
        throw new PackError("Packs can't be stored: the server has no data folder.", "unavailable");
      const calls = unpack(zip);
      if (calls.size === 0) {
        throw new PackError(
          "No calls found. A darts-caller pack has files like 60.mp3, gameshot.mp3 and busted.mp3.",
          "invalid",
        );
      }
      const id = randomUUID();
      const folder = join(dir, id);
      mkdirSync(folder, { recursive: true });
      const files: Record<string, string[]> = {};
      for (const [key, variants] of calls) {
        files[key] = variants.map(({ ext, data }, i) => {
          const file = `${key}${i ? `+${i}` : ""}.${ext}`;
          writeFileSync(join(folder, file), data);
          return file;
        });
      }
      const pack: StoredPack = {
        name: packName(name),
        uploadedAt: new Date().toISOString(),
        files,
      };
      writeFileSync(join(folder, "pack.json"), JSON.stringify(pack));
      return view(id, pack);
    },

    remove(id) {
      if (!dir || !read(id)) throw new PackError("No such pack.", "missing");
      if (active() === id) this.activate(null);
      rmSync(join(dir, id), { recursive: true, force: true });
    },

    activate(id) {
      if (!activeFile)
        throw new PackError("Packs can't be stored: the server has no data folder.", "unavailable");
      if (id !== null && !read(id)) throw new PackError("No such pack.", "missing");
      mkdirSync(dir, { recursive: true });
      writeFileSync(activeFile, JSON.stringify({ id }));
    },

    pack() {
      const id = active();
      const chosen = id ? read(id) : null;
      return Object.fromEntries(
        CALL_KEYS.map((key) => {
          const files = chosen?.files[key];
          return [
            key,
            files
              ? files.map((file) => `/api/callouts/${id}/${encodeURIComponent(file)}`)
              : [`${DEFAULT_URL}/${key}.mp3`],
          ];
        }),
      );
    },

    file(id, name) {
      if (!dir || !STORED.test(name) || !read(id)) return null;
      try {
        const data = readFileSync(join(dir, id, name));
        return { data, type: name.endsWith(".wav") ? "audio/wav" : "audio/mpeg" };
      } catch {
        return null;
      }
    },
  };
}
