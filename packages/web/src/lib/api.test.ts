import { afterEach, describe, expect, it, vi } from "vitest";
import { call, request } from "./api.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Stubs `fetch` with one answer and returns the spy, to check what was sent. */
function answer(status: number, body?: unknown) {
  const spy = vi.fn(
    async (_url: string, _init?: RequestInit) =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", spy);
  return spy;
}

describe("call", () => {
  it("resolves to the data on success", async () => {
    answer(200, [{ id: "ann" }]);
    expect(await call("GET", "/api/x")).toEqual({
      data: [{ id: "ann" }],
      error: null,
      status: 200,
    });
  });

  it("sends a JSON body as JSON and a photo as itself", async () => {
    const spy = answer(201, {});
    await call("POST", "/api/x", { name: "Ann" });
    expect(spy.mock.calls[0]).toEqual([
      "/api/x",
      { method: "POST", headers: { "content-type": "application/json" }, body: '{"name":"Ann"}' },
    ]);

    const photo = new Blob(["jpeg"], { type: "image/jpeg" });
    await call("PUT", "/api/x/photo", photo);
    expect(spy.mock.calls[1]?.[1]).toEqual({
      method: "PUT",
      headers: { "content-type": "image/jpeg" },
      body: photo,
    });
  });

  it("resolves to the server's error message and status", async () => {
    answer(409, { error: "Name taken" });
    expect(await call("POST", "/api/x", {})).toEqual({
      data: null,
      error: "Name taken",
      status: 409,
    });
  });

  it("names the status when the server gives no message", async () => {
    answer(500);
    expect((await call("GET", "/api/x")).error).toBe("Server error 500");
  });

  it("says the server isn't reachable when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new TypeError("offline"))),
    );
    expect(await call("GET", "/api/x")).toEqual({
      data: null,
      error: "Server not reachable",
      status: null,
    });
  });

  it("takes an empty answer (204) as success", async () => {
    answer(204);
    expect(await request("DELETE", "/api/x")).toBeNull();
  });
});
