import { describe, expect, it } from "vitest";
import { pageTitle } from "./navigation.ts";

describe("page titles", () => {
  it("names each page, the app last", () => {
    expect(pageTitle("/")).toBe("darts");
    expect(pageTitle("/station/2")).toBe("Station 2 · darts");
    expect(pageTitle("/watch/1")).toBe("Watch station 1 · darts");
    expect(pageTitle("/display")).toBe("Projector · darts");
    expect(pageTitle("/players")).toBe("Players · darts");
    expect(pageTitle("/players/p-ann")).toBe("Player · darts");
  });

  it("names the admin section, the tournament by default", () => {
    expect(pageTitle("/admin")).toBe("Admin · Tournament · darts");
    expect(pageTitle("/admin/matches")).toBe("Admin · Matches · darts");
  });

  it("falls back to the app's name for anything else", () => {
    expect(pageTitle("/nope")).toBe("darts");
  });
});
