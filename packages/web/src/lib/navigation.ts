// What a full page load used to do and client-side navigation doesn't by itself (web-router 02):
// the tab's title, the scroll position (top on a new page, where you were on Back) and focus on
// the new page's heading, so a screen reader announces it.

import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "wouter";

const SUFFIX = "n4-darts";
const ADMIN = {
  tournament: "Tournament",
  players: "Players",
  stations: "Stations",
  matches: "Matches",
  diagnostics: "Diagnostics",
} as Record<string, string>;

/** The browser tab's title for a path: "Station 1 · n4-darts", "Admin · Players · n4-darts". */
export function pageTitle(path: string): string {
  const parts = path.split("/").filter(Boolean);
  const [first, second] = parts;
  const name =
    first === "station" && second
      ? `Station ${second}`
      : first === "watch" && second
        ? `Watch station ${second}`
        : first === "display"
          ? "Projector"
          : first === "players"
            ? second
              ? "Player"
              : "Players"
            : first === "admin"
              ? `Admin · ${ADMIN[second ?? "tournament"] ?? "Tournament"}`
              : null;
  return name ? `${name} · ${SUFFIX}` : SUFFIX;
}

/** Runs once in the app: title, scroll and focus after every client-side navigation. */
export function useNavigationEffects() {
  const [location] = useLocation();
  const shown = useRef(location);
  const positions = useRef(new Map<string, number>());
  const back = useRef(false);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const onPop = () => {
      back.current = true;
    };
    const onScroll = () => positions.current.set(shown.current, window.scrollY);
    window.addEventListener("popstate", onPop);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useLayoutEffect(() => {
    document.title = pageTitle(location);
    if (location === shown.current) return; // the first page, as loaded
    shown.current = location;
    const target = back.current ? (positions.current.get(location) ?? 0) : 0;
    back.current = false;
    // A page that loads its data grows after the first render: try again for a moment.
    let tries = 0;
    const restore = () => {
      window.scrollTo(0, target);
      if (Math.abs(window.scrollY - target) > 1 && tries++ < 20) setTimeout(restore, 50);
    };
    restore();
    requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("main h1, h1");
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
  }, [location]);
}
