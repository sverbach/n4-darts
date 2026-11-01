import { describe, expect, it } from "vitest";
import { pageTitle } from "./navigation.ts";

describe("page titles", () => {
  it("names each page, the app last", () => {
    expect(pageTitle("/")).toBe("n4-darts");
    expect(pageTitle("/station/2")).toBe("Station 2 · n4-darts");
    expect(pageTitle("/watch/1")).toBe("Watch station 1 · n4-darts");
    expect(pageTitle("/display")).toBe("Projector · n4-darts");
    expect(pageTitle("/players")).toBe("Players · n4-darts");
    expect(pageTitle("/players/p-ann")).toBe("Player · n4-darts");
  });

  it("names the admin section, the tournament by default", () => {
    expect(pageTitle("/admin")).toBe("Admin · Tournament · n4-darts");
    expect(pageTitle("/admin/matches")).toBe("Admin · Matches · n4-darts");
  });

  it("falls back to the app's name for anything else", () => {
    expect(pageTitle("/nope")).toBe("n4-darts");
  });
});
