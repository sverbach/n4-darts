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

function entryKey(): string {
  const state = (history.state ?? {}) as { n4Entry?: string };
  if (state.n4Entry) return state.n4Entry;
  const key = Math.random().toString(36).slice(2);
  history.replaceState({ ...state, n4Entry: key }, "");
  return key;
}

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
    if (location === shown.current) return;
    shown.current = location;
    entry.current = entryKey();
    const target = positions.current.get(entry.current) ?? 0;
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
