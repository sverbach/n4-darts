import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Confetti } from "./Confetti.tsx";

function renderWith(reducedMotion: boolean) {
  vi.stubGlobal("window", {
    innerWidth: 1280,
    innerHeight: 720,
    matchMedia: (query: string) => ({ matches: reducedMotion && query.includes("reduce") }),
  });
  vi.stubGlobal("document", { documentElement: {} });
  vi.stubGlobal("getComputedStyle", () => ({
    getPropertyValue: (token: string) => (token === "--accent" ? " #a68cff" : ""),
  }));
  return renderToString(<Confetti />);
}

afterEach(() => vi.unstubAllGlobals());

describe("confetti", () => {
  it("bursts over the window", () => {
    const html = renderWith(false);
    expect(html).toContain("<canvas");
    expect(html).toContain('width="1280"');
  });

  it("stays away under reduced motion", () => {
    expect(renderWith(true)).toBe("");
  });
});
