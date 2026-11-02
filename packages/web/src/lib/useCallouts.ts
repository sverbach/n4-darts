import type { MatchState } from "@n4/engine";
import type { MatchView } from "@n4/server/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { call } from "./api.ts";
import { callsFor } from "./callouts.ts";
import { type CallPack, createCallPlayer, defaultPack } from "./callPlayer.ts";

const STORAGE_KEY = "n4.sound";

function stored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function store(on: boolean) {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, "on");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export interface Callouts {
  on: boolean;
  needsTap: boolean;
  toggle(): void;
}

export function useCallouts(
  match: MatchView | null,
  options: { wakeLock?: boolean } = {},
): Callouts {
  const [on, setOn] = useState(stored);
  const [unlocked, setUnlocked] = useState(false);
  const player = useRef(createCallPlayer()).current;
  const last = useRef<{ id: string; state: MatchState } | null>(null);
  const active = on && unlocked;

  const unlock = useCallback(() => {
    player.unlock().then(
      () => setUnlocked(true),
      () => {},
    );
  }, [player]);

  useEffect(() => () => player.close(), [player]);

  useEffect(() => {
    if (!on || unlocked) return;
    const tap = () => unlock();
    document.addEventListener("click", tap, true);
    document.addEventListener("keydown", tap, true);
    return () => {
      document.removeEventListener("click", tap, true);
      document.removeEventListener("keydown", tap, true);
    };
  }, [on, unlocked, unlock]);

  useEffect(() => {
    if (!active) return;
    let stale = false;
    void call<CallPack>("GET", "/api/callouts").then((result) => {
      if (!stale) player.load(result.data ?? defaultPack);
    });
    return () => {
      stale = true;
      player.stop();
    };
  }, [active, player]);

  useEffect(() => {
    const previous = last.current;
    last.current = match ? { id: match.id, state: match.state } : null;
    if (!active || !match || previous?.id !== match.id) return;
    const keys = callsFor(previous.state, match.state);
    if (keys.length) player.play(keys);
  }, [match, active, player]);

  const wakeLock = options.wakeLock ?? false;
  useEffect(() => {
    if (!active || !wakeLock || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let done = false;
    const request = () => {
      if (document.visibilityState !== "visible") return;
      navigator.wakeLock.request("screen").then(
        (sentinel) => {
          if (done) void sentinel.release();
          else lock = sentinel;
        },
        () => {},
      );
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      done = true;
      document.removeEventListener("visibilitychange", request);
      void lock?.release();
    };
  }, [active, wakeLock]);

  const toggle = useCallback(() => {
    const next = !on;
    store(next);
    setOn(next);
    if (next) unlock();
    else setUnlocked(false);
  }, [on, unlock]);

  return { on, needsTap: on && !unlocked, toggle };
}
