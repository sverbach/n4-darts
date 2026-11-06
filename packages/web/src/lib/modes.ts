import { type GolfState, holeTarget, isX01Match, type Mode } from "@n4/engine";
import type { MatchView } from "@n4/server/api";
import type { Highlight } from "../components/Dartboard.tsx";
import { MODE_NAMES, matchRulesLabel, targetLabel } from "./labels.ts";

export function targetsOf(match: MatchView): { highlight: Highlight[]; label: string } | null {
  if (match.state.mode === "golf") {
    const target = holeTarget(match.state.round);
    return {
      highlight: [{ number: target }],
      label: `Hole ${match.state.round}: aim at ${targetLabel(target)}`,
    };
  }
  if (match.state.mode !== "aroundTheClock") return null;
  const target = match.state.players[match.state.currentPlayer]?.target ?? null;
  if (target === null) return { highlight: [], label: "Finished" };
  return { highlight: [{ number: target }], label: `Aim at ${targetLabel(target)}` };
}

export function golfOf(match: MatchView): { state: GolfState; holes: number } | null {
  if (match.state.mode !== "golf" || match.settings.mode !== "golf") return null;
  return { state: match.state, holes: match.settings.holes };
}

export function visitTotalLabel(mode: Mode): string {
  return mode === "golf" ? "Best" : mode === "aroundTheClock" ? "Hits" : "Total";
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
  if (match.state.mode === "golf" && match.settings.mode === "golf") {
    const { round, suddenDeath } = match.state;
    const progress = suddenDeath
      ? `Sudden death · Hole ${round}`
      : `Hole ${round} of ${match.settings.holes}`;
    return `${MODE_NAMES.golf} · ${progress}`;
  }
  return matchRulesLabel(match.settings);
}
