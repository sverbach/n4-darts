import {
  CRICKET_ROUNDS,
  CRICKET_TARGETS,
  type CricketState,
  closedBy,
  type GolfState,
  holeTarget,
  isX01Match,
  type Mode,
} from "@n4/engine";
import type { MatchView } from "@n4/server/api";
import type { Highlight } from "../components/Dartboard.tsx";
import { MODE_NAMES, matchRulesLabel, targetLabel } from "./labels.ts";

export function targetsOf(match: MatchView): { highlight: Highlight[]; label: string } | null {
  if (match.state.mode === "golf") {
    const target = holeTarget(match.state.round, match.state.course);
    return {
      highlight: [{ number: target }],
      label: `Hole ${match.state.round}: aim at ${targetLabel(target)}`,
    };
  }
  if (match.state.mode === "cricket") {
    const { players, suddenDeath } = match.state;
    const open = suddenDeath
      ? [25]
      : CRICKET_TARGETS.filter((t) => !players.every((p) => closedBy(p, t)));
    return {
      highlight: open.map((number) => ({ number })),
      label: `Aim at ${open.map(targetLabel).join(", ")}`,
    };
  }
  if (match.state.mode === "killer") {
    const players = match.state.players;
    const thrower = players[match.state.currentPlayer];
    if (!thrower) return null;
    if (!thrower.killer) {
      return { highlight: [{ number: thrower.number }], label: `Charge up on ${thrower.number}` };
    }
    const prey = players.filter((p) => p !== thrower && p.lives > 0).map((p) => p.number);
    return {
      highlight: prey.map((number) => ({ number, multiplier: 2 as const })),
      label: `Doubles of ${prey.join(", ")}`,
    };
  }
  if (match.state.mode !== "aroundTheClock") return null;
  const target = match.state.players[match.state.currentPlayer]?.target ?? null;
  if (target === null) return { highlight: [], label: "Finished" };
  return { highlight: [{ number: target }], label: `Aim at ${targetLabel(target)}` };
}

export function cricketOf(match: MatchView): CricketState | null {
  return match.state.mode === "cricket" ? match.state : null;
}

export function golfOf(match: MatchView): { state: GolfState; holes: number } | null {
  if (match.state.mode !== "golf" || match.settings.mode !== "golf") return null;
  return { state: match.state, holes: match.settings.holes };
}

export function visitTotalLabel(mode: Mode): string {
  if (mode === "golf") return "Best";
  if (mode === "cricket") return "Marks";
  return mode === "aroundTheClock" || mode === "killer" ? "Hits" : "Total";
}

export function visitValue(mode: Mode, darts: readonly { score: number; ignored: boolean }[]) {
  const counted = darts.filter((d) => !d.ignored).map((d) => d.score);
  if (mode === "golf") return counted.length ? Math.min(...counted) : 0;
  return counted.reduce((sum, score) => sum + score, 0);
}

export function liveLabel(match: MatchView): string {
  if (isX01Match(match)) {
    const { legs } = match.state;
    const leg = match.settings.legsToWin > 1 && legs.length > 0 ? ` · Leg ${legs.length}` : "";
    return `${matchRulesLabel(match.settings)}${leg}`;
  }
  if (match.state.mode === "highScore" && match.settings.mode === "highScore") {
    const { round, suddenDeath } = match.state;
    const progress = suddenDeath ? "Sudden death" : `Round ${round} of ${match.settings.rounds}`;
    return `${MODE_NAMES.highScore} · ${progress}`;
  }
  if (match.state.mode === "cricket") {
    const { round, suddenDeath } = match.state;
    const progress = suddenDeath
      ? "Sudden death at the bull"
      : `Round ${round} of ${CRICKET_ROUNDS}`;
    return `${matchRulesLabel(match.settings)} · ${progress}`;
  }
  if (match.state.mode === "golf" && match.settings.mode === "golf") {
    const { round, suddenDeath } = match.state;
    const progress = suddenDeath
      ? `Sudden death · Hole ${round}`
      : `Hole ${round} of ${match.settings.holes}`;
    return `${MODE_NAMES.golf} · ${progress}`;
  }
  return matchRulesLabel(match.settings);
}
