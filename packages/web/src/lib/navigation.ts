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

/** This history entry's key, given the first time the entry is shown. */
function entryKey(): string {
  const state = (history.state ?? {}) as { n4Entry?: string };
  if (state.n4Entry) return state.n4Entry;
  const key = Math.random().toString(36).slice(2);
  history.replaceState({ ...state, n4Entry: key }, "");
  return key;
}

/**
 * Runs once in the app: title, scroll and focus after every client-side navigation. Scroll
 * positions are kept per history entry (a key in `history.state`): an entry that already has one
 * is a Back or Forward and gets its position back; a new entry starts at the top.
 */
export function useNavigationEffects() {
  const [location] = useLocation();
  const shown = useRef(location);
  const entry = useRef<string | null>(null);
  const positions = useRef(new Map<string, number>());

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    entry.current = entryKey();
    const onScroll = () => {
      if (entry.current) positions.current.set(entry.current, window.scrollY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    document.title = pageTitle(location);
    if (location === shown.current) return; // the first page, as loaded
    shown.current = location;
    entry.current = entryKey();
    const target = positions.current.get(entry.current) ?? 0;
    // A page that loads its data grows, and gets its heading, after the first render: try both
    // again for a moment.
    let tries = 0;
    let focused = false;
    const settle = () => {
      window.scrollTo(0, target);
      if (!focused) {
        const heading = document.querySelector<HTMLElement>("main h1, h1");
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
          focused = true;
        }
      }
      const scrolled = Math.abs(window.scrollY - target) <= 1;
      if ((!scrolled || !focused) && tries++ < 20) setTimeout(settle, 50);
    };
    settle();
  }, [location]);
}
