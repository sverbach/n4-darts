import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";

describe("server", () => {
  it("reports health", async () => {
    const res = await buildApp().inject("/api/health");
    expect(res.json()).toEqual({ ok: true });
  });

  it("serves the web app for client-side routes", async () => {
    const webDir = mkdtempSync(join(tmpdir(), "n4-web-"));
    writeFileSync(join(webDir, "index.html"), "<p>n4</p>");
    const app = buildApp({ webDir });

    expect((await app.inject("/station/1")).body).toBe("<p>n4</p>");
    expect((await app.inject("/api/nope")).statusCode).toBe(404);
  });
});
