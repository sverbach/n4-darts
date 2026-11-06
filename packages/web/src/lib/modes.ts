import { isX01Match, scoresPoints } from "@n4/engine";
import type { MatchView } from "@n4/server/api";
import type { Highlight } from "../components/Dartboard.tsx";
import { MODE_NAMES, matchRulesLabel, targetLabel } from "./labels.ts";

export function targetsOf(match: MatchView): { highlight: Highlight[]; label: string } | null {
  if (match.state.mode !== "aroundTheClock") return null;
  const target = match.state.players[match.state.currentPlayer]?.target ?? null;
  if (target === null) return { highlight: [], label: "Finished" };
  return { highlight: [{ number: target }], label: `Aim at ${targetLabel(target)}` };
}

export function visitTotalLabel(match: MatchView): string {
  return scoresPoints(match.settings.mode) ? "Total" : "Hits";
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
  return matchRulesLabel(match.settings);
}
