// Which page each path shows. The pages are stubbed: this is only about the routes.

import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { App } from "./App.tsx";

vi.mock("./features/station/StationPage.tsx", () => ({
  StationPage: ({ id }: { id: number }) => `[station ${id}]`,
}));
vi.mock("./features/watch/WatchPage.tsx", () => ({
  WatchPage: ({ id }: { id: number }) => `[watch ${id}]`,
}));
vi.mock("./features/display/DisplayPage.tsx", () => ({ DisplayPage: () => "[display]" }));
vi.mock("./features/stats/StatsPages.tsx", () => ({
  LeaderboardPage: () => "[leaderboard]",
  ProfilePage: ({ id }: { id: string }) => `[profile ${id}]`,
}));
vi.mock("./features/admin/AdminPage.tsx", async (actual) => ({
  ...(await actual<typeof import("./features/admin/AdminPage.tsx")>()),
  AdminPage: ({ section }: { section: string }) => `[admin ${section}]`,
}));

/** What the app renders at `path`: a stub's marker, or "home". */
function pageAt(path: string) {
  vi.stubGlobal("window", { location: { pathname: path } });
  const html = renderToString(
    <Router ssrPath={path}>
      <App />
    </Router>,
  );
  const marker = /\[([^\]]+)\]/.exec(html);
  if (marker) return marker[1];
  return html.includes("Players and stats") ? "home" : html;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("routes", () => {
  it.each([
    ["/", "home"],
    ["/station/1", "station 1"],
    ["/station/12/", "station 12"],
    ["/station/x", "home"],
    ["/station/1/more", "home"],
    ["/watch/2", "watch 2"],
    ["/display", "display"],
    ["/display/", "display"],
    ["/players", "leaderboard"],
    ["/players/", "leaderboard"],
    ["/players/Ann%20B", "profile Ann B"],
    ["/admin", "admin tournament"],
    ["/admin/", "admin tournament"],
    ["/admin/players", "admin players"],
    ["/admin/diagnostics", "admin diagnostics"],
    ["/admin/nope", "home"],
    ["/nope", "home"],
  ])("%s shows %s", (path, page) => {
    expect(pageAt(path)).toBe(page);
  });
});
