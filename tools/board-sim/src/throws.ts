// Board Manager throw objects, as documented in docs/board-manager-api.md.

export interface BoardThrow {
  bouncer: boolean;
  coords: { x: number; y: number };
  segment: { bed: string; multiplier: number; name: string; number: number };
}

/** Clockwise from the top, as on the board. */
const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/** Up to ±0.01 so no two darts land on exactly the same spot, as on a real board. */
const scatter = () => (Math.random() - 0.5) * 0.02;

/** Normalised board coordinates: bull at (0,0), double ring at ~0.95, y toward 20. */
function coordsFor(number: number, radius: number) {
  const angle = ((90 - ORDER.indexOf(number) * 18) * Math.PI) / 180;
  return { x: radius * Math.cos(angle) + scatter(), y: radius * Math.sin(angle) + scatter() };
}

/**
 * Builds a throw from short notation: `S20` (inner single), `SO20` (outer single), `D20`, `T20`,
 * `25` (outer bull), `BULL`, `M17` (off the board near 17), `BOUNCE` (bounce-out).
 */
export function throwFor(name: string): BoardThrow {
  const upper = name.toUpperCase();
  if (upper === "BOUNCE") {
    const segment = { bed: "Outside", multiplier: 0, name: "Miss", number: 0 };
    return { bouncer: true, coords: { x: 0, y: 0 }, segment };
  }
  if (upper === "25") {
    const segment = { bed: "Single", multiplier: 1, name: "25", number: 25 };
    return { bouncer: false, coords: { x: scatter(), y: 0.07 + scatter() }, segment };
  }
  if (upper === "BULL") {
    // Not yet observed on a real board: bed and name are a guess (see docs/board-manager-api.md).
    const segment = { bed: "Double", multiplier: 2, name: "Bull", number: 25 };
    return { bouncer: false, coords: { x: scatter(), y: scatter() }, segment };
  }

  const match = /^(SO|S|D|T|M)(\d{1,2})$/.exec(upper);
  const number = Number(match?.[2]);
  if (!match || !ORDER.includes(number)) throw new Error(`unknown dart "${name}"`);
  const kinds = {
    S: { bed: "SingleInner", multiplier: 1, radius: 0.3, prefix: "S" },
    SO: { bed: "SingleOuter", multiplier: 1, radius: 0.8, prefix: "S" },
    D: { bed: "Double", multiplier: 2, radius: 0.95, prefix: "D" },
    T: { bed: "Triple", multiplier: 3, radius: 0.6, prefix: "T" },
    M: { bed: "Outside", multiplier: 0, radius: 1.15, prefix: "M" },
  };
  const kind = kinds[match[1] as keyof typeof kinds];
  return {
    bouncer: false,
    coords: coordsFor(number, kind.radius),
    segment: {
      bed: kind.bed,
      multiplier: kind.multiplier,
      name: `${kind.prefix}${number}`,
      number,
    },
  };
}
