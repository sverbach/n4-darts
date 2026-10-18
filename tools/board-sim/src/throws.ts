// Board Manager throw objects, as documented in docs/board-manager-api.md.

export interface BoardThrow {
  bouncer: boolean;
  coords: { x: number; y: number };
  segment: { bed: string; multiplier: number; name: string; number: number };
}

/** Clockwise from the top, as on the board. */
export const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/** Board Manager's coordinates put the outside of the double ring at about 0.99, fitted to recorded darts. */
const SCALE = 0.99 / 170;

/** Ring edges in normalised board coordinates, from a regulation board's radii in mm. */
export const RINGS = {
  bull: 6.35 * SCALE,
  outerBull: 15.9 * SCALE,
  trebleInner: 99 * SCALE,
  trebleOuter: 107 * SCALE,
  doubleInner: 162 * SCALE,
  doubleOuter: 170 * SCALE,
} as const;

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
    D: { bed: "Double", multiplier: 2, radius: 0.966, prefix: "D" },
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

/** The number whose wedge contains the direction of (x, y). */
function numberAt(x: number, y: number): number {
  const degrees = (Math.atan2(y, x) * 180) / Math.PI;
  const index = Math.round((90 - degrees) / 18);
  return ORDER[((index % 20) + 20) % 20] as number;
}

/** The throw a dart landing at normalised board coordinates would produce, e.g. from a click. */
export function throwAt(coords: { x: number; y: number }): BoardThrow {
  const { x, y } = coords;
  const radius = Math.hypot(x, y);
  const number = numberAt(x, y);
  const make = (bed: string, multiplier: number, name: string, n = number): BoardThrow => ({
    bouncer: false,
    coords: { x, y },
    segment: { bed, multiplier, name, number: n },
  });
  // Same beds and names as `throwFor`, so a click and its notation are indistinguishable.
  if (radius <= RINGS.bull) return make("Double", 2, "Bull", 25);
  if (radius <= RINGS.outerBull) return make("Single", 1, "25", 25);
  if (radius < RINGS.trebleInner) return make("SingleInner", 1, `S${number}`);
  if (radius <= RINGS.trebleOuter) return make("Triple", 3, `T${number}`);
  if (radius < RINGS.doubleInner) return make("SingleOuter", 1, `S${number}`);
  if (radius <= RINGS.doubleOuter) return make("Double", 2, `D${number}`);
  return make("Outside", 0, `M${number}`);
}
