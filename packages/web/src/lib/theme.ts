import { useSyncExternalStore } from "react";

export const THEMES = [
  { id: "violet", name: "Unit violet" },
  { id: "cyan", name: "Terminal cyan" },
  { id: "green", name: "Phosphor green" },
  { id: "magenta", name: "Synth magenta" },
  { id: "yellow", name: "Caution yellow" },
  { id: "orange", name: "Mecha orange" },
  { id: "daylight", name: "Daylight" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export type Theme = (typeof THEMES)[number];

export const THEME_KEY = "n4-theme";
const GROUND = { dark: "#060708", light: "#f2ede6" };

const isTheme = (id: unknown): id is ThemeId => THEMES.some((t) => t.id === id);

function stored(): ThemeId {
  try {
    const id = localStorage.getItem(THEME_KEY);
    return isTheme(id) ? id : "violet";
  } catch {
    return "violet";
  }
}

export function themeAfter(id: ThemeId): Theme {
  const i = THEMES.findIndex((t) => t.id === id);
  return THEMES[(i + 1) % THEMES.length] as Theme;
}

export const themeOf = (id: ThemeId) => THEMES.find((t) => t.id === id) as Theme;

function apply(id: ThemeId) {
  const root = document.documentElement;
  if (id === "violet") delete root.dataset.theme;
  else root.dataset.theme = id;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", id === "daylight" ? GROUND.light : GROUND.dark);
}

const listeners = new Set<() => void>();
let current: ThemeId = typeof window === "undefined" ? "violet" : stored();

function set(id: ThemeId) {
  current = id;
  apply(id);
  try {
    localStorage.setItem(THEME_KEY, id);
  } catch {}
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const fromOtherTab = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    current = stored();
    apply(current);
    listener();
  };
  window.addEventListener("storage", fromOtherTab);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", fromOtherTab);
  };
}

export function useTheme() {
  const id = useSyncExternalStore(
    subscribe,
    () => current,
    (): ThemeId => "violet",
  );
  return { theme: themeOf(id), next: () => set(themeAfter(id).id) };
}
