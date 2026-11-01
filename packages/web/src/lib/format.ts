export const NONE = "–";

export const average = (value: number | null) => (value === null ? NONE : value.toFixed(1));

export const count = (value: number | null) => (value === null ? NONE : String(value));

export const legScore = (legs: number[]) => legs.join("–");

export const placing = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);
