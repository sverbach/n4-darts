import { describe, expect, it } from "vitest";
import { THEMES, themeAfter } from "./theme.ts";

describe("themes", () => {
  it("cycles through all seven, Daylight last, then back to violet", () => {
    const seen: string[] = [THEMES[0].id];
    let id: (typeof THEMES)[number]["id"] = THEMES[0].id;
    for (let i = 0; i < THEMES.length; i++) {
      id = themeAfter(id).id;
      seen.push(id);
    }
    expect(seen).toEqual([
      "violet",
      "cyan",
      "green",
      "magenta",
      "yellow",
      "orange",
      "daylight",
      "violet",
    ]);
  });
});
