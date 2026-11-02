import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { zipSync } from "fflate";
import { afterEach, describe, expect, it } from "vitest";
import type { CalloutPackView, CalloutsAdminView, CallPack } from "../api.ts";
import { buildApp } from "../app.ts";
import { MAX_PACK_BYTES } from "./packs.ts";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const sound = (fill: number) => new Uint8Array(32).fill(fill);

function setup(options: { dir?: boolean } = {}) {
  let calloutsDir: string | undefined;
  if (options.dir ?? true) {
    calloutsDir = mkdtempSync(join(tmpdir(), "n4-callouts-"));
    dirs.push(calloutsDir);
  }
  const app = buildApp(calloutsDir ? { calloutsDir } : {});
  const upload = (zip: Uint8Array, name = "Ivy.zip", type = "application/zip") =>
    app.inject({
      method: "POST",
      url: `/api/admin/callouts?name=${encodeURIComponent(name)}`,
      headers: { "content-type": type },
      payload: Buffer.from(zip),
    });
  const admin = async () => (await app.inject("/api/admin/callouts")).json() as CalloutsAdminView;
  const pack = async () => (await app.inject("/api/callouts")).json() as CallPack;
  const activate = (id: string | null) =>
    app.inject({ method: "PUT", url: "/api/admin/callouts/active", payload: { id } });
  return { app, upload, admin, pack, activate };
}

describe("voice packs", () => {
  it("offers the default voice for every call when no pack is active", async () => {
    const { pack } = setup();
    const keys = await pack();
    expect(Object.keys(keys)).toHaveLength(184);
    expect(keys["180"]).toEqual(["/callouts/default/180.mp3"]);
    expect(keys.busted).toEqual(["/callouts/default/busted.mp3"]);
  });

  it("unpacks a darts-caller zip, keeping known calls and their variants", async () => {
    const { app, upload, admin, pack, activate } = setup();
    const zip = zipSync({
      "en-US-Ivy-Female/60.mp3": sound(1),
      "en-US-Ivy-Female/gameshot.mp3": sound(2),
      "en-US-Ivy-Female/gameshot+1.mp3": sound(3),
      "en-US-Ivy-Female/gameshot+BEST.wav": sound(4),
      "en-US-Ivy-Female/gameon.mp3": sound(5),
      "en-US-Ivy-Female/181.mp3": sound(6),
      "en-US-Ivy-Female/readme.txt": sound(7),
      "__MACOSX/en-US-Ivy-Female/._60.mp3": sound(8),
    });
    const res = await upload(zip);
    expect(res.statusCode).toBe(201);
    const added = res.json() as CalloutPackView;
    expect(added).toMatchObject({ name: "Ivy", keys: 2, files: 4 });
    expect(added.missing).toHaveLength(182);
    expect(added.missing).not.toContain("60");

    expect((await admin()).packs.map((p) => p.id)).toEqual([added.id]);
    expect((await admin()).active).toBeNull();

    expect((await activate(added.id)).statusCode).toBe(200);
    expect((await admin()).active).toBe(added.id);
    const keys = await pack();
    expect(keys["60"]).toEqual([`/api/callouts/${added.id}/60.mp3`]);
    const gameshot = keys.gameshot ?? [];
    expect(gameshot).toHaveLength(3);
    expect(gameshot).toContain(`/api/callouts/${added.id}/gameshot.mp3`);
    expect(keys["100"]).toEqual(["/callouts/default/100.mp3"]);

    const file = await app.inject(gameshot.find((url) => url.endsWith(".wav")) as string);
    expect(file.statusCode).toBe(200);
    expect(file.headers["content-type"]).toBe("audio/wav");
    expect(file.rawPayload.equals(Buffer.from(sound(4)))).toBe(true);
    expect((await app.inject(`/api/callouts/${added.id}/pack.json`)).statusCode).toBe(404);
    expect((await app.inject(`/api/callouts/${added.id}/..%2Fx.mp3`)).statusCode).toBe(404);
  });

  it("refuses a broken zip and a zip without calls", async () => {
    const { upload, admin } = setup();
    const broken = await upload(new Uint8Array([1, 2, 3, 4]));
    expect(broken.statusCode).toBe(400);
    expect(broken.json().error).toMatch(/zip/);

    const empty = await upload(zipSync({ "readme.txt": sound(1), "gameon.mp3": sound(2) }));
    expect(empty.statusCode).toBe(400);
    expect(empty.json().error).toMatch(/No calls found/);
    expect((await admin()).packs).toEqual([]);
  });

  it("refuses a zip over the size limit", async () => {
    const { upload } = setup();
    const res = await upload(new Uint8Array(MAX_PACK_BYTES + 1));
    expect(res.statusCode).toBe(413);
  });

  it("deletes a pack, and the default voice takes over if it was active", async () => {
    const { app, upload, admin, pack, activate } = setup();
    const { id } = (await upload(zipSync({ "60.mp3": sound(1) }))).json() as CalloutPackView;
    await activate(id);
    const res = await app.inject({ method: "DELETE", url: `/api/admin/callouts/${id}` });
    expect(res.statusCode).toBe(200);
    expect(await admin()).toMatchObject({ active: null, packs: [] });
    expect((await pack())["60"]).toEqual(["/callouts/default/60.mp3"]);
    expect((await app.inject(`/api/callouts/${id}/60.mp3`)).statusCode).toBe(404);
    expect((await activate(id)).statusCode).toBe(404);
  });

  it("goes back to the default voice", async () => {
    const { upload, pack, activate } = setup();
    const { id } = (await upload(zipSync({ "60.mp3": sound(1) }))).json() as CalloutPackView;
    await activate(id);
    expect((await activate(null)).statusCode).toBe(200);
    expect((await pack())["60"]).toEqual(["/callouts/default/60.mp3"]);
  });

  it("offers only the default voice without a data folder", async () => {
    const { upload, admin } = setup({ dir: false });
    expect(await admin()).toEqual({ active: null, uploads: false, packs: [] });
    expect((await upload(zipSync({ "60.mp3": sound(1) }))).statusCode).toBe(409);
  });
});
