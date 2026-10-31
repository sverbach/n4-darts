// Labels for a match's settings, shared by the station, /watch and /admin.

import type { X01Settings } from "@n4/engine";

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

/** Every rule of a match in one line, the same on every screen: "501 · Double out · First to 3 legs". */
export function matchRulesLabel(settings: X01Settings) {
  return `${rulesLabel(settings)} · ${legsLabel(settings.legsToWin)}`;
}
