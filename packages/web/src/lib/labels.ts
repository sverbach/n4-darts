// Labels for a match's settings, shared by the station, /watch and /admin.

import type { MatchSettings, Mode, X01Settings } from "@n4/engine";

export function livesLabel(lives: number) {
  return `${lives} ${lives === 1 ? "life" : "lives"}`;
}

export function roundsLabel(rounds: number) {
  return `${rounds} ${rounds === 1 ? "round" : "rounds"}`;
}

export function legsLabel(legsToWin: number) {
  return `First to ${legsToWin} ${legsToWin === 1 ? "leg" : "legs"}`;
}

const IN_RULES = { straight: "", double: "Double in", master: "Master in", bull: "Bull in" };
const OUT_RULES = { straight: "Single out", double: "Double out", master: "Master out" };

/** "501 · Double in · Double out". */
export function rulesLabel(settings: X01Settings) {
  return [settings.startScore, IN_RULES[settings.inRule], OUT_RULES[settings.outRule]]
    .filter(Boolean)
    .join(" · ");
}

export const MODE_NAMES: Record<Mode, string> = {
  x01: "X01",
  aroundTheClock: "Around the Clock",
  golf: "Golf",
  highScore: "High Score",
  killer: "Killer",
  cricket: "Cricket",
};

export function matchRulesLabel(settings: MatchSettings) {
  if (settings.mode === "aroundTheClock" && settings.skipAhead) {
    return `${MODE_NAMES.aroundTheClock} · Skip-ahead`;
  }
  if (settings.mode === "cricket") {
    return settings.variant === "cutThroat" ? "Cut-throat Cricket" : MODE_NAMES.cricket;
  }
  if (settings.mode === "killer") return `${MODE_NAMES.killer} · ${livesLabel(settings.lives)}`;
  if (settings.mode === "golf") {
    const course = settings.course === "random" ? " · Random" : "";
    return `${MODE_NAMES.golf} · ${settings.holes} holes${course}`;
  }
  if (settings.mode === "highScore")
    return `${MODE_NAMES.highScore} · ${roundsLabel(settings.rounds)}`;
  if (settings.mode !== "x01") return MODE_NAMES[settings.mode];
  return `${rulesLabel(settings)} · ${legsLabel(settings.legsToWin)}`;
}

export const targetLabel = (target: number) => (target === 25 ? "Bull" : String(target));
