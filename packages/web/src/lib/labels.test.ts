import { defaultX01Settings } from "@n4/engine";
import { describe, expect, it } from "vitest";
import { legsLabel, matchRulesLabel, rulesLabel } from "./labels.ts";

describe("match labels", () => {
  it("leaves out a straight in rule", () => {
    expect(rulesLabel({ ...defaultX01Settings, startScore: 501, outRule: "double" })).toBe(
      "501 · Double out",
    );
  });

  it("names every rule that isn't straight", () => {
    const settings = { ...defaultX01Settings, inRule: "master", outRule: "master" } as const;
    expect(rulesLabel(settings)).toBe("301 · Master in · Master out");
  });

  it("counts legs as first to n", () => {
    expect(legsLabel(1)).toBe("First to 1 leg");
    expect(legsLabel(3)).toBe("First to 3 legs");
  });

  it("puts the rules and the legs in one line", () => {
    const settings = {
      ...defaultX01Settings,
      startScore: 701,
      inRule: "double",
      legsToWin: 2,
    } as const;
    expect(matchRulesLabel(settings)).toBe("701 · Double in · Single out · First to 2 legs");
  });
});
