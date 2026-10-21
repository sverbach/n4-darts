import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { DisplayView, Player } from "./api.ts";
import { buildApp } from "./app.ts";
import { backupIfDue, backupsIn } from "./backups.ts";
import { type Db, openDb } from "./db.ts";

let db: Db;
afterEach(() => db?.close());

/** A tiny stand-in JPEG: the signature is all the server checks. */
const jpeg = (fill = 1, size = 64) => {
  const data = Buffer.alloc(size, fill);
  data.set([0xff, 0xd8, 0xff, 0xe0]);
  return data;
};

function setup(adminPin?: string) {
  db = openDb(":memory:");
  db.addPlayer({ id: "ann", name: "Ann", archived: false });
  const app = buildApp({ db, adminPin });
  const upload = (id: string, body: Buffer, type = "image/jpeg") =>
    app.inject({
      method: "PUT",
      url: `/api/admin/players/${id}/photo`,
      headers: { "content-type": type },
      payload: body,
    });
  return { app, upload };
}

describe("player photos", () => {
  it("uploads, serves with a version, replaces and removes a photo", async () => {
    const { app, upload } = setup();
    const res = await upload("ann", jpeg(1));
    expect(res.statusCode).toBe(200);
    const version = (res.json() as Player).photo as string;
    expect(version).toBeTruthy();
    expect((await app.inject("/api/players")).json()[0].photo).toBe(version);

    const photo = await app.inject(`/api/players/ann/photo?v=${encodeURIComponent(version)}`);
    expect(photo.headers["content-type"]).toBe("image/jpeg");
    expect(photo.headers["cache-control"]).toMatch(/immutable/);
    expect(photo.rawPayload.equals(jpeg(1))).toBe(true);
    expect((await app.inject("/api/players/ann/photo")).headers["cache-control"]).toBe("no-cache");

    await new Promise((r) => setTimeout(r, 2));
    const replaced = (await upload("ann", jpeg(2))).json() as Player;
    expect(replaced.photo).not.toBe(version);
    expect((await app.inject("/api/players/ann/photo")).rawPayload.equals(jpeg(2))).toBe(true);

    const removed = await app.inject({ method: "DELETE", url: "/api/admin/players/ann/photo" });
    expect((removed.json() as Player).photo).toBeNull();
    expect((await app.inject("/api/players/ann/photo")).statusCode).toBe(404);
  });

  it("refuses what isn't a JPEG, a photo that's too big, and unknown players", async () => {
    const { upload } = setup();
    expect((await upload("ann", Buffer.from("not a jpeg"))).statusCode).toBe(400);
    expect((await upload("ann", jpeg(1), "image/png")).statusCode).toBe(415);
    expect((await upload("ann", jpeg(1, 2 * 1024 * 1024))).statusCode).toBe(413);
    expect((await upload("nobody", jpeg())).statusCode).toBe(404);
  });

  it("needs the admin PIN to change a photo, not to see one", async () => {
    const { app, upload } = setup("1234");
    expect((await upload("ann", jpeg())).statusCode).toBe(401);
    db.setPhoto("ann", jpeg());
    expect((await app.inject("/api/players/ann/photo")).statusCode).toBe(200);
  });

  it("goes with the player, and into the backups", () => {
    const dir = mkdtempSync(join(tmpdir(), "n4-photos-"));
    db = openDb(join(dir, "n4-darts.db"));
    db.addPlayer({ id: "ann", name: "Ann", archived: false });
    db.addPlayer({ id: "bob", name: "Bob", archived: false });
    db.setPhoto("ann", jpeg(3));
    db.setPhoto("bob", jpeg(4));

    backupIfDue(db, join(dir, "backups"), { log: () => {} });
    const copy = openDb(join(dir, "backups", backupsIn(join(dir, "backups"))[0] as string));
    expect(Buffer.from(copy.photo("ann")?.jpeg ?? []).equals(jpeg(3))).toBe(true);
    copy.close();

    db.deletePlayer("bob");
    expect(db.photo("bob")).toBeUndefined();
  });
});

describe("photos in the tournament", () => {
  it("come with the group table rows and the bracket's players", async () => {
    const { app, upload } = setup();
    for (const [id, name] of [
      ["bob", "Bob"],
      ["cid", "Cid"],
    ]) {
      db.addPlayer({ id: id as string, name: name as string, archived: false });
    }
    const version = ((await upload("ann", jpeg())).json() as Player).photo;
    await app.inject({
      method: "POST",
      url: "/api/admin/tournament",
      payload: { playerIds: ["ann", "bob", "cid"] },
    });
    await app.inject({ method: "POST", url: "/api/admin/tournament/start" });
    const display = (await app.inject("/api/display")).json() as DisplayView;
    const group = display.groups[0];
    expect(group?.table.find((r) => r.playerId === "ann")?.photo).toBe(version);
    expect(group?.table.find((r) => r.playerId === "bob")?.photo).toBeNull();
    const fixture = group?.fixtures.find((f) => f.players.includes("Ann"));
    const ann = fixture?.sides.find((p) => p?.id === "ann");
    expect(ann).toEqual({ id: "ann", name: "Ann", photo: version });
  });
});
