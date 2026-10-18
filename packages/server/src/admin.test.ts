import { describe, expect, it } from "vitest";
import { buildApp } from "./app.ts";

/** An admin route that later tickets fill in; here it only proves the guard. */
function appWith(adminPin: string | undefined) {
  const app = buildApp({ adminPin });
  app.get("/api/admin/ping", async () => ({ ok: true }));
  return app;
}

const login = (app: ReturnType<typeof appWith>, pin: string) =>
  app.inject({ method: "POST", url: "/api/admin/login", payload: { pin } });

const cookieOf = (res: Awaited<ReturnType<typeof login>>) =>
  String(res.headers["set-cookie"]).split(";")[0] as string;

describe("admin PIN", () => {
  it("refuses admin routes without logging in", async () => {
    const app = appWith("1234");

    expect((await app.inject("/api/admin/ping")).statusCode).toBe(401);
    expect((await app.inject("/api/admin/session")).json()).toEqual({
      pinRequired: true,
      authenticated: false,
    });
  });

  it("rejects a wrong PIN", async () => {
    const res = await login(appWith("1234"), "0000");

    expect(res.statusCode).toBe(401);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("lets a device in for 30 days after the right PIN", async () => {
    const app = appWith("1234");
    const res = await login(app, "1234");

    expect(res.statusCode).toBe(204);
    const setCookie = String(res.headers["set-cookie"]);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain(`Max-Age=${30 * 24 * 60 * 60}`);

    const cookie = cookieOf(res);
    expect((await app.inject({ url: "/api/admin/ping", headers: { cookie } })).statusCode).toBe(
      200,
    );
    expect((await app.inject({ url: "/api/admin/session", headers: { cookie } })).json()).toEqual({
      pinRequired: true,
      authenticated: true,
    });
  });

  it("stays logged in across a server restart, but not after the PIN changes", async () => {
    const cookie = cookieOf(await login(appWith("1234"), "1234"));

    const restarted = appWith("1234");
    expect(
      (await restarted.inject({ url: "/api/admin/ping", headers: { cookie } })).statusCode,
    ).toBe(200);
    const newPin = appWith("9999");
    expect((await newPin.inject({ url: "/api/admin/ping", headers: { cookie } })).statusCode).toBe(
      401,
    );
  });

  it("logs out", async () => {
    const app = appWith("1234");
    const cookie = cookieOf(await login(app, "1234"));
    const res = await app.inject({ method: "POST", url: "/api/admin/logout", headers: { cookie } });

    expect(String(res.headers["set-cookie"])).toContain("Max-Age=0");
  });

  it("is open when no PIN is configured", async () => {
    const app = appWith(undefined);

    expect((await app.inject("/api/admin/ping")).statusCode).toBe(200);
    expect((await app.inject("/api/admin/session")).json()).toEqual({
      pinRequired: false,
      authenticated: true,
    });
  });

  it("leaves station routes open", async () => {
    expect((await appWith("1234").inject("/api/stations")).statusCode).toBe(200);
  });
});
