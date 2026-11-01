// One format per kind of value, the same on every screen (ui-slop 09).

/** An empty value: no average yet, no checkout, no opponent. */
export const NONE = "–";

/** A 3-dart average to one decimal, or NONE. */
export const average = (value: number | null) => (value === null ? NONE : value.toFixed(1));

/** A count or score, or NONE. */
export const count = (value: number | null) => (value === null ? NONE : String(value));

/** Legs won, in the given order: "2–1". */
export const legScore = (legs: number[]) => legs.join("–");

/** A final placing: "2", or "3–4" when shared. */
export const placing = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
