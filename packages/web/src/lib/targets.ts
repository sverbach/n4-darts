import type { MatchView } from "@n4/server/api";
import type { Highlight } from "../components/Dartboard.tsx";
import { targetLabel } from "./labels.ts";

export function targetsOf(match: MatchView): { highlight: Highlight[]; label: string } | null {
  if (match.settings.mode === "x01" || match.state.mode === "x01") return null;
  const target = match.state.players[match.state.currentPlayer]?.target ?? null;
  if (target === null) return { highlight: [], label: "Finished" };
  return { highlight: [{ number: target }], label: `Aim at ${targetLabel(target)}` };
}

export function visitTotalLabel(match: MatchView): string {
  return match.settings.mode === "x01" ? "Total" : "Hits";
}
