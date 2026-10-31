import { describe, expect, it } from "vitest";
import { upNextLabel } from "./display.ts";

describe("up next labels", () => {
  it("drops the fixture number in the group phase", () => {
    expect(upNextLabel("Group match 4")).toBe("");
    expect(upNextLabel("Group B · match 2")).toBe("Group B");
  });

  it("keeps knockout labels", () => {
    expect(upNextLabel("Semi-final 2")).toBe("Semi-final 2");
    expect(upNextLabel("Losers round 1 2")).toBe("Losers round 1 2");
  });
});
